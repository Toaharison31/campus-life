import { useMemo } from "react";
import { Bell, CalendarDays, Clock3, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { getNotifications } from "../services/studentData";
import { formatLongDate } from "../services/dates";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

const icons = {
  overdue: Clock3,
  dueToday: CalendarDays,
  deadline: CalendarDays,
  announcement: Megaphone,
  class: Bell,
};

export default function Notifications() {
  const { t, i18n } = useTranslation();
  const {
    tasks,
    courses,
    announcements,
    readNotifications,
    setReadNotifications,
    now,
    profile,
  } = useCampus();
  const notifications = useMemo(
    () =>
      getNotifications({
        tasks,
        courses,
        announcements,
        now,
        preferences: profile.notificationPreferences,
      }),
    [tasks, courses, announcements, now, profile.notificationPreferences],
  );
  const unread = notifications.filter(
    (item) => !readNotifications.includes(item.id),
  );

  const markAllRead = () => {
    setReadNotifications((items) => [
      ...new Set([...items, ...notifications.map((item) => item.id)]),
    ]);
  };

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("notifications.eyebrow")}
        title={t("notifications.title")}
        subtitle={t("notifications.intro", { count: unread.length })}
        action={
          unread.length > 0 && (
            <button className="button button-secondary" onClick={markAllRead}>
              {t("notifications.markAllRead")}
            </button>
          )
        }
      />
      {notifications.length ? (
        <section
          className="notification-list"
          aria-label={t("notifications.title")}
        >
          {notifications.map((item) => {
            const Icon = icons[item.type];
            const isRead = readNotifications.includes(item.id);
            return (
              <article
                className={`panel notification-card ${isRead ? "is-read" : ""} notification-${item.type}`}
                key={item.id}
              >
                <span className="notification-icon">
                  <Icon size={18} />
                </span>
                <div className="notification-copy">
                  <strong>
                    {t(`notifications.types.${item.type}`, {
                      title: item.title,
                    })}
                  </strong>
                  <span>
                    {item.time
                      ? `${formatLongDate(item.date, i18n.resolvedLanguage || "en")} · ${item.time}`
                      : formatLongDate(
                          item.date,
                          i18n.resolvedLanguage || "en",
                        )}
                  </span>
                </div>
                <Link
                  className="text-link"
                  to={item.href}
                  onClick={() =>
                    setReadNotifications((items) =>
                      items.includes(item.id) ? items : [...items, item.id],
                    )
                  }
                >
                  {t("notifications.view")}
                </Link>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="panel">
          <EmptyState
            title={t("notifications.emptyTitle")}
            message={t("notifications.emptyMessage")}
          />
        </section>
      )}
    </div>
  );
}
