import { beforeEach, describe, expect, it } from "vitest";
import { getPreferences, savePreferences } from "./preferencesService.js";

describe("preferencesService", () => {
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), clear: () => values.clear() };
  beforeEach(() => localStorage.clear());
  it("applies defaults and persists a user preference", () => {
    savePreferences("user-1", { homeCity: "Mysuru", unit: "imperial" });
    expect(getPreferences("user-1")).toMatchObject({ homeCity: "Mysuru", unit: "imperial", favorites: [] });
  });
});
