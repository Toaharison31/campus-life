import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CampusContext } from "./context/CampusContext";
import { useAuth } from "./context/useAuth";
import { api } from "./services/api";
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
import AuthPage from "./pages/AuthPage";
import Toast from "./components/Toast";
import Skeleton from "./components/Skeleton";

function getPreferredTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

function LoadingState({ label }) {
  return (
    <section
      className="loading-state animate-fade-up"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div className="loading-heading">
        <Skeleton className="loading-eyebrow" width="8rem" height="12px" />
        <Skeleton className="loading-title" width="min(24rem, 80%)" height="30px" />
        <Skeleton className="loading-subtitle" width="min(32rem, 90%)" height="14px" />
      </div>
      <div className="loading-stat-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="loading-stat-card" key={index}>
            <Skeleton width="54%" height="12px" />
            <Skeleton width="36%" height="26px" />
            <Skeleton width="72%" height="10px" />
          </div>
        ))}
      </div>
      <div className="loading-content-grid">
        {Array.from({ length: 2 }, (_, index) => (
          <div className="loading-panel" key={index}>
            <div className="loading-panel-heading">
              <Skeleton width="54%" height="16px" />
              <Skeleton width="78%" height="12px" />
            </div>
            {Array.from({ length: 3 }, (_, row) => (
              <div className="loading-row" key={row}>
                <Skeleton width="36px" height="36px" rounded />
                <div className="loading-row-copy">
                  <Skeleton width="76%" height="12px" />
                  <Skeleton width="48%" height="10px" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const {
    user,
    status: authStatus,
    authError,
    retry: retryAuth,
    updateUser,
  } = useAuth();
  const userId = user?.id;
  const userDisplayName = user?.displayName || "";
  const userEmail = user?.email || "";
  const location = useLocation();
  const pageContentRef = useRef(null);
  const [tasks, setTasksState] = useState([]);
  const [courses, setCoursesState] = useState([]);
  const [exams, setExamsState] = useState([]);
  const [announcements, setAnnouncementsState] = useState([]);
  const [resources, setResourcesState] = useState([]);
  const [notifications, setNotificationsState] = useState([]);
  const setTasks = useCallback((update) => {
    setTasksState(update);
    return true;
  }, []);
  const setCourses = useCallback((update) => {
    setCoursesState(update);
    return true;
  }, []);
  const setExams = useCallback((update) => {
    setExamsState(update);
    return true;
  }, []);
  const setAnnouncements = useCallback(
    (update) => {
      setAnnouncementsState(update);
      return true;
    },
    [],
  );
  const setResources = useCallback(
    (update) => {
      setResourcesState(update);
      return true;
    },
    [],
  );
  const setNotifications = useCallback(
    (update) => {
      setNotificationsState(update);
      return true;
    },
    [],
  );
  const [profile, setProfileState] = useState(() => ({
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
      language: i18n.resolvedLanguage === "en" ? "en" : "fr",
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
    }));
  const profileRef = useRef(profile);
  const profileWriteQueue = useRef(Promise.resolve());
  const authUserRef = useRef(user);
  useEffect(() => {
    authUserRef.current = user;
  }, [user]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dataOwnerId, setDataOwnerId] = useState(null);
  const loadedUserIdRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useLayoutEffect(() => {
    if (!pageContentRef.current) return;
    pageContentRef.current.scrollTop = 0;
    pageContentRef.current.scrollLeft = 0;
  }, [location.pathname]);

  const setProfile = useCallback((update) => {
    const ownerId = user?.id;
    if (!ownerId) return Promise.resolve(false);
    const previous = profileRef.current;
    const value = typeof update === "function" ? update(previous) : update;
    profileRef.current = value;
    setProfileState(value);

    // La file évite qu'une ancienne écriture n'écrase une mise à jour récente.
    const save = profileWriteQueue.current.then(() => {
      if (authUserRef.current?.id !== ownerId) {
        throw new Error("The active account changed before this update was saved.");
      }
      return api.updateProfile(value);
    });
    profileWriteQueue.current = save.then(
      () => undefined,
      () => undefined,
    );
    return save
      .then((saved) => {
        if (profileRef.current === value) {
          const next = { ...value, ...saved };
          profileRef.current = next;
          setProfileState(next);
        }
        updateUser({ displayName: value.name });
        return true;
      })
      .catch((error) => {
        console.error("Could not save profile settings to the API.", error);
        if (profileRef.current === value) {
          profileRef.current = previous;
          setProfileState(previous);
        }
        window.dispatchEvent(
          new CustomEvent("campus-life:api-error", { detail: error }),
        );
        return false;
      });
  }, [updateUser, user?.id]);
  const loadData = useCallback(async () => {
    if (!userId) return false;
    try {
      // Charge les données indépendantes en parallèle.
      const [
        tasksData,
        coursesData,
        examsData,
        announcementsData,
        resourcesData,
        notificationsData,
        profileData,
      ] = await Promise.all([
        api.getTasks(),
        api.getCourses(),
        api.getExams(),
        api.getAnnouncements(),
        api.getResources(),
        api.getNotifications(),
        api.getProfile(),
      ]);
      const normalize = (response) => {
        if (Array.isArray(response)) return response;
        return Array.isArray(response?.data) ? response.data : [];
      };
      const defaultAccessibility = {
        textSize: "M",
        reduceMotion: false,
        highContrast: false,
      };
      const defaultNotificationPreferences = {
        events: true,
        clubs: true,
        messages: true,
        deadlines: true,
      };
      const profileDefaults = {
        name: userDisplayName,
        studentId: "",
        major: "",
        year: "",
        yearLevel: "3",
        email: userEmail,
        university: "",
        phone: "",
        bio: "",
        avatar: "",
        theme: getPreferredTheme(),
        language: i18n.resolvedLanguage === "en" ? "en" : "fr",
        followSystemTheme: false,
        accessibility: defaultAccessibility,
        notificationPreferences: defaultNotificationPreferences,
      };
      const resolvedProfile =
        profileData ?? (await api.updateProfile(profileDefaults));
      const nextProfile = {
        ...profileDefaults,
        ...resolvedProfile,
        accessibility: {
          ...profileDefaults.accessibility,
          ...(resolvedProfile.accessibility || {}),
        },
        notificationPreferences: {
          ...profileDefaults.notificationPreferences,
          ...(resolvedProfile.notificationPreferences || {}),
        },
      };
      profileRef.current = nextProfile;
      setProfileState(nextProfile);
      updateUser({ displayName: nextProfile.name, email: userEmail });
      setTasksState(normalize(tasksData));
      setCoursesState(normalize(coursesData));
      setExamsState(normalize(examsData));
      setAnnouncementsState(normalize(announcementsData));
      setResourcesState(normalize(resourcesData));
      setNotificationsState(normalize(notificationsData));
      setDataOwnerId(userId);
      setLoadError("");
      if (resolvedProfile.language === "fr" || resolvedProfile.language === "en") {
        await i18n.changeLanguage(resolvedProfile.language);
      }
      return true;
    } catch (error) {
      console.error("Could not load CAMPUS LIFE data from the API.", error);
      setDataOwnerId(null);
      setLoadError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [i18n, updateUser, userDisplayName, userEmail, userId]);
  const reload = useCallback(() => {
    setLoading(true);
    setLoadError("");
    return loadData();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const reportApiError = () =>
      showToast(t("common.apiError"), "error");
    window.addEventListener("campus-life:api-error", reportApiError);
    return () =>
      window.removeEventListener("campus-life:api-error", reportApiError);
  }, [showToast, t]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId) {
      loadedUserIdRef.current = null;
      return;
    }
    if (loadedUserIdRef.current === userId) return;

    loadedUserIdRef.current = userId;
    // oxlint-disable-next-line react/set-state-in-effect
    void loadData().then((succeeded) => {
      if (!succeeded && loadedUserIdRef.current === userId) {
        loadedUserIdRef.current = null;
      }
    });
  }, [authStatus, loadData, userId]);

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

  if (authStatus === "checking") {
    return (
      <main className="auth-page" role="status" aria-live="polite">
        {t("common.loading")}
      </main>
    );
  }
  if (authStatus === "error") {
    return (
      <main className="auth-page">
        <section className="auth-card" role="alert">
          <h1>{t("common.apiError")}</h1>
          <p>{authError}</p>
          <button
            type="button"
            className="button button-primary auth-submit"
            onClick={() => retryAuth().catch(() => {})}
          >
            {t("common.retry")}
          </button>
        </section>
      </main>
    );
  }
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
              state={{ from: location.pathname }}
            />
          }
        />
      </Routes>
    );
  }

  return (
    <CampusContext.Provider
      value={{
        tasks,
        setTasks,
        courses,
        setCourses,
        exams,
        setExams,
        announcements,
        setAnnouncements,
        resources,
        setResources,
        notifications,
        setNotifications,
        profile,
        setProfile,
        showToast,
        now,
        loading,
        loadError,
        reload,
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
          <main ref={pageContentRef} className="page-content">
            {loading ? (
              <LoadingState label={t("common.loading")} />
            ) : loadError ? (
              <section className="panel" role="alert">
                <p>{t("common.apiError")}</p>
                <p>{loadError}</p>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={reload}
                >
                  {t("common.retry")}
                </button>
              </section>
            ) : dataOwnerId !== user.id ? (
              <LoadingState label={t("common.loading")} />
            ) : (
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
            )}
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
