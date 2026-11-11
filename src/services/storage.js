import { initialData } from "../data/initialData";

const initializationKey = "campus-life:initialized";
const isRecordArray = (value) =>
  Array.isArray(value) &&
  value.every(
    (item) => item && typeof item === "object" && typeof item.id === "string",
  );

function initializeDataIfEmpty() {
  if (localStorage.getItem(initializationKey) !== null) return;

  const nonLanguageKeys = Object.keys(localStorage).filter(
    (key) => key !== "campus-life:language",
  );
  if (nonLanguageKeys.length === 0) {
    for (const [collection, records] of Object.entries(initialData)) {
      localStorage.setItem(
        `campus-life:${collection}`,
        JSON.stringify(records),
      );
    }
  }

  localStorage.setItem(initializationKey, "true");
}

export function readData(key, collection) {
  try {
    initializeDataIfEmpty();
    const stored = localStorage.getItem(key);
    if (stored === null) return [];
    const parsed = JSON.parse(stored);
    if (isRecordArray(parsed)) return parsed;
    console.warn(
      `Stored ${collection} data was invalid; leaving it unchanged.`,
    );
  } catch (error) {
    console.error(
      `Could not initialize or read ${collection} from localStorage.`,
      error,
    );
  }
  return [];
}

export function writeData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Could not save ${key} to localStorage.`, error);
  }
}

export function createId(prefix) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}
