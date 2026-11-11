import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { CampusContext } from "./context/CampusContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Timetable from "./pages/Timetable";
import Announcements from "./pages/Announcements";
import Resources from "./pages/Resources";
import Notifications from "./pages/Notifications";
import ProfileSettings from "./pages/ProfileSettings";
import GlobalSearch from "./pages/GlobalSearch";
import Styleguide from "./pages/Styleguide";
import Toast from "./components/Toast";

const themeNames = ["light", "dark", "campus", "sunset"];

function getPreferredTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function readStoredValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) {
      document.documentElement.dataset.theme = fallback.theme;
      return { value: fallback, persist: true };
    }
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.warn(`Stored ${key} data was invalid; using defaults.`);
      return { value: fallback, persist: false };
    }
    const hasInvalidField = [
      ["name", (value) => typeof value === "string"],
      ["studentId", (value) => typeof value === "string"],
      ["major", (value) => typeof value === "string"],
      ["year", (value) => typeof value === "string"],
      ["theme", (value) => themeNames.includes(value)],
    ].some(
      ([field, isValid]) =>
        parsed[field] !== undefined && !isValid(parsed[field]),
    );
    const storedProfile = {
      ...fallback,
      ...parsed,
      name: typeof parsed.name === "string" ? parsed.name : fallback.name,
      studentId:
        typeof parsed.studentId === "string"
          ? parsed.studentId
          : fallback.studentId,
      major: typeof parsed.major === "string" ? parsed.major : fallback.major,
      year: typeof parsed.year === "string" ? parsed.year : fallback.year,
      theme: themeNames.includes(parsed.theme) ? parsed.theme : fallback.theme,
    };
    document.documentElement.dataset.theme = storedProfile.theme;
    if (hasInvalidField) {
      console.warn(`Stored ${key} data was invalid; leaving it unchanged.`);
    }
    return { value: storedProfile, persist: !hasInvalidField };
  } catch (error) {
    console.error(`Could not read ${key} from localStorage.`, error);
    document.documentElement.dataset.theme = fallback.theme;
    return { value: fallback, persist: false };
  }
}

function readNotificationState() {
  try {
    const stored = localStorage.getItem("campus-life:notifications-read");
    if (stored === null) return { value: [], persist: true };
    const value = JSON.parse(stored);
    if (Array.isArray(value) && value.every((item) => typeof item === "string"))
      return { value, persist: true };
    console.warn(
      "Stored notification state was invalid; leaving it unchanged.",
    );
  } catch (error) {
    console.error(
      "Could not read notification state from localStorage.",
      error,
    );
  }
  return { value: [], persist: false };
}

