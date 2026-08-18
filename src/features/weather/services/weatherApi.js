import { readStorage, writeStorage } from "../../../shared/utils/storage.js";

const API_BASE = "https://api.openweathermap.org";
const DASHBOARD_TTL_MS = 10 * 60 * 1000;
const GEO_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const dashboardInFlight = new Map();

const demoWeather = { city: "Bengaluru", latitude: 12.9716, longitude: 77.5946, temperature: 25, feelsLike: 26, high: 28, low: 21, description: "scattered clouds", condition: "Clouds", humidity: 68, wind: 4.1, pressure: 1014, sunrise: "6:05 AM", sunset: "6:35 PM" };
const demoAir = { aqi: 2, pollutants: { pm2_5: 14.2, pm10: 26.8, o3: 41.3, no2: 12.4 } };
const demoForecast = [{ day: "Today", icon: "☂", high: 26, low: 24 }, { day: "Wed", icon: "☁", high: 27, low: 23 }, { day: "Thu", icon: "☀", high: 28, low: 22 }, { day: "Fri", icon: "☁", high: 27, low: 23 }, { day: "Sat", icon: "☂", high: 26, low: 22 }];
const demoHourly = [{ time: "Now", icon: "☂", temperature: 25, rain: 80 }, { time: "3 PM", icon: "☂", temperature: 25, rain: 70 }, { time: "6 PM", icon: "☁", temperature: 24, rain: 40 }, { time: "9 PM", icon: "☁", temperature: 23, rain: 20 }, { time: "12 AM", icon: "☁", temperature: 22, rain: 10 }];

const fallbackAir = { aqi: 2, pollutants: { pm2_5: 0, pm10: 0, o3: 0, no2: 0 } };

function getKey() { return import.meta.env.VITE_OPENWEATHER_API_KEY; }
const normalizeCity = (city) => city.trim().toLowerCase();
const geoKeyFor = (city) => `chameleon_geo_${normalizeCity(city)}`;
const dashboardKeyFor = (city, unit) => `chameleon_weather_${unit}_${normalizeCity(city)}`;

function readTimed(key) {
  const value = readStorage(key, null);
  if (!value || typeof value !== "object") return null;
  if (typeof value.expiresAt !== "number") return null;
  return value;
}

function writeTimed(key, data, ttlMs) {
  writeStorage(key, { data, expiresAt: Date.now() + ttlMs });
}

function readDashboardCache(city, unit) {
  const cached = readTimed(dashboardKeyFor(city, unit));
  if (!cached) return null;
  return { data: cached.data, stale: cached.expiresAt < Date.now() };
}

function readGeoCache(city) {
  const cached = readTimed(geoKeyFor(city));
  if (!cached || cached.expiresAt < Date.now()) return null;
  return cached.data;
}

async function resolvePlace(city, key, signal) {
  const cached = readGeoCache(city);
  if (cached) return cached;
  const geoResponse = await fetch(`${API_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`, { signal });
  if (!geoResponse.ok) throw new Error("We could not look up that city.");
  const [place] = await geoResponse.json();
  if (!place) throw new Error("No city was found with that name.");
  const result = { name: place.name, lat: place.lat, lon: place.lon };
  writeTimed(geoKeyFor(city), result, GEO_TTL_MS);
  return result;
}

function mapWeather(data, city, latitude, longitude) {
  return { city, latitude, longitude, temperature: Math.round(data.main.temp), feelsLike: Math.round(data.main.feels_like), high: Math.round(data.main.temp_max), low: Math.round(data.main.temp_min), description: data.weather[0].description, condition: data.weather[0].main, humidity: data.main.humidity, wind: data.wind.speed, pressure: data.main.pressure, sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) };
}

function mapForecast(data) {
  const days = new Map();
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const key = date.toLocaleDateString("en-US", { weekday: "short" });
    if (!days.has(key) && days.size < 5) days.set(key, { day: days.size === 0 ? "Today" : key, icon: { Clear: "☀", Clouds: "☁", Rain: "☂", Snow: "❄", Thunderstorm: "ϟ" }[item.weather[0].main] || "☀", high: Math.round(item.main.temp_max), low: Math.round(item.main.temp_min) });
  });
  return [...days.values()];
}

function mapHourly(data) {
  return data.list.slice(0, 5).map((item, index) => ({ time: index === 0 ? "Now" : new Date(item.dt * 1000).toLocaleTimeString([], { hour: "numeric" }), icon: { Clear: "☀", Clouds: "☁", Rain: "☂", Snow: "❄", Thunderstorm: "ϟ" }[item.weather[0].main] || "☀", temperature: Math.round(item.main.temp), rain: Math.round((item.pop || 0) * 100) }));
}

function buildData(place, weatherData, airData, forecastData) {
  return {
    weather: mapWeather(weatherData, place.name, place.lat, place.lon),
    air: { aqi: airData.list[0].main.aqi, pollutants: airData.list[0].components },
    forecast: mapForecast(forecastData),
    hourly: mapHourly(forecastData),
    isDemo: false
  };
}

export async function getDashboardDataProgressive(city, unit = "metric", options = {}) {
  const { onPartial, signal } = options;
  const key = getKey();
  if (!key) return { weather: { ...demoWeather, city }, air: demoAir, forecast: demoForecast, hourly: demoHourly, isDemo: true };

  const reqKey = `${unit}:${normalizeCity(city)}`;
  const cached = readDashboardCache(city, unit);
  if (cached) {
    onPartial?.(cached.data);
    if (!cached.stale) return cached.data;
  }

  if (dashboardInFlight.has(reqKey)) return dashboardInFlight.get(reqKey);

  const task = (async () => {
    const place = await resolvePlace(city, key, signal);
    const query = `lat=${place.lat}&lon=${place.lon}&appid=${key}`;
    const weatherPromise = fetch(`${API_BASE}/data/2.5/weather?${query}&units=${unit}`, { signal });
    const airPromise = fetch(`${API_BASE}/data/2.5/air_pollution?${query}`, { signal });
    const forecastPromise = fetch(`${API_BASE}/data/2.5/forecast?${query}&units=${unit}`, { signal });

    const weatherResponse = await weatherPromise;
    if (!weatherResponse.ok) throw new Error("Weather data is temporarily unavailable. Please try again.");
    const weatherData = await weatherResponse.json();
    const weather = mapWeather(weatherData, place.name, place.lat, place.lon);

    onPartial?.({
      weather,
      air: cached?.data?.air || fallbackAir,
      forecast: cached?.data?.forecast || [],
      hourly: cached?.data?.hourly || [],
      isDemo: false
    });

    const [airResponse, forecastResponse] = await Promise.all([airPromise, forecastPromise]);
    if (!airResponse.ok || !forecastResponse.ok) throw new Error("Weather data is temporarily unavailable. Please try again.");
    const [airData, forecastData] = await Promise.all([airResponse.json(), forecastResponse.json()]);
    const data = buildData(place, weatherData, airData, forecastData);
    writeTimed(dashboardKeyFor(city, unit), data, DASHBOARD_TTL_MS);
    return data;
  })();

  dashboardInFlight.set(reqKey, task);
  try {
    return await task;
  } finally {
    dashboardInFlight.delete(reqKey);
  }
}

export async function getDashboardData(city, unit = "metric") {
  return getDashboardDataProgressive(city, unit);
}
