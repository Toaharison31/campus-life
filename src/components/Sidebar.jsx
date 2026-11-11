import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  NotebookTabs,
  X,
} from "lucide-react";

const links = [
  { to: "/", label: "navigation.dashboard", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "navigation.tasks", icon: NotebookTabs },
  { to: "/timetable", label: "navigation.timetable", icon: CalendarDays },
  { to: "/announcements", label: "navigation.announcements", icon: Megaphone },
  { to: "/resources", label: "navigation.resources", icon: BookOpen },
];

export default function Sidebar({ open, onNavigate }) {
  const { t } = useTranslation();
  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand-row">
        <span className="brand-mark">
          <GraduationCap size={22} />
        </span>
        <span className="brand-name">
          campus<span>life</span>
        </span>
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
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Icon size={19} strokeWidth={1.8} />
            <span>{t(label)}</span>
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
        <div className="sidebar-user">
          <div className="avatar avatar-small">TR</div>
          <div>
            <strong>{t("profile.studentName")}</strong>
            <span>{t("profile.major")}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