function App() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useLocalStorage("campus-life:tasks", "tasks");
  const [courses, setCourses] = useLocalStorage(
    "campus-life:courses",
    "courses",
  );
  const [announcements, setAnnouncements] = useLocalStorage(
    "campus-life:announcements",
    "announcements",
  );
  const [resources, setResources] = useLocalStorage(
    "campus-life:resources",
    "resources",
  );
  const [profileSnapshot, setProfileSnapshot] = useState(() =>
    readStoredValue("campus-life:profile", {
      name: "Toavina Romeo",
      studentId: "CS-2024-0842",
      major: t("profile.major"),
      year: t("profile.year"),
      yearLevel: "3",
      email: "",
      university: "",
      phone: "",
      bio: "",
      avatar: "",
      theme: getPreferredTheme(),
      followSystemTheme: false,
      accessibility: {
        textSize: "M",
        reduceMotion: false,
        highContrast: false,
      },
      notificationPreferences: {
        events: true,
        clubs: true,
        messages: true,
        deadlines: true,
      },
    }),
  );
  const profileRef = useRef(profileSnapshot);
  const profile = profileSnapshot.value;
  const [notificationSnapshot, setNotificationSnapshot] = useState(
    readNotificationState,
  );
  const notificationRef = useRef(notificationSnapshot);
  const readNotifications = notificationSnapshot.value;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const setProfile = useCallback((update) => {
    const value =
      typeof update === "function" ? update(profileRef.current.value) : update;
    const next = { value, persist: false };
    profileRef.current = next;
    setProfileSnapshot(next);
    try {
      localStorage.setItem("campus-life:profile", JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Could not save profile settings to localStorage.", error);
      window.dispatchEvent(new Event("campus-life:storage-error"));
      return false;
    }
  }, []);
  const setReadNotifications = useCallback((update) => {
    const value =
      typeof update === "function"
        ? update(notificationRef.current.value)
        : update;
    const next = { value, persist: false };
    notificationRef.current = next;
    setNotificationSnapshot(next);
    try {
      localStorage.setItem(
        "campus-life:notifications-read",
        JSON.stringify(value),
      );
      return true;
    } catch (error) {
      console.error(
        "Could not save notification state to localStorage.",
        error,
      );
      window.dispatchEvent(new Event("campus-life:storage-error"));
      return false;
    }
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const reportStorageError = () =>
      showToast(t("common.storageError"), "error");
    window.addEventListener("campus-life:storage-error", reportStorageError);
    return () =>
      window.removeEventListener(
        "campus-life:storage-error",
        reportStorageError,
      );
  }, [showToast, t]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSidebarShortcut = (event) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "\\" &&
        !event.altKey
      ) {
        event.preventDefault();
        setSidebarCollapsed((collapsed) => !collapsed);
      }
    };
    window.addEventListener("keydown", handleSidebarShortcut);
    return () => window.removeEventListener("keydown", handleSidebarShortcut);
  }, []);

  useEffect(() => {
    if (!profileRef.current.persist) return;
    try {
      localStorage.setItem(
        "campus-life:profile",
        JSON.stringify(profileRef.current.value),
      );
    } catch (error) {
      console.error("Could not save profile settings to localStorage.", error);
      window.dispatchEvent(new Event("campus-life:storage-error"));
    }
  }, [profileSnapshot]);

  useEffect(() => {
    if (!notificationRef.current.persist) return;
    try {
      localStorage.setItem(
        "campus-life:notifications-read",
        JSON.stringify(notificationRef.current.value),
      );
    } catch (error) {
      console.error(
        "Could not save notification state to localStorage.",
        error,
      );
      window.dispatchEvent(new Event("campus-life:storage-error"));
    }
  }, [notificationSnapshot]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      root.dataset.theme = profile.followSystemTheme
        ? getPreferredTheme()
        : profile.theme;
    };
    applyTheme();
    if (!profile.followSystemTheme || !window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [profile.followSystemTheme, profile.theme]);

  useEffect(() => {
    const root = document.documentElement;
    const accessibility = profile.accessibility || {};
    root.dataset.textSize = accessibility.textSize || "M";
    root.dataset.reduceMotion = String(Boolean(accessibility.reduceMotion));
    root.dataset.highContrast = String(Boolean(accessibility.highContrast));
  }, [profile.accessibility]);

  useEffect(() => {
    document.title = t("app.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("app.description"));
  }, [t]);

  return (
    <CampusContext.Provider
      value={{
        tasks,
        setTasks,
        courses,
        setCourses,
        announcements,
        setAnnouncements,
        resources,
        setResources,
        profile,
        setProfile,
        showToast,
        readNotifications,
        setReadNotifications,
        now,
      }}
    >
      <div
        className={`app-shell ${sidebarCollapsed ? "sidebar-is-collapsed" : ""}`}
      >
        <Sidebar
          open={menuOpen}
          collapsed={sidebarCollapsed}
          triggerRef={menuButtonRef}
          onNavigate={closeMenu}
          onToggleCollapse={() =>
            setSidebarCollapsed((collapsed) => !collapsed)
          }
        />
        {menuOpen && (
          <button
            className="mobile-backdrop"
            aria-label={t("navigation.close")}
            onClick={() => setMenuOpen(false)}
          />
        )}
        <div className="main-shell">
          <Header
            menuOpen={menuOpen}
            menuButtonRef={menuButtonRef}
            onMenuClick={() => setMenuOpen((open) => !open)}
          />
          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/search" element={<GlobalSearch />} />
              {import.meta.env.DEV && (
                <Route path="/styleguide" element={<Styleguide />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
        <div className="toast-region">
          {toast && (
            <Toast
              key={toast.id}
              message={toast.message}
              tone={toast.tone}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </div>
    </CampusContext.Provider>
  );
}

export default App;
