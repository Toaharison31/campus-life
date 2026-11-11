import { getInitialData } from "../data/initialData.js";

const initializationKey = "campus-life:initialized";
const stringFields = {
  tasks: ["title", "description", "dueDate", "priority", "status", "category", "createdAt", "completedAt"],
  courses: ["name", "day", "startTime", "endTime", "classroom", "teacher"],
  announcements: ["title", "content", "category", "priority", "author", "publishedAt"],
  resources: ["title", "description", "category", "type", "url", "createdAt"],
};
const requiredTextField = {
  tasks: "title",
  courses: "name",
  announcements: "title",
  resources: "title",
};

const isRecordArray = (value, collection) =>
  Array.isArray(value) &&
  value.every((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    if (typeof item.id !== "string") return false;
    if (typeof item[requiredTextField[collection]] !== "string") return false;
    return (stringFields[collection] || []).every(
      (field) => item[field] === undefined || typeof item[field] === "string",
    );
  });

function initializeDataIfEmpty() {
  if (localStorage.getItem(initializationKey) !== null) return;

  const nonLanguageKeys = Object.keys(localStorage).filter(
    (key) => key !== "campus-life:language",
  );
  if (nonLanguageKeys.length === 0) {
    const language =
      localStorage.getItem("campus-life:language") === "en" ? "en" : "fr";
    for (const [collection, records] of Object.entries(
      getInitialData(language),
    )) {
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
    if (stored === null) return { value: [], persist: true };
    const parsed = JSON.parse(stored);
    if (isRecordArray(parsed, collection))
      return { value: parsed, persist: true };
    console.warn(
      `Stored ${collection} data was invalid; leaving it unchanged.`,
    );
  } catch (error) {
    console.error(
      `Could not initialize or read ${collection} from localStorage.`,
      error,
    );
  }
  return { value: [], persist: false };
}

export function writeData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Could not save ${key} to localStorage.`, error);
    return false;
  }
}

export function createId(prefix) {
  return `${prefix}-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}
