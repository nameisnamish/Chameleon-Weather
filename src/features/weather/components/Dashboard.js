import { getDashboardDataProgressive } from "../services/weatherApi.js";
import { mountWeatherMap } from "./WeatherMap.js";

const aqiInfo = { 1: ["Good", "green"], 2: ["Fair", "lime"], 3: ["Moderate", "amber"], 4: ["Poor", "orange"], 5: ["Very poor", "red"] };
const iconFor = (condition) => ({ Clear: "☀", Clouds: "☁", Rain: "☂", Snow: "❄", Thunderstorm: "ϟ" }[condition] || "☀");
const brand = `<span class="brand">chameleon<span>.</span></span>`;

export function renderDashboard(root, { user, preferences, initialCity, onCityChange, onPreferencesChange, onOpenProfile, onOpenDashboard, onSignOut }) {
  let city = initialCity || preferences.homeCity;
  let state = { loading: true, refreshing: false, data: null, error: null };
  let mapLayer = "Map";
  let unmountMap = null;
  let requestId = 0;
  let controller = null;

  const load = async (nextCity = city) => {
    city = nextCity;
    onCityChange?.(city);
    const activeRequestId = ++requestId;
    controller?.abort();
    controller = new AbortController();

    state = state.data
      ? { ...state, loading: false, refreshing: true, error: null }
      : { loading: true, refreshing: false, data: null, error: null };
    render();

    try {
      const data = await getDashboardDataProgressive(city, preferences.unit, {
        signal: controller.signal,
        onPartial: (partial) => {
          if (activeRequestId !== requestId) return;
          state = { loading: false, refreshing: true, data: partial, error: null };
          render();
        }
      });
      if (activeRequestId !== requestId) return;
      state = { loading: false, refreshing: false, data, error: null };
    } catch (error) {
      if (error?.name === "AbortError" || activeRequestId !== requestId) return;
      state = { loading: false, refreshing: false, data: null, error: error.message };
    }

    render();
  };

  const render = () => {
    const data = state.data;
    if (data) document.body.dataset.weather = data.weather.condition.toLowerCase();
    unmountMap?.();

    root.innerHTML = `
      <main class="app-shell">
        <aside class="sidebar">
          <button class="app-logo" id="dashboard-home" aria-label="Go to dashboard">${brand}</button>
          <nav>
            <button class="nav-item active" data-target="overview">⌂ <span>Overview</span></button>
            <button class="nav-item" data-target="map-panel">⌖ <span>Weather map</span></button>
            <button class="nav-item" data-target="saved-cities">♡ <span>Saved cities</span></button>
          </nav>
          <div class="sidebar-bottom">
            <p>YOUR SPACE</p>
            <button class="sidebar-user" id="profile-link-2">
              <b>${user.fullName.slice(0, 1).toUpperCase()}</b>
              <span>${user.fullName}<small>View profile</small></span>
            </button>
            <button class="sign-out" id="sign-out">Sign out</button>
          </div>
        </aside>

        <section class="dashboard-shell dashboard-redesign">
          <header class="dashboard-header redesign-header">
            <button class="mobile-logo" id="dashboard-home-mobile" aria-label="Go to dashboard">${brand}</button>
            <form class="search" id="search">
              <input aria-label="Search city" value="${city}" placeholder="Search a city" />
              <button aria-label="Search" type="submit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            </form>
            <div class="header-actions">
              <span class="updated">${state.refreshing ? "Refreshing..." : "Updated just now"}</span>
              <button class="location-button" id="home-city">⌖ Home</button>
              <button class="unit-toggle" id="unit">°${preferences.unit === "metric" ? "C" : "F"}</button>
            </div>
          </header>

          ${state.loading ? loadingMarkup(city) : state.error ? errorMarkup(state.error) : dashboardMarkup(data, user, preferences, mapLayer)}

          <footer>Chameleon Weather · ${data?.isDemo ? "Demo data - add VITE_OPENWEATHER_API_KEY for live conditions" : "Live data from OpenWeather"}</footer>
        </section>
      </main>`;

    root.querySelector("#search").addEventListener("submit", (event) => {
      event.preventDefault();
      const term = root.querySelector(".search input").value.trim();
      if (term) load(term);
    });

    root.querySelector("#unit").addEventListener("click", () => onPreferencesChange({ unit: preferences.unit === "metric" ? "imperial" : "metric" }));
    root.querySelector("#home-city").addEventListener("click", () => load(preferences.homeCity));
    root.querySelectorAll("#dashboard-home, #dashboard-home-mobile").forEach((button) => button.addEventListener("click", onOpenDashboard));
    root.querySelector("#profile-link-2")?.addEventListener("click", () => { controller?.abort(); onOpenProfile(); });
    root.querySelector("#sign-out").addEventListener("click", () => { controller?.abort(); onSignOut(); });
    root.querySelector("#retry")?.addEventListener("click", () => load());
    root.querySelector("#save-city")?.addEventListener("click", () => {
      const current = preferences.favorites || [];
      const favorites = current.includes(city) ? current.filter((item) => item !== city) : [...current, city];
      onPreferencesChange({ favorites });
    });
    root.querySelectorAll(".saved-city").forEach((button) => button.addEventListener("click", () => load(button.dataset.city)));
    root.querySelectorAll(".nav-item[data-target]").forEach((button) => button.addEventListener("click", () => document.querySelector(`#${button.dataset.target}`)?.scrollIntoView({ behavior: "smooth", block: "start" })));
    root.querySelectorAll(".layer-button").forEach((button) => button.addEventListener("click", () => { mapLayer = button.dataset.layer; render(); }));

    if (data) {
      unmountMap = mountWeatherMap(root.querySelector("#weather-map"), {
        latitude: data.weather.latitude,
        longitude: data.weather.longitude,
        layer: mapLayer
      });
    }
  };

  render();
  load();
}

