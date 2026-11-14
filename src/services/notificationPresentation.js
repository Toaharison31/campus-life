export function notificationDestination(type = "") {
  if (
    type === "announcement" ||
    type.startsWith("announcement_") ||
    type === "comment_like"
  ) {
    return "/announcements";
  }
  if (type === "class" || type === "event" || type === "exam") {
    return "/timetable";
  }
  return "/tasks";
}

export function isRecentNotification(item, now = Date.now()) {
  const dateValue = item.createdAt || item.date;
  if (!dateValue) return false;
  const timestamp = new Date(dateValue).getTime();
  const age = now - timestamp;
  return (
    Number.isFinite(timestamp) &&
    age >= -24 * 60 * 60 * 1000 &&
    age < 24 * 60 * 60 * 1000
  );
}

export function formatNotificationTime(item, locale, t) {
  const dateValue = item.createdAt || item.date;
  if (!dateValue) return item.time || "";
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return item.time || "";

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  if (Math.abs(seconds) < 45) return t("notifications.justNow");
  const units = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const [unit, duration] =
    units.find(([, unitDuration]) => Math.abs(seconds) >= unitDuration) ||
    units.at(-1);
  return new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  }).format(Math.round(seconds / duration), unit);
}
