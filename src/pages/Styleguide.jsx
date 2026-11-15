// Présente les composants et thèmes disponibles dans l'application.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Badge from "../components/Badge";
import {
  PriorityBadge,
  TaskStatusBadge,
  UnreadBadge,
} from "../components/StatusBadges";

const themes = ["light", "dark", "campus", "sunset"];
const tokenGroups = {
  backgrounds: [
    "bg-app",
    "bg-surface",
    "bg-surface-raised",
    "bg-subtle",
    "bg-sidebar",
    "bg-sidebar-hover",
    "bg-sidebar-selected",
    "bg-overlay",
    "bg-hover",
    "bg-active",
    "bg-selected",
    "bg-input",
  ],
  text: [
    "text-primary",
    "text-secondary",
    "text-muted",
    "text-disabled",
    "text-placeholder",
    "text-inverse",
    "text-link",
    "text-on-primary",
    "text-on-sidebar",
    "text-on-sidebar-muted",
    "text-on-sidebar-active",
  ],
  borders: [
    "border-subtle",
    "border-default",
    "border-strong",
    "border-focus",
    "border-error",
  ],
  brand: [
    "primary",
    "primary-hover",
    "primary-active",
    "primary-subtle",
    "secondary",
    "accent",
  ],
  status: ["success", "warning", "danger", "info", "neutral"].flatMap((key) => [
    `${key}-bg`,
    `${key}-text`,
    `${key}-border`,
    `${key}-solid`,
  ]),
  taskStates: [
    "priority-high-bg",
    "priority-high-text",
    "priority-high-border",
    "priority-medium-bg",
    "priority-medium-text",
    "priority-medium-border",
    "priority-low-bg",
    "priority-low-text",
    "priority-low-border",
    "task-pending-bg",
    "task-pending-text",
    "task-pending-border",
    "task-completed-bg",
    "task-completed-text",
    "task-completed-border",
    "task-overdue-bg",
    "task-overdue-text",
    "task-overdue-border",
    "announcement-unread-bg",
    "announcement-unread-text",
    "announcement-unread-border",
    "announcement-read-bg",
    "announcement-read-text",
    "announcement-read-border",
  ],
  elevation: ["shadow-sm", "shadow-md", "shadow-lg", "ring", "ring-inverse"],
  courses: Array.from({ length: 8 }, (_, index) =>
    ["bg", "text", "border"].map((part) => `course-${index + 1}-${part}`),
  ).flat(),
};

const tokenValue = (token) => `var(--${token})`;

export default function Styleguide() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || "light",
  );

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    root.dataset.theme = theme;
    return () => {
      if (previousTheme) root.dataset.theme = previousTheme;
    };
  }, [theme]);

  return (
    <div className="module-page styleguide-page">
      <header className="styleguide-header">
        <div>
          <p className="styleguide-eyebrow">{t("styleguide.eyebrow")}</p>
          <h1>{t("styleguide.title")}</h1>
          <p>{t("styleguide.description")}</p>
        </div>
        <div className="styleguide-themes" role="group" aria-label={t("styleguide.chooseTheme")}>
          {themes.map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={theme === value}
              className={theme === value ? "selected" : ""}
              onClick={() => setTheme(value)}
            >
              {t(`profile.themes.${value}`)}
            </button>
          ))}
        </div>
      </header>

      <section className="panel styleguide-section">
        <h2>{t("styleguide.tokens")}</h2>
        {Object.entries(tokenGroups).map(([group, tokens]) => (
          <div className="styleguide-token-group" key={group}>
            <h3>{t(`styleguide.groups.${group}`)}</h3>
            <div className="styleguide-token-grid">
              {tokens.map((token) => (
                <div className="styleguide-token" key={token}>
                  <span
                    className="styleguide-swatch"
                    style={{
                      backgroundColor: token.startsWith("shadow")
                        ? "var(--bg-surface)"
                        : tokenValue(token),
                      boxShadow: token.startsWith("shadow")
                        ? tokenValue(token)
                        : undefined,
                    }}
                  />
                  <code>{token}</code>
                  <span>{getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="styleguide-grid">
        <article className="panel styleguide-section">
          <h2>{t("styleguide.statuses")}</h2>
          <div className="styleguide-samples">
            <Badge tone="success">{t("styleguide.success")}</Badge>
            <Badge tone="warning">{t("styleguide.warning")}</Badge>
            <Badge tone="danger">{t("styleguide.error")}</Badge>
            <Badge tone="info">{t("styleguide.information")}</Badge>
            <Badge tone="neutral">{t("styleguide.neutral")}</Badge>
            <PriorityBadge level="high" label={t("priority.High")} />
            <PriorityBadge level="medium" label={t("priority.Medium")} />
            <PriorityBadge level="low" label={t("priority.Low")} />
            <TaskStatusBadge status="pending" label={t("status.Pending")} />
            <TaskStatusBadge status="completed" label={t("status.Completed")} />
            <TaskStatusBadge status="overdue" label={t("tasks.overdue")} />
            <UnreadBadge>{t("announcements.unread")}</UnreadBadge>
          </div>
        </article>

        <article className="panel styleguide-section">
          <h2>{t("styleguide.interactionStates")}</h2>
          <div className="styleguide-state-grid">
            {["default", "hover", "focus", "active", "selected", "disabled", "error", "loading"].map((state) => (
              <button
                type="button"
                key={state}
                className={`button button-secondary styleguide-state-${state}`}
                disabled={state === "disabled"}
                aria-busy={state === "loading"}
              >
                {t(`styleguide.states.${state}`)}
              </button>
            ))}
          </div>
          <label className="styleguide-field">
            {t("styleguide.sampleInput")}
            <input placeholder={t("styleguide.placeholder")} />
          </label>
          <label className="styleguide-field">
            {t("styleguide.errorInput")}
            <input aria-invalid="true" defaultValue={t("styleguide.invalidValue")} />
          </label>
        </article>
      </section>

      <section className="panel styleguide-section">
        <h2>{t("styleguide.surfaces")}</h2>
        <div className="styleguide-grid">
          <article className="surface-card styleguide-demo-card">
            <h3>{t("styleguide.cardTitle")}</h3>
            <p>{t("styleguide.cardDescription")}</p>
            <button type="button" className="button button-primary">
              {t("styleguide.primaryAction")}
            </button>
          </article>
          <div className="styleguide-sidebar-demo">
            <strong>{t("styleguide.sidebar")}</strong>
            <span>{t("styleguide.sidebarItem")}</span>
            <span className="selected">{t("styleguide.activeItem")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
