// Affiche la barre supérieure, les notifications et les raccourcis de navigation.
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  GraduationCap,
  Menu,
  Search,
  Settings,
  UserCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { useAuth } from "../context/useAuth";
import { api } from "../services/api";
import { getCampusAlerts } from "../services/studentData";
import ThemeSwitcher from "./ThemeSwitcher";
import { CountBadge } from "./StatusBadges";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationFeedItem from "./NotificationFeedItem";
import { isRecentNotification } from "../services/notificationPresentation";

const titles = {
  "/": "navigation.dashboard",
  "/tasks": "navigation.tasks",
  "/timetable": "navigation.timetable",
  "/announcements": "navigation.announcements",
  "/resources": "navigation.resources",
  "/notifications": "navigation.notifications",
  "/profile": "navigation.profile",
  "/search": "globalSearch.title",
};
export default function Header({ onMenuClick, menuButtonRef, menuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
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
  const { logout } = useAuth();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);
  const generatedNotifications = getCampusAlerts({
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
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const avatarButtonRef = useRef(null);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationRefreshRef = useRef(false);
  const displayName = profile.name.trim() || t("profile.studentName");
  const unreadCount =
    notifications.filter((item) => !item.isRead).length +
    generatedNotifications.length;
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const submitSearch = (event) => {
    event.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  const handleLogout = async () => {
    try {
      await logout();
      setAvatarMenuOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Could not sign out of CAMPUS LIFE.", error);
      showToast(t("common.apiError"), "error");
    }
  };

  const markNotificationRead = async (item, isRead) => {
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
      } else if (!item.derived) {
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

  const deleteNotification = async (item) => {
    try {
      await api.deleteNotification(item.id);
      setNotifications((items) =>
        items.filter((record) => record.id !== item.id),
      );
      showToast(t("notifications.deletedOne"), "success");
    } catch (error) {
      console.error("Could not delete notification.", error);
      showToast(t("common.apiError"), "error");
    }
  };

  const refreshNotifications = async () => {
    if (notificationRefreshRef.current) return;
    notificationRefreshRef.current = true;
    try {
      const records = await api.getNotifications();
      if (!Array.isArray(records)) {
        throw new Error("The notifications response was not a list.");
      }
      setNotifications(records);
    } catch (error) {
      console.error("Could not refresh notifications.", error);
      showToast(t("common.apiError"), "error");
    } finally {
      notificationRefreshRef.current = false;
    }
  };

  const toggleNotificationMenu = () => {
    const shouldOpen = !notificationMenuOpen;
    setNotificationMenuOpen(shouldOpen);
    if (shouldOpen) refreshNotifications();
  };

  useEffect(() => {
    if (!avatarMenuOpen) return undefined;
    const menu = avatarMenuRef.current;
    const closeMenu = (event) => {
      if (!avatarMenuRef.current?.contains(event.target))
        setAvatarMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setAvatarMenuOpen(false);
        avatarButtonRef.current?.focus();
      }
    };
    const navigateMenu = (event) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const items = [
        ...avatarMenuRef.current.querySelectorAll(
          '[role="menuitem"]:not(:disabled)',
        ),
      ];
      if (!items.length) return;
      const currentIndex = items.indexOf(document.activeElement);
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? items.length - 1
            : (currentIndex +
                (event.key === "ArrowDown" ? 1 : -1) +
                items.length) %
              items.length;
      event.preventDefault();
      items[nextIndex]?.focus();
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    menu?.addEventListener("keydown", navigateMenu);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
      menu?.removeEventListener("keydown", navigateMenu);
    };
  }, [avatarMenuOpen]);

  useEffect(() => {
    if (!notificationMenuOpen) return undefined;
    const closeMenu = (event) => {
      if (!notificationMenuRef.current?.contains(event.target)) {
        setNotificationMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationMenuOpen(false);
        notificationButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationMenuOpen]);

  const dropdownNotifications = [...notifications]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    )
    .concat(generatedNotifications)
    .slice(0, 6);
  const newDropdownNotifications = dropdownNotifications.filter((item) =>
    isRecentNotification(item),
  );
  const earlierDropdownNotifications = dropdownNotifications.filter(
    (item) => !isRecentNotification(item),
  );

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          ref={menuButtonRef}
          className="icon-button mobile-menu"
          type="button"
          aria-label={t(menuOpen ? "navigation.close" : "header.openNavigation")}
          title={t(menuOpen ? "navigation.close" : "header.openNavigation")}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <Link className="topbar-brand" to="/" aria-label={t("app.title")}>
          <span className="topbar-brand-mark">
            <GraduationCap size={21} aria-hidden="true" />
          </span>
          <span>
            campus<span>life</span>
          </span>
        </Link>
        <div className="breadcrumb">
          <span className="crumb-slash">/</span>
          <strong>
            {t(titles[location.pathname] || "navigation.dashboard")}
          </strong>
        </div>
      </div>
      <div className="topbar-actions">
        <form
          className="global-search"
          role="search"
          onSubmit={submitSearch}
          onClick={() => searchInputRef.current?.focus()}
        >
          <Search size={16} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("globalSearch.placeholder")}
            aria-label={t("globalSearch.label")}
          />
        </form>
        <span className="term-pill">
          <span /> {t("header.semester")}
        </span>
        <ThemeSwitcher />
        <LanguageSwitcher />
        <div className="notification-menu-wrap" ref={notificationMenuRef}>
          <button
            ref={notificationButtonRef}
            className="icon-button notification-button"
            type="button"
            aria-label={t("header.alertCount", { count: unreadCount })}
            title={t("header.viewNotifications")}
            aria-haspopup="dialog"
            aria-expanded={notificationMenuOpen}
            aria-controls="header-notification-popover"
            onClick={toggleNotificationMenu}
          >
            <Bell size={20} />
            <CountBadge count={unreadCount} className="notification-count" />
          </button>
          {notificationMenuOpen && (
            <section
              className="notification-popover"
              id="header-notification-popover"
              role="dialog"
              aria-label={t("notifications.title")}
            >
              <header className="notification-popover-header">
                <h2>{t("notifications.title")}</h2>
                <Link
                  to="/notifications"
                  onClick={() => setNotificationMenuOpen(false)}
                >
                  {t("notifications.viewAll")}
                </Link>
              </header>
              {dropdownNotifications.length ? (
                <div className="notification-popover-list">
                  {[
                    {
                      key: "newGroup",
                      items: newDropdownNotifications,
                    },
                    {
                      key: "earlierGroup",
                      items: earlierDropdownNotifications,
                    },
                  ]
                    .filter((group) => group.items.length > 0)
                    .map((group) => (
                      <section
                        className="notification-popover-group"
                        key={group.key}
                      >
                        <h3>{t(`notifications.${group.key}`)}</h3>
                        {group.items.map((item) => (
                          <NotificationFeedItem
                            key={item.id}
                            item={item}
                            compact
                            onOpen={(notification) => {
                              if (!notification.isRead) {
                                markNotificationRead(notification, true);
                              }
                              setNotificationMenuOpen(false);
                            }}
                            onToggleRead={markNotificationRead}
                            onDelete={deleteNotification}
                            onReport={() =>
                              showToast(
                                t("notifications.reportAcknowledged"),
                                "success",
                              )
                            }
                          />
                        ))}
                      </section>
                    ))}
                </div>
              ) : (
                <p className="notification-popover-empty">
                  {t("notifications.dropdownEmpty")}
                </p>
              )}
            </section>
          )}
        </div>
        <div className="avatar-menu-wrap" ref={avatarMenuRef}>
          <button
            ref={avatarButtonRef}
            className="avatar profile-avatar-link"
            type="button"
            aria-label={t("header.openProfileMenu")}
            aria-expanded={avatarMenuOpen}
            aria-haspopup="menu"
            onClick={() => setAvatarMenuOpen((open) => !open)}
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt=""
                onError={(event) => {
                  event.currentTarget.hidden = true;
                }}
              />
            ) : null}
            <span>{initials}</span>
          </button>
          {avatarMenuOpen && (
            <div className="avatar-menu" role="menu">
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setAvatarMenuOpen(false)}
              >
                <UserCircle size={18} aria-hidden="true" />
                {t("header.profileMenu.profile")}
              </Link>
              <Link
                to="/profile?tab=preferences"
                role="menuitem"
                onClick={() => setAvatarMenuOpen(false)}
              >
                <Settings size={18} aria-hidden="true" />
                {t("header.profileMenu.settings")}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
              >
                {t("header.profileMenu.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
