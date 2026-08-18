import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardData } from "./weatherApi.js";

describe("getDashboardData", () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    clear: () => values.clear(),
    removeItem: (key) => values.delete(key)
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("VITE_OPENWEATHER_API_KEY", "");
    values.clear();
  });

  it("provides a usable demo response without an API key", async () => {
    const result = await getDashboardData("Mysuru");
    expect(result.isDemo).toBe(true);
    expect(result.weather.city).toBe("Mysuru");
    expect(result.air.aqi).toBeGreaterThanOrEqual(1);
  });

  it("maps live API responses when key is set", async () => {
    vi.stubEnv("VITE_OPENWEATHER_API_KEY", "test-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ name: "Mysuru", lat: 12.2958, lon: 76.6394 }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ main: { temp: 28, feels_like: 30, temp_max: 31, temp_min: 25, humidity: 62, pressure: 1008 }, weather: [{ main: "Clouds", description: "broken clouds" }], wind: { speed: 3.7 }, sys: { sunrise: 1700000000, sunset: 1700043200 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [{ main: { aqi: 2 }, components: { pm2_5: 12, pm10: 20, o3: 30, no2: 10 } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [{ dt: 1700000000, weather: [{ main: "Clouds" }], main: { temp: 28, temp_max: 30, temp_min: 24 }, pop: 0.3 }, { dt: 1700010800, weather: [{ main: "Rain" }], main: { temp: 27, temp_max: 29, temp_min: 24 }, pop: 0.5 }, { dt: 1700021600, weather: [{ main: "Clear" }], main: { temp: 26, temp_max: 28, temp_min: 23 }, pop: 0.1 }, { dt: 1700086400, weather: [{ main: "Clouds" }], main: { temp: 29, temp_max: 31, temp_min: 25 }, pop: 0.2 }, { dt: 1700172800, weather: [{ main: "Rain" }], main: { temp: 27, temp_max: 29, temp_min: 24 }, pop: 0.4 }, { dt: 1700259200, weather: [{ main: "Clear" }], main: { temp: 28, temp_max: 30, temp_min: 24 }, pop: 0.1 }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getDashboardData("Mysuru", "metric");

    expect(result.isDemo).toBe(false);
    expect(result.weather.city).toBe("Mysuru");
    expect(result.air.aqi).toBe(2);
    expect(result.hourly.length).toBe(5);
    expect(result.forecast.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("reuses cached dashboard data for repeated city lookups", async () => {
    vi.stubEnv("VITE_OPENWEATHER_API_KEY", "test-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [{ name: "Mysuru", lat: 12.2958, lon: 76.6394 }] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ main: { temp: 28, feels_like: 30, temp_max: 31, temp_min: 25, humidity: 62, pressure: 1008 }, weather: [{ main: "Clouds", description: "broken clouds" }], wind: { speed: 3.7 }, sys: { sunrise: 1700000000, sunset: 1700043200 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [{ main: { aqi: 2 }, components: { pm2_5: 12, pm10: 20, o3: 30, no2: 10 } }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ list: [{ dt: 1700000000, weather: [{ main: "Clouds" }], main: { temp: 28, temp_max: 30, temp_min: 24 }, pop: 0.3 }, { dt: 1700010800, weather: [{ main: "Rain" }], main: { temp: 27, temp_max: 29, temp_min: 24 }, pop: 0.5 }, { dt: 1700021600, weather: [{ main: "Clear" }], main: { temp: 26, temp_max: 28, temp_min: 23 }, pop: 0.1 }, { dt: 1700086400, weather: [{ main: "Clouds" }], main: { temp: 29, temp_max: 31, temp_min: 25 }, pop: 0.2 }, { dt: 1700172800, weather: [{ main: "Rain" }], main: { temp: 27, temp_max: 29, temp_min: 24 }, pop: 0.4 }, { dt: 1700259200, weather: [{ main: "Clear" }], main: { temp: 28, temp_max: 30, temp_min: 24 }, pop: 0.1 }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getDashboardData("Mysuru", "metric");
    const second = await getDashboardData("Mysuru", "metric");

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
