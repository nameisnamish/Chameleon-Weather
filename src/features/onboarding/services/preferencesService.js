import { readStorage, writeStorage } from "../../../shared/utils/storage.js";

const keyFor = (userId) => `chameleon_preferences_${userId}`;
export const getPreferences = (userId) => readStorage(keyFor(userId), null);

export function savePreferences(userId, preferences) {
  const value = { homeCity: "Bengaluru", unit: "metric", theme: "system", favorites: [], ...preferences };
  writeStorage(keyFor(userId), value);
  return value;
}
