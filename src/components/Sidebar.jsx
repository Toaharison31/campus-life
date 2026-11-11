import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  House,
  Megaphone,
  NotebookTabs,
  Bell,
  Settings,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCampus } from "../context/CampusContext";
import { CountBadge } from "./StatusBadges";
import { getLocalDateString } from "../services/dates";
import { getNotifications, getTaskStats } from "../services/studentData";

const links = [
  { to: "/", label: "navigation.dashboard", icon: House, end: true },
  { to: "/tasks", label: "navigation.tasks", icon: NotebookTabs },
  { to: "/timetable", label: "navigation.timetable", icon: CalendarDays },
  { to: "/announcements", label: "navigation.announcements", icon: Megaphone },
  { to: "/resources", label: "navigation.resources", icon: BookOpen },
  { to: "/notifications", label: "navigation.notifications", icon: Bell },
];
const mobileLinks = links.slice(0, 5);
const mobileLabels = [
  "navigation.mobileHome",
  "navigation.mobileTasks",
  "navigation.mobileSchedule",
  "navigation.mobileNews",
  "navigation.mobileResources",
];

export default function Sidebar({
  open,
  collapsed,
  triggerRef,
  onNavigate,
  onToggleCollapse,
}) {
  const { t } = useTranslation();
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia?.("(max-width: 800px)").matches ?? false,
  );
  const {
    profile,
    tasks,
    courses,
    announcements,
    readNotifications,
    now,
  } = useCampus();
  const notificationItems = getNotifications({
    tasks,
    courses,
    announcements,
    now,
    preferences: profile.notificationPreferences,
  });
  const counts = {
    "/tasks": getTaskStats(tasks, getLocalDateString(now)).pending,
    "/announcements": announcements.filter((item) => !item.isRead).length,
    "/notifications": notificationItems.filter(
      (item) => !readNotifications.includes(item.id),
    ).length,
  };
  const displayName = profile.name.trim() || t("profile.studentName");
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const updateViewport = () => setIsMobile(media.matches);
    media.addEventListener("change", updateViewport);
    return () => media.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobile || !open) return undefined;
    const drawer = sidebarRef.current;
    const trigger = triggerRef.current;
    const focusableItems = () =>
      [...drawer.querySelectorAll('a[href], button:not(:disabled)')];
    drawer.querySelector(".side-nav a")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onNavigate();
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableItems();
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    drawer.addEventListener("keydown", handleKeyDown);
    return () => {
      drawer.removeEventListener("keydown", handleKeyDown);
      if (drawer.contains(document.activeElement)) trigger?.focus();
    };
  }, [isMobile, onNavigate, open, triggerRef]);

  return (
    <>
      <aside
        ref={sidebarRef}
        id="primary-navigation"
        className={`sidebar ${open ? "sidebar-open" : ""} ${collapsed ? "sidebar-is-collapsed" : ""}`}
        role={isMobile && open ? "dialog" : undefined}
        aria-label={t("navigation.main")}
        aria-modal={isMobile && open ? true : undefined}
        aria-hidden={isMobile && !open}
        inert={isMobile && !open}
      >
        <div className="brand-row">
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <span className="brand-name">
            campus<span>life</span>
          </span>
          <button
            className="icon-button sidebar-collapse"
            type="button"
            aria-label={t(
              collapsed
                ? "navigation.expandSidebar"
                : "navigation.collapseSidebar",
            )}
            aria-expanded={!collapsed}
            title={t(
              collapsed
                ? "navigation.expandSidebar"
                : "navigation.collapseSidebar",
            )}
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen size={19} />
            ) : (
              <PanelLeftClose size={19} />
            )}
          </button>
          <button
            className="icon-button mobile-close"
            onClick={onNavigate}
            aria-label={t("navigation.close")}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-label">{t("navigation.space")}</div>
        <nav className="side-nav" aria-label={t("navigation.main")}>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              title={collapsed ? t(label) : undefined}
            >
              <span className="nav-icon-badge">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="nav-link-label">{t(label)}</span>
              <CountBadge count={counts[to]} className="nav-count" />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="semester-card">
            <div className="semester-icon">
              <CalendarDays size={17} />
            </div>
            <p>{t("profile.currentSemester")}</p>
            <strong>{t("profile.fall")}</strong>
            <span>{t("profile.week")}</span>
            <div className="semester-progress">
              <i />
            </div>
          </div>
          <Link className="sidebar-user" to="/profile" onClick={onNavigate}>
            <div className="avatar avatar-small">{initials}</div>
            <div>
              <strong>{displayName}</strong>
              <span>{profile.major}</span>
            </div>
            <Settings size={16} aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <nav className="mobile-tabbar" aria-label={t("navigation.main")}>
        {mobileLinks.map(({ to, label, icon: Icon, end }, index) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobile-tab ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
            <span>{t(mobileLabels[index] || label)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
