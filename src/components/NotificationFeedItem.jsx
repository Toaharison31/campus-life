import { useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Bell,
  Bug,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  formatNotificationTime,
  notificationDestination,
} from "../services/notificationPresentation";

const activityKeys = {
  announcement_like: "announcementLike",
  announcement_comment: "announcementComment",
  announcement_reply: "announcementReply",
  comment_like: "commentLike",
};

const badgeByType = {
  announcement_like: { icon: Heart, tone: "like" },
  comment_like: { icon: Heart, tone: "like" },
  announcement_comment: { icon: MessageCircle, tone: "comment" },
  announcement_reply: { icon: MessageCircle, tone: "comment" },
  announcement: { icon: Megaphone, tone: "announcement" },
  overdue: { icon: Clock3, tone: "deadline" },
  dueToday: { icon: Clock3, tone: "deadline" },
  deadline: { icon: Clock3, tone: "deadline" },
  class: { icon: CalendarDays, tone: "schedule" },
  exam: { icon: CalendarDays, tone: "schedule" },
};

function initialsFor(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isInteractiveTarget(target) {
  return Boolean(target.closest("button, input, label, [role='menu']"));
}

export default function NotificationFeedItem({
  item,
  selected = false,
  selectionMode = false,
  onToggleSelect,
  onOpen,
  onToggleRead,
  onDelete,
  onReport,
  compact = false,
}) {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const activityKey = activityKeys[item.type];
  const actor = item.actorName || item.message || "";
  const badge = badgeByType[item.type] || { icon: Bell, tone: "system" };
  const BadgeIcon = badge.icon;
  const AvatarIcon = item.type === "class" || item.type === "exam" ? CalendarDays : Bell;
  const avatar = item.actorAvatar || item.avatar || item.user?.profile?.avatar;
  const initials = initialsFor(actor || item.title) || "CL";
  const canSelect = Boolean(onToggleSelect) && !item.derived;
  const canToggleRead = Boolean(onToggleRead) && (!item.derived || item.type === "announcement");
  const canDelete = Boolean(onDelete) && !item.derived;
  const hasOptions = canToggleRead || canDelete || Boolean(onReport);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(
    () => () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    },
    [],
  );

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleOpen = (event) => {
    if (
      longPressTriggeredRef.current &&
      Date.now() <= longPressTriggeredRef.current
    ) {
      event.preventDefault();
      event.stopPropagation();
      longPressTriggeredRef.current = null;
      return;
    }
    longPressTriggeredRef.current = null;
    if (selectionMode && canSelect) {
      event.preventDefault();
      event.stopPropagation();
      onToggleSelect(item.id);
      return;
    }
    onOpen?.(item);
  };

  const handleRowClick = (event) => {
    if (!selectionMode || !canSelect || isInteractiveTarget(event.target)) return;
    onToggleSelect(item.id);
  };

  const toggleMenu = (callback) => {
    setMenuOpen(false);
    callback?.(item);
  };

  return (
    <article
      className={`notification-card ${item.isRead ? "is-read" : "is-unread"} ${selected ? "is-selected" : ""} ${menuOpen ? "has-open-menu" : ""} ${compact ? "is-compact" : ""} ${canSelect ? "has-selection-control" : ""} notification-${badge.tone}`}
      onClick={handleRowClick}
      onPointerDown={(event) => {
        if (
          !canSelect ||
          selectionMode ||
          event.pointerType !== "touch" ||
          !window.matchMedia("(max-width: 460px) and (pointer: coarse)").matches ||
          isInteractiveTarget(event.target)
        ) {
          return;
        }
        clearLongPressTimer();
        longPressTimerRef.current = window.setTimeout(() => {
          longPressTimerRef.current = null;
          longPressTriggeredRef.current = Date.now() + 1000;
          onToggleSelect(item.id);
        }, 1000);
      }}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onPointerCancel={clearLongPressTimer}
      onContextMenu={(event) => {
        if (window.matchMedia("(pointer: coarse)").matches) {
          event.preventDefault();
        }
      }}
    >
      <Link
        className="notification-main"
        to={notificationDestination(item.type)}
        onClick={handleOpen}
      >
        <span className="notification-avatar">
          <span className="notification-avatar-initials">
            {actor ? initials : <AvatarIcon size={22} aria-hidden="true" />}
          </span>
          {avatar && (
            <img
              src={avatar}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          )}
          <span
            className={`notification-type-badge notification-type-badge--${badge.tone}`}
            aria-hidden="true"
          >
            <BadgeIcon size={13} />
          </span>
        </span>
        <span className="notification-copy">
          <span className="notification-message">
            {activityKey ? (
              <Trans
                i18nKey={`notifications.activity.${activityKey}`}
                values={{ actor, title: item.title }}
                components={{
                  actor: <strong />,
                  target: <strong />,
                }}
              />
            ) : (
              <>
                <strong>{item.title}</strong>
                {item.message && <> {item.message}</>}
              </>
            )}
          </span>
          <time className="notification-time">
            {formatNotificationTime(
              item,
              i18n.resolvedLanguage || "en",
              t,
            )}
          </time>
        </span>
      </Link>
      <div className="notification-indicators">
        {hasOptions && (
          <div className="notification-options" ref={menuRef}>
            <button
              ref={menuButtonRef}
              className="notification-more"
              type="button"
              aria-label={t("notifications.moreOptions")}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal size={19} aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="notification-options-menu animate-pop-in" role="menu">
                {canToggleRead && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      toggleMenu(() => onToggleRead(item, !item.isRead))
                    }
                  >
                    <Check size={17} aria-hidden="true" />
                    {t(
                      item.isRead
                        ? "notifications.markUnread"
                        : "notifications.markRead",
                    )}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => toggleMenu(onDelete)}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    {t("notifications.deleteFromMenu")}
                  </button>
                )}
                {onReport && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() =>
                      toggleMenu(() => onReport(item))
                    }
                  >
                    <Bug size={17} aria-hidden="true" />
                    {t("notifications.reportProblem")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        {canSelect && (
          <label className="notification-select-control">
            <input
              className="notification-select"
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(item.id)}
              aria-label={t("notifications.selectNotification", {
                title: item.title,
              })}
            />
            <span className="notification-select-indicator" aria-hidden="true">
              <Check size={12} />
            </span>
          </label>
        )}
        {!item.isRead && (
          <span
            className="notification-unread-dot"
            title={t("notifications.unread")}
            aria-label={t("notifications.unread")}
          />
        )}
      </div>
    </article>
  );
}
