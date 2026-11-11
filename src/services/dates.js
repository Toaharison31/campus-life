export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatShortDate(value, language = "en") {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  return new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(value, language = "en") {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  return new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getTodayScheduleLabel(language = "en") {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  return new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getTodayWeekday(language = "en") {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  return new Date().toLocaleDateString(locale, { weekday: "long" });
}
