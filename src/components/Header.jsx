import { useEffect, useRef, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Check, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";

const titles = {
  "/": "navigation.dashboard",
  "/tasks": "navigation.tasks",
  "/timetable": "navigation.timetable",
  "/announcements": "navigation.announcements",
  "/resources": "navigation.resources",
};
const languages = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "English" },
];

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { announcements } = useCampus();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languagePickerRef = useRef(null);
  const languageButtonRef = useRef(null);
  const currentLanguage =
    languages.find(({ code }) => code === i18n.resolvedLanguage) ||
    languages[0];

  useEffect(() => {
    if (!languageMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!languagePickerRef.current?.contains(event.target))
        setLanguageMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setLanguageMenuOpen(false);
        languageButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [languageMenuOpen]);

  const selectLanguage = (language) => {
    i18n.changeLanguage(language);
    setLanguageMenuOpen(false);
    languageButtonRef.current?.focus();
  };

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          className="icon-button mobile-menu"
          aria-label={t("header.openNavigation")}
          onClick={onMenuClick}
        >
          <Menu size={21} />
        </button>
        <div className="breadcrumb">
          <span>{t("header.workspace")}</span>
          <span className="crumb-slash">/</span>
          <strong>
            {t(titles[location.pathname] || "navigation.dashboard")}
          </strong>
        </div>
      </div>
      <div className="topbar-actions">
        <span className="term-pill">
          <span /> {t("header.semester")}
        </span>
        <div className="language-picker" ref={languagePickerRef}>
          <button
            ref={languageButtonRef}
            className="language-trigger"
            type="button"
            aria-label={t("header.selectLanguage")}
            aria-haspopup="menu"
            aria-expanded={languageMenuOpen}
            aria-controls="language-menu"
            onClick={() => setLanguageMenuOpen((open) => !open)}
          >
            <span className="language-trigger-flag" aria-hidden="true">
              {currentLanguage.flag}
            </span>
            <span className="language-trigger-name">
              {currentLanguage.name}
            </span>
            <ChevronDown
              className="language-chevron"
              size={15}
              aria-hidden="true"
            />
          </button>
          <div
            id="language-menu"
            className={`language-menu ${languageMenuOpen ? "language-menu-open" : ""}`}
            role="menu"
            aria-label={t("header.selectLanguage")}
            aria-hidden={!languageMenuOpen}
          >
            {languages.map(({ code, flag, name }) => {
              const isSelected = currentLanguage.code === code;
              return (
                <button
                  key={code}
                  className={`language-option ${isSelected ? "language-option-selected" : ""}`}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  tabIndex={languageMenuOpen ? 0 : -1}
                  onClick={() => selectLanguage(code)}
                >
                  <span className="language-option-flag" aria-hidden="true">
                    {flag}
                  </span>
                  <span>{name}</span>
                  {isSelected && <Check size={15} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
        <Link
          className="icon-button notification-button"
          to="/announcements"
          aria-label={t("header.announcementsCount", {
            count: announcements.length,
          })}
          title={t("header.viewAnnouncements")}
        >
          <Bell size={19} />
          <i />
        </Link>
        <div className="avatar">TR</div>
      </div>
    </header>
  );
}
