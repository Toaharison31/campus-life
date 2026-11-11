import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";

export default function ThemeSwitcher() {
  const { t } = useTranslation();
  const { profile, setProfile } = useCampus();
  const isDark = profile.followSystemTheme
    ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
    : profile.theme === "dark";
  const Icon = isDark ? Sun : Moon;

  const toggleTheme = () => {
    setProfile((current) => ({
      ...current,
      followSystemTheme: false,
      theme: isDark ? "light" : "dark",
    }));
  };

  return (
    <button
      className="icon-button theme-trigger"
      type="button"
      aria-label={t(isDark ? "theme.switchToLight" : "theme.switchToDark")}
      title={t(isDark ? "theme.switchToLight" : "theme.switchToDark")}
      onClick={toggleTheme}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
