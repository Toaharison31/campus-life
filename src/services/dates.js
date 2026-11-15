function parseDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return null;
  // Midi UTC évite qu'un changement de fuseau décale la date au jour précédent.
  const date = new Date(0);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidDateString(value) {
  return parseDateString(value) !== null;
}

export function getDateDifferenceInDays(laterDate, earlierDate) {
  const later = parseDateString(laterDate);
  const earlier = parseDateString(earlierDate);
  if (!later || !earlier) return null;
  return (later.getTime() - earlier.getTime()) / 86400000;
}

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatShortDate(value, language = "en") {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const date = parseDateString(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatLongDate(value, language = "en") {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const date = parseDateString(value);
  if (!date) return "—";
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getTodayScheduleLabel(language = "en", date = new Date()) {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getTodayWeekday(language = "en", date = new Date()) {
  const locale = language === "fr" ? "fr-FR" : "en-US";
  return date.toLocaleDateString(locale, { weekday: "long" });
}
