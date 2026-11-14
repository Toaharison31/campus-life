import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { api } from "../services/api";
import { getCampusAlerts } from "../services/studentData";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import NotificationFeedItem from "../components/NotificationFeedItem";
import { isRecentNotification } from "../services/notificationPresentation";

export default function Notifications() {
  const { t } = useTranslation();
  const {
    notifications,
    setNotifications,
    setAnnouncements,
    tasks,
    courses,
    exams,
    announcements,
    profile,
    now,
    showToast,
  } = useCampus();
  const notificationRequestRef = useRef(null);
  const notificationsLoadedRef = useRef(false);
  const deleteInProgressRef = useRef(false);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState(
    () => new Set(),
  );
  const [deletingTarget, setDeletingTarget] = useState(null);
  useEffect(() => {
    let active = true;
    if (notificationsLoadedRef.current) return undefined;
    if (!notificationRequestRef.current) {
      notificationRequestRef.current = api.getNotifications();
    }
    const request = notificationRequestRef.current;
    request
      .then((records) => {
        if (!Array.isArray(records)) {
          throw new Error("The notifications response was not a list.");
        }
        notificationsLoadedRef.current = true;
        if (active) setNotifications(records);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Could not refresh notifications.", error);
        showToast(t("common.apiError"), "error");
      })
      .finally(() => {
        if (notificationRequestRef.current === request) {
          notificationRequestRef.current = null;
        }
      });
    return () => {
      active = false;
    };
  }, [setNotifications, showToast, t]);
  const generated = getCampusAlerts({
    tasks,
    courses,
    exams,
    announcements,
    now,
    preferences: profile.notificationPreferences,
  }).map((item) => ({
    ...item,
    message: t(`dashboard.alertTypes.${item.type}`),
  }));
  const allNotifications = [...generated, ...notifications].sort((a, b) =>
    String(b.date || b.createdAt || "").localeCompare(
      String(a.date || a.createdAt || ""),
    ),
  );
  const unread = allNotifications.filter((item) => !item.isRead);
  const unreadPersisted = notifications.filter((item) => !item.isRead);
  const allNotificationsSelected =
    notifications.length > 0 &&
    notifications.every((item) => selectedNotificationIds.has(item.id));
  const notificationGroups = [
    {
      key: "newGroup",
      items: allNotifications.filter((item) => isRecentNotification(item)),
    },
    {
      key: "earlierGroup",
      items: allNotifications.filter((item) => !isRecentNotification(item)),
    },
  ].filter((group) => group.items.length > 0);

  const markRead = async (item, isRead = true) => {
    try {
      if (item.derived && item.type === "announcement") {
        const announcementId = item.id.slice("announcement:".length);
        const updated = await api.updateAnnouncement(announcementId, {
          isRead,
        });
        setAnnouncements((items) =>
          items.map((record) =>
            record.id === announcementId ? updated : record,
          ),
        );
        return;
      }
      if (!item.derived) {
        const updated = await api.setNotificationRead(item.id, isRead);
        setNotifications((items) =>
          items.map((record) => (record.id === item.id ? updated : record)),
        );
      }
    } catch (error) {
      console.error("Could not update notification status.", error);
      showToast(t("common.apiError"), "error");
    }
  };

  const markAllRead = async () => {
    try {
      const updated = await Promise.all(
        unreadPersisted.map((item) =>
          api.setNotificationRead(item.id, true),
        ),
      );
      const updatedById = new Map(updated.map((item) => [item.id, item]));
      setNotifications((items) =>
        items.map((item) => updatedById.get(item.id) || item),
      );
    } catch (error) {
      console.error("Could not mark all notifications as read.", error);
      showToast(t("common.apiError"), "error");
    }
  };

  const deleteNotifications = async () => {
    if (!deletingTarget || deleteInProgressRef.current) return;
    deleteInProgressRef.current = true;
    const { ids, kind } = deletingTarget;
    try {
      if (kind === "selected") {
        await api.deleteSelectedNotifications(ids);
      } else {
        await api.deleteNotification(ids[0]);
      }
      const deletedIds = new Set(ids);
      setNotifications((items) =>
        items.filter((item) => !deletedIds.has(item.id)),
      );
      setSelectedNotificationIds((selected) => {
        const remaining = new Set(selected);
        ids.forEach((id) => remaining.delete(id));
        return remaining;
      });
      showToast(
        ids.length === 1
          ? t("notifications.deletedOne")
          : t("notifications.deletedMany", { count: ids.length }),
        "success",
      );
      setDeletingTarget(null);
    } catch (error) {
      console.error("Could not delete notifications.", error);
      showToast(t("common.apiError"), "error");
    } finally {
      deleteInProgressRef.current = false;
    }
  };

  const toggleNotificationSelection = (id) => {
    setSelectedNotificationIds((selected) => {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("notifications.eyebrow")}
        title={t("notifications.title")}
        subtitle={t("notifications.intro", { count: unread.length })}
        action={
          notifications.length > 0 && (
            <div className="notification-toolbar">
              <label className="notification-select-all">
                <input
                  type="checkbox"
                  checked={allNotificationsSelected}
                  onChange={() =>
                    setSelectedNotificationIds(
                      allNotificationsSelected
                        ? new Set()
                        : new Set(notifications.map((item) => item.id)),
                    )
                  }
                  aria-label={t("notifications.selectAll")}
                />
                <span>{t("notifications.selectAll")}</span>
              </label>
              {selectedNotificationIds.size > 0 && (
                <button
                  className="button button-danger"
                  onClick={() =>
                    setDeletingTarget({
                      kind: "selected",
                      ids: [...selectedNotificationIds],
                    })
                  }
                >
                  <Trash2 size={16} />
                  {t("notifications.deleteSelected", {
                    count: selectedNotificationIds.size,
                  })}
                </button>
              )}
              {unreadPersisted.length > 0 && (
                <button
                  className="button button-secondary"
                  onClick={markAllRead}
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>
          )
        }
      />
      {notifications.length > 0 && (
        <p className="notification-selection-hint">
          {t(
            selectedNotificationIds.size > 0
              ? "notifications.tapToToggleSelection"
              : "notifications.longPressToSelect",
          )}
        </p>
      )}
      {allNotifications.length ? (
        <div className="notification-groups">
          {notificationGroups.map((group) => (
            <section className="notification-group" key={group.key}>
              <header className="notification-group-heading">
                <h2>{t(`notifications.${group.key}`)}</h2>
              </header>
              <div
                className={`notification-list ${selectedNotificationIds.size > 0 ? "is-selecting" : ""}`}
                aria-label={t(`notifications.${group.key}`)}
              >
                {group.items.map((item) => (
                  <NotificationFeedItem
                    key={item.id}
                    item={item}
                    selected={selectedNotificationIds.has(item.id)}
                    selectionMode={selectedNotificationIds.size > 0}
                    onToggleSelect={
                      item.derived ? undefined : toggleNotificationSelection
                    }
                    onOpen={(notification) => {
                      if (!notification.isRead) markRead(notification, true);
                    }}
                    onToggleRead={markRead}
                    onDelete={(notification) =>
                      setDeletingTarget({
                        kind: "single",
                        ids: [notification.id],
                      })
                    }
                    onReport={() =>
                      showToast(
                        t("notifications.reportAcknowledged"),
                        "success",
                      )
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title={t("notifications.emptyTitle")}
            message={t("notifications.emptyMessage")}
          />
        </section>
      )}
      {deletingTarget && (
        <ConfirmDialog
          title={t(
            deletingTarget.kind === "selected"
              ? "notifications.deleteSelectedTitle"
              : "notifications.deleteTitle",
          )}
          message={
            deletingTarget.kind === "selected"
              ? t("notifications.deleteSelectedMessage", {
                  count: deletingTarget.ids.length,
                })
              : t("notifications.deleteMessage")
          }
          onCancel={() => setDeletingTarget(null)}
          onConfirm={deleteNotifications}
        />
      )}
    </div>
  );
}
