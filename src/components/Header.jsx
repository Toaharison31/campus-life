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
import { getNotifications } from "../services/studentData";
import ThemeSwitcher from "./ThemeSwitcher";
import { CountBadge } from "./StatusBadges";
import LanguageSwitcher from "./LanguageSwitcher";

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
  const { tasks, courses, announcements, readNotifications, profile, now } =
    useCampus();
  const [query, setQuery] = useState("");
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const avatarButtonRef = useRef(null);
  const displayName = profile.name.trim() || t("profile.studentName");
  const unreadCount = getNotifications({
    tasks,
    courses,
    announcements,
    now,
    preferences: profile.notificationPreferences,
  }).filter((item) => !readNotifications.includes(item.id)).length;
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

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          ref={menuButtonRef}
          className="icon-button mobile-menu"
          type="button"
          aria-label={t(menuOpen ? "navigation.close" : "header.openNavigation")}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <Link className="topbar-brand" to="/" aria-label={t("app.title")}>
          <span className="topbar-brand-mark">
            <GraduationCap size={17} aria-hidden="true" />
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
        <form className="global-search" role="search" onSubmit={submitSearch}>
          <Search size={16} aria-hidden="true" />
          <input
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
        <Link
          className="icon-button notification-button"
          to="/notifications"
          aria-label={t("header.alertCount", { count: unreadCount })}
          title={t("header.viewNotifications")}
        >
          <Bell size={20} />
          <CountBadge count={unreadCount} className="notification-count" />
        </Link>
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
                disabled
                title={t("header.profileMenu.noAccount")}
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
