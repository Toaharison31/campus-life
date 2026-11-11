import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Flame,
  GraduationCap,
  IdCard,
  Moon,
  Sun,
  Sunset,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";

export function FloatingInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  success,
  type = "text",
  maxLength,
  autoComplete,
}) {
  const { t } = useTranslation();
  return (
    <div className={`profile-field ${error ? "has-error" : ""}`}>
      <div className="profile-floating-control">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          maxLength={maxLength}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label htmlFor={id}>{label}</label>
        {success && (
          <CheckCircle2
            className="profile-field-success"
            size={18}
            aria-label={t("profileSettings.validField")}
          />
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="profile-field-error" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}

export function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}) {
  return (
    <label className="settings-toggle-row">
      {Icon && (
        <span className="settings-icon-badge">
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <span className="settings-toggle-copy">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="settings-toggle-track" aria-hidden="true">
        <span />
      </span>
    </label>
  );
}

export function LanguageSegmented({ language, onChange }) {
  const { t } = useTranslation();
  return (
    <div
      className="language-segmented"
      role="group"
      aria-label={t("profileSettings.language")}
    >
      {["fr", "en"].map((item) => (
        <button
          type="button"
          key={item}
          aria-pressed={language === item}
          className={language === item ? "selected" : ""}
          onClick={() => onChange(item)}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

const themeIcons = {
  light: Sun,
  dark: Moon,
  campus: GraduationCap,
  sunset: Sunset,
};

function AnimatedCounter({ value }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      const frame = requestAnimationFrame(() => setCount(value));
      return () => cancelAnimationFrame(frame);
    }
    let frame;
    const started = performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - started) / 420);
      setCount(Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <strong>{count}</strong>;
}

export function ThemePicker({ theme, onChange }) {
  const { t } = useTranslation();
  const refs = useRef([]);
  const themes = ["light", "dark", "campus", "sunset"];
  const moveFocus = (event, index) => {
    const directions = {
      ArrowRight: 1,
      ArrowDown: 1,
      ArrowLeft: -1,
      ArrowUp: -1,
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    const next =
      (index + directions[event.key] + themes.length) % themes.length;
    refs.current[next]?.focus();
    onChange(themes[next]);
  };
  return (
    <div
      className="profile-theme-grid"
      role="radiogroup"
      aria-label={t("profileSettings.theme")}
    >
      {themes.map((item, index) => {
        const Icon = themeIcons[item];
        const selected = theme === item;
        return (
          <button
            ref={(node) => (refs.current[index] = node)}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            key={item}
            className={`profile-theme-card ${selected ? "selected" : ""}`}
            onClick={() => onChange(item)}
            onKeyDown={(event) => moveFocus(event, index)}
          >
            <span className={`theme-preview theme-preview-${item}`}>
              <i />
              <i />
              <i />
            </span>
            <span className="profile-theme-caption">
              <Icon size={18} aria-hidden="true" />
              {t(`theme.names.${item}`)}
            </span>
            {selected && (
              <span className="theme-selected-check">
                <Check size={14} aria-hidden="true" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AvatarUploader({ initials, avatar, onUpload, onRemove }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const ringRef = useRef(null);
  useEffect(() => {
    ringRef.current?.removeAttribute("data-image-error");
  }, [avatar]);
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  };
  return (
    <div className="profile-avatar-uploader">
      <div ref={ringRef} className="profile-avatar-ring">
        {avatar ? (
          <img
            key={avatar}
            src={avatar}
            alt=""
            onError={(event) => {
              event.currentTarget.hidden = true;
              event.currentTarget.parentElement.dataset.imageError = "true";
            }}
          />
        ) : null}
        <span className="profile-avatar-initials">{initials}</span>
        <button
          type="button"
          className="profile-avatar-camera"
          aria-label={t("profileSettings.editPhoto")}
          title={t("profileSettings.editPhoto")}
          onClick={() => inputRef.current?.click()}
        >
          <Camera size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-hidden="true"
        tabIndex={-1}
        onChange={handleFile}
      />
      {avatar && (
        <button
          type="button"
          className="profile-remove-photo"
          onClick={onRemove}
        >
          <X size={15} aria-hidden="true" />
          {t("profileSettings.removePhoto")}
        </button>
      )}
    </div>
  );
}

export function ProfileHeader({
  profile,
  completion,
  initials,
  stats,
  onUpload,
  onRemove,
}) {
  const { t } = useTranslation();
  return (
    <section className="profile-hero-card profile-settings-card">
      <div className="profile-hero-main">
        <AvatarUploader
          initials={initials}
          avatar={profile.avatar}
          onUpload={onUpload}
          onRemove={onRemove}
        />
        <div className="profile-hero-copy">
          <span className="profile-caption">{t("dashboard.profile")}</span>
          <h2>{profile.name || t("profile.studentName")}</h2>
          <p>{[profile.major, profile.year].filter(Boolean).join(" · ")}</p>
          <div className="profile-status-pills">
            <span>
              <CalendarDays size={15} />
              {t("profile.fall")}
            </span>
            <span>
              <IdCard size={15} />
              {profile.studentId}
            </span>
            <span>
              <GraduationCap size={15} />
              {t("profileSettings.studentStatus")}
            </span>
          </div>
        </div>
      </div>
      <div className="profile-completion">
        <div className="profile-completion-heading">
          <strong>{t("profileSettings.completion")}</strong>
          <span>{completion}%</span>
        </div>
        <div
          className="profile-completion-track"
          role="progressbar"
          aria-label={t("profileSettings.completion")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion}
        >
          <span style={{ width: `${completion}%` }} />
        </div>
        <small>
          {profile.avatar
            ? t("profileSettings.profileComplete")
            : t("profileSettings.addPhotoHint")}
        </small>
      </div>
      <div className="profile-quick-stats">
        {[
          {
            key: "completedTasks",
            value: stats.completedTasks,
            icon: CheckCircle2,
          },
          { key: "studyStreak", value: stats.studyStreak, icon: Flame },
          {
            key: "classesThisWeek",
            value: stats.classesThisWeek,
            icon: CalendarDays,
          },
        ].map(({ key, value, icon: Icon }) => (
          <div className="profile-quick-stat" key={key}>
            <span className="settings-icon-badge">
              <Icon size={20} />
            </span>
            <div>
              <AnimatedCounter value={value} />
              <small>{t(`profileSettings.stats.${key}`)}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SettingsTabs({ active, onChange }) {
  const { t } = useTranslation();
  const refs = useRef([]);
  const tabs = ["profile", "preferences", "notifications", "privacy"];
  const handleKeyDown = (event, index) => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next]);
  };
  return (
    <div
      className="profile-settings-tabs"
      role="tablist"
      aria-label={t("profileSettings.sections")}
    >
      {tabs.map((tab) => (
        <button
          ref={(node) => (refs.current[tabs.indexOf(tab)] = node)}
          type="button"
          role="tab"
          aria-selected={active === tab}
          tabIndex={active === tab ? 0 : -1}
          id={`settings-tab-${tab}`}
          key={tab}
          onClick={() => onChange(tab)}
          onKeyDown={(event) => handleKeyDown(event, tabs.indexOf(tab))}
        >
          {t(`profileSettings.tabs.${tab}`)}
        </button>
      ))}
    </div>
  );
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation();
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-body profile-confirm-body">
        <p>{message}</p>
        <div className="form-actions">
          <button className="button button-secondary" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            {confirmLabel || t("common.confirm")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