const loadingMarkup = (city) => `<section class="loading"><div class="spinner"></div><p>Reading the sky over ${city}...</p></section>`;
const errorMarkup = (message) => `<section class="error-state"><h1>That forecast got away from us.</h1><p>${message}</p><button class="button button-primary" id="retry">Try again</button></section>`;

function dashboardMarkup({ weather, air, forecast, hourly }, user, preferences, mapLayer) {
  const [aqiLabel, aqiColor] = aqiInfo[air.aqi] || aqiInfo[1];
  const favoriteCities = preferences.favorites || [];
  const insight = weather.condition === "Rain"
    ? "Rain is likely today - keep an umbrella close."
    : air.aqi <= 2
      ? "Fresh air today - a great time to spend outdoors."
      : "Air quality is elevated - reduce prolonged outdoor activity.";

  return `
    <section id="overview" class="dash-grid">
      <article class="panel panel-now">
        <div class="panel-head">
          <p class="eyebrow">NOW IN ${weather.city.toUpperCase()}</p>
          <button class="text-button save-city" id="save-city">${favoriteCities.includes(weather.city) ? "★ Saved city" : "☆ Save this city"}</button>
        </div>
        <div class="now-main">
          <div>
            <h1>${weather.temperature}°${preferences.unit === "metric" ? "C" : "F"}</h1>
            <p class="condition">${weather.description}</p>
            <p class="feels">Feels like ${weather.feelsLike}° · H ${weather.high}° / L ${weather.low}°</p>
          </div>
          <span class="weather-icon">${iconFor(weather.condition)}</span>
        </div>
        <div class="now-stats">
          <div><span>Humidity</span><b>${weather.humidity}%</b></div>
          <div><span>Wind</span><b>${weather.wind} ${preferences.unit === "metric" ? "m/s" : "mph"}</b></div>
          <div><span>Pressure</span><b>${weather.pressure} hPa</b></div>
        </div>
      </article>

      <article class="panel panel-map" id="map-panel">
        <div class="section-title">
          <div>
            <p class="eyebrow">INTERACTIVE LAYER</p>
            <h2>${weather.city}, mapped</h2>
          </div>
          <span>⌖</span>
        </div>
        <div class="map-controls">${["Map", "Temperature", "Rain", "Clouds", "Wind"].map((layer) => `<button class="layer-button ${mapLayer === layer ? "selected" : ""}" data-layer="${layer}">${layer}</button>`).join("")}</div>
        <div id="weather-map" class="weather-map" aria-label="Interactive ${mapLayer.toLowerCase()} map for ${weather.city}"></div>
      </article>

      <article class="panel panel-air">
        <div class="section-title">
          <div>
            <p class="eyebrow">AIR QUALITY</p>
            <h2>${aqiLabel}</h2>
          </div>
          <span class="aqi-dot ${aqiColor}"></span>
        </div>
        <p class="insight">${insight}</p>
      </article>

      <article class="panel panel-sun">
        <div class="section-title">
          <div>
            <p class="eyebrow">SUNLIGHT</p>
            <h2>Sun Cycle</h2>
          </div>
          <span>☼</span>
        </div>
        <p>Sunrise <b>${weather.sunrise}</b></p>
        <p>Sunset <b>${weather.sunset}</b></p>
      </article>

      <article class="panel panel-hourly" id="hourly">
        <div class="section-title">
          <div>
            <p class="eyebrow">PLAN YOUR DAY</p>
            <h2>Hourly forecast</h2>
          </div>
          <span>${preferences.unit === "metric" ? "°C" : "°F"}</span>
        </div>
        <div class="hourly-row compact-row">${hourly.map((hour) => `<div><b>${hour.time}</b><span>${hour.icon}</span><strong>${hour.temperature}°</strong><small>${hour.rain}% rain</small></div>`).join("")}</div>
      </article>

      <article class="panel panel-forecast">
        <div class="section-title">
          <div>
            <p class="eyebrow">LOOKING AHEAD</p>
            <h2>Five-day forecast</h2>
          </div>
          <span>${preferences.unit === "metric" ? "°C" : "°F"}</span>
        </div>
        <div class="forecast-row">${forecast.map((day) => `<div><b>${day.day}</b><span>${day.icon}</span><p>${day.high}° <small>${day.low}°</small></p></div>`).join("")}</div>
      </article>

      <article class="panel panel-saved" id="saved-cities">
        <div class="section-title">
          <div>
            <p class="eyebrow">YOUR PLACES</p>
            <h2>Saved cities</h2>
          </div>
          <span>${favoriteCities.length} saved</span>
        </div>
        <div class="saved-list">${favoriteCities.length ? favoriteCities.map((item) => `<button class="saved-city" data-city="${item}"><span>⌖</span><b>${item}</b><small>Open</small></button>`).join("") : `<p>Save a city to revisit it here.</p>`}</div>
      </article>
    </section>`;
}
