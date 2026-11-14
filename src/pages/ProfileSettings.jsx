import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Download,
  FileUp,
  Info,
  LockKeyhole,
  Mail,
  MessageCircle,
  Palette,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useCampus } from "../context/CampusContext";
import { useAuth } from "../context/useAuth";
import { api } from "../services/api";
import Card from "../components/Card";
import FormSelect from "../components/FormSelect";
import PageHeader from "../components/PageHeader";
import {
  ConfirmModal,
  FloatingInput,
  LanguageSegmented,
  ProfileHeader,
  SettingsTabs,
  ThemePicker,
  ToggleSwitch,
} from "../components/ProfileSettingsComponents";
import { getStudyStreak } from "../services/studentData";
import "./ProfileSettings.css";

const sections = ["profile", "preferences", "notifications", "privacy"];
const majorAliases = {
  computerScience: ["computer science", "informatique"],
  business: ["business", "gestion", "commerce"],
  biology: ["biology", "biologie"],
  engineering: ["engineering", "ingénierie", "ingenierie"],
  psychology: ["psychology", "psychologie"],
  other: ["other", "autre"],
};

function getYearLevel(year, explicitLevel) {
  if (["1", "2", "3", "4", "5"].includes(String(explicitLevel)))
    return String(explicitLevel);
  const match = String(year || "").match(/[1-5]/);
  return match?.[0] || "3";
}

function getMajorKey(major, explicitKey) {
  if (Object.hasOwn(majorAliases, explicitKey)) return explicitKey;
  const normalized = String(major || "")
    .trim()
    .toLocaleLowerCase();
  return (
    Object.entries(majorAliases).find(([, aliases]) =>
      aliases.includes(normalized),
    )?.[0] || normalized
  );
}

function createDraft(profile) {
  return {
    name: profile.name || "",
    studentId: profile.studentId || "",
    major: getMajorKey(profile.major, profile.majorKey),
    yearLevel: getYearLevel(profile.year, profile.yearLevel),
    email: profile.email || "",
    university: profile.university || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
  };
}

function validateDraft(draft) {
  const errors = {};
  if (!draft.name.trim()) errors.name = "profileSettings.errors.required";
  if (!draft.studentId.trim()) {
    errors.studentId = "profileSettings.errors.required";
  } else if (!/^[a-z]{2}-\d{4}-\d{4}$/i.test(draft.studentId.trim())) {
    errors.studentId = "profileSettings.errors.studentId";
  }
  if (!draft.major.trim()) errors.major = "profileSettings.errors.required";
  if (!draft.yearLevel) errors.yearLevel = "profileSettings.errors.required";
  if (
    draft.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())
  ) {
    errors.email = "profileSettings.errors.email";
  }
  return errors;
}

function sameDraft(a, b) {
  return Object.keys(a).every((key) => a[key] === b[key]);
}

async function resizeImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  if (file.size > 8 * 1024 * 1024) throw new Error("too-large");
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 512 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function ProfileSettings() {
  const { t, i18n } = useTranslation();
  const {
    profile,
    setProfile,
    showToast,
    tasks,
    courses,
    now,
    reload,
  } = useCampus();
  const { user, changePassword } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = sections.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "profile";
  const [draft, setDraft] = useState(() => createDraft(profile));
  const [showErrors, setShowErrors] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [confirmAction, setConfirmAction] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const importRef = useRef(null);
  const errors = useMemo(() => validateDraft(draft), [draft]);
  const dirty = !sameDraft(draft, createDraft(profile));
  const displayName = draft.name.trim() || t("profile.studentName");
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const completionBase = ["name", "studentId", "major", "yearLevel"].filter(
    (key) => String(draft[key] || "").trim(),
  ).length;
  const completion = Math.min(
    100,
    Math.round((completionBase / 4) * 75) + (profile.avatar ? 25 : 0),
  );
  const stats = {
    completedTasks: tasks.filter((task) => task.status === "Completed").length,
    studyStreak: getStudyStreak(tasks, now),
    classesThisWeek: courses.length,
  };

  const setTab = (tab) => {
    if (tab === "profile") setSearchParams({});
    else setSearchParams({ tab });
  };

  const saveDraft = useCallback(
    async (notify = true) => {
      const currentErrors = validateDraft(draft);
      if (Object.keys(currentErrors).length) {
        setShowErrors(true);
        setSaveStatus("error");
        document
          .getElementById(`profile-${Object.keys(currentErrors)[0]}`)
          ?.focus();
        return false;
      }
      const saved = await setProfile((current) => ({
        ...current,
        ...draft,
        majorKey: Object.hasOwn(majorAliases, draft.major) ? draft.major : "",
        major: Object.hasOwn(majorAliases, draft.major)
          ? t(`profileSettings.majors.${draft.major}`)
          : draft.major,
        year: t(`profileSettings.years.${draft.yearLevel}`),
      }));
      setSaveStatus(saved ? "saved" : "error");
      if (saved && notify) showToast(t("profileSettings.savedToast"));
      return saved;
    },
    [draft, setProfile, showToast, t],
  );

  useEffect(() => {
    if (!dirty) return undefined;
    if (Object.keys(errors).length) {
      return undefined;
    }
    let saveTimer;
    const timer = window.setTimeout(() => {
      setSaveStatus("saving");
      saveTimer = window.setTimeout(async () => {
        const saved = await saveDraft(false);
        if (saved) showToast(t("profileSettings.autosavedToast"));
      }, 160);
    }, 850);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(saveTimer);
    };
  }, [dirty, draft, errors, saveDraft, showToast, t]);

  useEffect(() => {
    const warnBeforeUnload = (event) => {
    if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmInternalNavigation = (event) => {
      if (!dirty || !(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }
      if (!window.confirm(t("profileSettings.unsavedWarning"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", confirmInternalNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", confirmInternalNavigation, true);
    };
  }, [dirty, t]);

  const updateDraft = (key, value) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setShowErrors(true);
    setSaveStatus(
      Object.keys(validateDraft(next)).length ? "error" : "unsaved",
    );
  };

  const updatePreference = async (key, value) => {
    const saved = await setProfile((current) => ({ ...current, [key]: value }));
    if (!saved) showToast(t("common.apiError"), "error");
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (passwordDraft.next.length < 12 || passwordDraft.next.length > 128) {
      setPasswordError(t("auth.passwordLength"));
      return;
    }
    if (passwordDraft.next !== passwordDraft.confirm) {
      setPasswordError(t("auth.passwordMismatch"));
      return;
    }
    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordDraft.current,
        newPassword: passwordDraft.next,
      });
      setPasswordDraft({ current: "", next: "", confirm: "" });
      setPasswordMessage(t("auth.passwordChanged"));
    } catch (error) {
      setPasswordError(
        error.statusCode === 401
          ? t("auth.passwordChangeFailed")
          : error.statusCode === 400
            ? t("auth.passwordChangeFailed")
            : t("auth.requestFailed"),
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const uploadAvatar = async (file) => {
    try {
      const avatar = await resizeImage(file);
      const persisted = await setProfile((current) => ({ ...current, avatar }));
      if (persisted) showToast(t("profileSettings.photoSaved"));
    } catch (error) {
      console.error("Could not process the selected profile image.", error);
      showToast(
        t(
          error.message === "too-large"
            ? "profileSettings.errors.imageSize"
            : "profileSettings.errors.image",
        ),
        "error",
      );
    }
  };

  const exportData = async () => {
    try {
      const [
        profileData,
        taskData,
        courseData,
        examData,
        announcementData,
        resourceData,
        notificationData,
      ] =
        await Promise.all([
          api.getProfile(),
          api.getTasks(),
          api.getCourses(),
          api.getExams(),
          api.getAnnouncements(),
          api.getResources(),
          api.getNotifications(),
        ]);
        const payload = {
          application: "campus-life",
          version: 2,
          exportedAt: new Date().toISOString(),
          data: {
            profile: profileData,
            tasks: taskData,
            courses: courseData,
            exams: examData,
            announcements: announcementData.filter((item) => item.isOwner),
            resources: resourceData.filter((item) => item.isOwner),
            notifications: notificationData,
          },
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "campus-life-data.json";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t("profileSettings.exportedToast"));
    } catch (error) {
      console.error("Could not export CAMPUS LIFE data.", error);
      showToast(t("common.apiError"), "error");
    }
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (
        parsed.application !== "campus-life" ||
        ![1, 2].includes(parsed.version) ||
        !parsed.data ||
        typeof parsed.data !== "object"
      ) {
        throw new Error("invalid-export");
      }

      let data = parsed.data;
      if (parsed.version === 1) {
        const readLegacy = (key) => {
          const value = data[key];
          return typeof value === "string" ? JSON.parse(value) : value;
        };
        data = {
          profile: readLegacy("campus-life:profile"),
          tasks: readLegacy("campus-life:tasks"),
          courses: readLegacy("campus-life:courses"),
          exams: [],
          announcements: readLegacy("campus-life:announcements"),
          resources: readLegacy("campus-life:resources"),
          notifications: [],
        };
      }

      const collections = [
        "courses",
        "tasks",
        "exams",
        "announcements",
        "resources",
        "notifications",
      ];
      if (
        collections.some(
          (name) => name !== "exams" && !Array.isArray(data[name]),
        ) ||
        !data.profile ||
        typeof data.profile !== "object" ||
        Array.isArray(data.profile)
      ) {
        throw new Error("invalid-export");
      }
      if (!Array.isArray(data.exams)) data.exams = [];
      await api.replaceData(data);
      await reload();
      showToast(t("profileSettings.importedToast"));
    } catch (error) {
      console.error("Could not import the selected backup.", error);
      showToast(t("profileSettings.importError"), "error");
    }
  };

  const confirmDataAction = async () => {
    if (confirmAction === "clear") {
      setConfirmAction("");
      try {
        await api.clearData();
        await reload();
        showToast(t("profileSettings.clearedToast"));
      } catch (error) {
        console.error("Could not clear CAMPUS LIFE data from the API.", error);
        showToast(t("common.apiError"), "error");
      }
      return;
    }
    if (confirmAction === "import") {
      setConfirmAction("");
      importRef.current?.click();
      return;
    }
    setConfirmAction("");
  };

  const language = i18n.resolvedLanguage === "fr" ? "fr" : "en";
  const textSize = profile.accessibility?.textSize || "M";
  const notificationPreferences = {
    events: true,
    clubs: true,
    messages: true,
    deadlines: true,
    ...profile.notificationPreferences,
  };
  const accessibility = {
    textSize: "M",
    reduceMotion: false,
    highContrast: false,
    ...profile.accessibility,
  };

  return (
    <div className="module-page settings-page profile-settings-page">
      <PageHeader
        title={t("profileSettings.title")}
        subtitle={t("profileSettings.intro")}
      />

      <ProfileHeader
        profile={{
          ...profile,
          name: displayName,
          major: profile.majorKey
            ? t(`profileSettings.majors.${profile.majorKey}`)
            : profile.major,
        }}
        completion={completion}
        initials={initials}
        stats={stats}
        onUpload={uploadAvatar}
        onRemove={() => {
          updatePreference("avatar", "");
        }}
      />

      <SettingsTabs active={activeTab} onChange={setTab} />

      <div
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab}`}
        className="profile-tab-panel"
      >
        {activeTab === "profile" && (
          <>
          <div className="profile-settings-columns">
            <Card className="profile-settings-card student-info-card">
              <div className="profile-section-heading">
                <span className="settings-icon-badge">
                  <Info size={20} />
                </span>
                <div>
                  <h2>{t("profileSettings.studentInfo")}</h2>
                  <p>{t("profileSettings.studentInfoIntro")}</p>
                </div>
                <div
                  className={`profile-save-state state-${saveStatus}`}
                  aria-live="polite"
                >
                  {saveStatus === "saving" ? t("profileSettings.saving") : null}
                  {saveStatus === "saved" && (
                    <>
                      <Check size={16} />
                      {t("profileSettings.saved")}
                    </>
                  )}
                  {saveStatus === "unsaved" && t("profileSettings.unsaved")}
                  {saveStatus === "error" && t("profileSettings.fixErrors")}
                </div>
              </div>
              <div className="profile-form-grid">
                <FloatingInput
                  id="profile-name"
                  label={t("profileSettings.displayName")}
                  value={draft.name}
                  maxLength={80}
                  autoComplete="name"
                  error={showErrors ? errors.name : ""}
                  success={
                    showErrors && !errors.name && Boolean(draft.name.trim())
                  }
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
                <FloatingInput
                  id="profile-studentId"
                  label={t("profileSettings.studentId")}
                  value={draft.studentId}
                  maxLength={20}
                  error={showErrors ? errors.studentId : ""}
                  success={
                    showErrors &&
                    !errors.studentId &&
                    Boolean(draft.studentId.trim())
                  }
                  onChange={(event) =>
                    updateDraft("studentId", event.target.value)
                  }
                />
                <FormSelect
                  id="profile-major"
                  label={t("profileSettings.major")}
                  value={draft.major}
                  error={showErrors ? errors.major : ""}
                  className="profile-select-field"
                  onChange={(major) => updateDraft("major", major)}
                  options={[
                    { value: "", label: t("profileSettings.chooseMajor") },
                    ...Object.keys(majorAliases).map((item) => ({
                      value: item,
                      label: t(`profileSettings.majors.${item}`),
                    })),
                    ...(draft.major && !Object.hasOwn(majorAliases, draft.major)
                      ? [
                          {
                            value: draft.major,
                            label: profile.major || draft.major,
                          },
                        ]
                      : []),
                  ]}
                />
                <FormSelect
                  id="profile-yearLevel"
                  label={t("profileSettings.academicYear")}
                  value={draft.yearLevel}
                  error={showErrors ? errors.yearLevel : ""}
                  className="profile-select-field"
                  onChange={(yearLevel) =>
                    updateDraft("yearLevel", yearLevel)
                  }
                  options={[
                    { value: "", label: t("profileSettings.chooseYear") },
                    ...["1", "2", "3", "4", "5"].map((year) => ({
                      value: year,
                      label: t(`profileSettings.years.${year}`),
                    })),
                  ]}
                />
                <FloatingInput
                  id="profile-email"
                  label={t("profileSettings.email")}
                  value={user?.email || draft.email}
                  type="email"
                  autoComplete="email"
                  readOnly
                />
                <FloatingInput
                  id="profile-university"
                  label={t("profileSettings.university")}
                  value={draft.university}
                  autoComplete="organization"
                  onChange={(event) =>
                    updateDraft("university", event.target.value)
                  }
                />
                <FloatingInput
                  id="profile-phone"
                  label={t("profileSettings.phone")}
                  value={draft.phone}
                  type="tel"
                  autoComplete="tel"
                  onChange={(event) => updateDraft("phone", event.target.value)}
                />
                <div className="profile-bio-field">
                  <label htmlFor="profile-bio">
                    {t("profileSettings.bio")}
                  </label>
                  <textarea
                    id="profile-bio"
                    rows="3"
                    maxLength={120}
                    value={draft.bio}
                    onChange={(event) => updateDraft("bio", event.target.value)}
                  />
                  <span>{draft.bio.length}/120</span>
                </div>
              </div>
              <div className="profile-form-footer">
                <p>{t("profileSettings.localOnly")}</p>
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={!dirty}
                    onClick={() => {
                      setDraft(createDraft(profile));
                      setShowErrors(false);
                      setSaveStatus("saved");
                    }}
                  >
                    <RotateCcw size={17} />
                    {t("profileSettings.reset")}
                  </button>
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={!dirty}
                    onClick={() => saveDraft(true)}
                  >
                    <Save size={17} />
                    {t("profileSettings.save")}
                  </button>
                </div>
              </div>
            </Card>
            <Card className="profile-side-note profile-settings-card">
              <span className="settings-icon-badge">
                <Shield size={20} />
              </span>
              <h2>{t("profileSettings.localPrivacyTitle")}</h2>
              <p>{t("profileSettings.localPrivacyText")}</p>
              <ul className="profile-completion-list">
                {[
                  ["name", draft.name],
                  ["studentId", draft.studentId],
                  ["major", draft.major],
                  ["year", draft.yearLevel],
                  ["email", draft.email],
                  ["university", draft.university],
                  ["photo", profile.avatar],
                ].map(([key, value]) => {
                  const done = Boolean(String(value || "").trim());
                  const Icon = done ? CheckCircle2 : Circle;
                  return (
                    <li key={key} className={done ? "complete" : ""}>
                      <Icon size={18} aria-hidden="true" />
                      {t(`profileSettings.checklist.${key}`)}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="text-link"
                onClick={() => setTab("privacy")}
              >
                {t("profileSettings.manageData")}
              </button>
            </Card>
          </div>
          <Card className="profile-settings-card account-security-card">
            <div className="profile-section-heading">
              <span className="settings-icon-badge">
                <LockKeyhole size={20} />
              </span>
              <div>
                <h2>{t("auth.accountSecurity")}</h2>
                <p>{t("auth.accountSecurityIntro")}</p>
              </div>
            </div>
            <p className="account-email">
              <strong>{t("profileSettings.email")}:</strong> {user?.email}
            </p>
            <form className="account-password-form" onSubmit={submitPasswordChange}>
              <label>
                <span>{t("auth.currentPassword")}</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordDraft.current}
                  onChange={(event) =>
                    setPasswordDraft((current) => ({
                      ...current,
                      current: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>{t("auth.newPassword")}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  value={passwordDraft.next}
                  onChange={(event) =>
                    setPasswordDraft((current) => ({
                      ...current,
                      next: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label>
                <span>{t("auth.confirmPassword")}</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  value={passwordDraft.confirm}
                  onChange={(event) =>
                    setPasswordDraft((current) => ({
                      ...current,
                      confirm: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              {passwordError && (
                <p className="auth-error" role="alert">
                  {passwordError}
                </p>
              )}
              {passwordMessage && (
                <p className="account-password-success" role="status">
                  {passwordMessage}
                </p>
              )}
              <button
                className="button button-primary"
                type="submit"
                disabled={passwordSaving}
              >
                {t(passwordSaving ? "auth.working" : "auth.changePassword")}
              </button>
            </form>
          </Card>
          </>
        )}

        {activeTab === "preferences" && (
          <div className="profile-settings-columns">
            <Card className="profile-settings-card">
              <div className="profile-section-heading">
                <span className="settings-icon-badge">
                  <Palette size={20} />
                </span>
                <div>
                  <h2>{t("profileSettings.preferences")}</h2>
                  <p>{t("profileSettings.preferencesIntro")}</p>
                </div>
              </div>
              <div className="profile-preference-block">
                <div className="profile-preference-heading">
                  <div>
                    <h3>{t("profileSettings.language")}</h3>
                    <p>{t("profileSettings.languageHelp")}</p>
                  </div>
                  <LanguageSegmented
                    language={language}
                    onChange={(next) => i18n.changeLanguage(next)}
                  />
                </div>
              </div>
              <div className="profile-preference-block">
                <div className="profile-preference-heading">
                  <div>
                    <h3>{t("profileSettings.theme")}</h3>
                    <p>{t("theme.description")}</p>
                  </div>
                </div>
                <ThemePicker
                  theme={profile.theme}
                  onChange={(theme) =>
                    setProfile((current) => ({
                      ...current,
                      theme,
                      followSystemTheme: false,
                    }))
                  }
                />
                <ToggleSwitch
                  label={t("profileSettings.followSystem")}
                  description={t("profileSettings.followSystemHelp")}
                  checked={Boolean(profile.followSystemTheme)}
                  onChange={(checked) =>
                    updatePreference("followSystemTheme", checked)
                  }
                />
              </div>
            </Card>
            <Card className="profile-settings-card">
              <div className="profile-section-heading">
                <span className="settings-icon-badge">
                  <Info size={20} />
                </span>
                <div>
                  <h2>{t("profileSettings.accessibility")}</h2>
                  <p>{t("profileSettings.accessibilityHelp")}</p>
                </div>
              </div>
              <fieldset className="text-size-picker">
                <legend>{t("profileSettings.textSize")}</legend>
                {["S", "M", "L"].map((size) => (
                  <button
                    type="button"
                    key={size}
                    aria-pressed={textSize === size}
                    className={textSize === size ? "selected" : ""}
                    onClick={() =>
                      updatePreference("accessibility", {
                        ...accessibility,
                        textSize: size,
                      })
                    }
                  >
                    {size}
                  </button>
                ))}
              </fieldset>
              <ToggleSwitch
                label={t("profileSettings.reduceMotion")}
                checked={accessibility.reduceMotion}
                onChange={(checked) =>
                  updatePreference("accessibility", {
                    ...accessibility,
                    reduceMotion: checked,
                  })
                }
              />
              <ToggleSwitch
                label={t("profileSettings.highContrast")}
                checked={accessibility.highContrast}
                onChange={(checked) =>
                  updatePreference("accessibility", {
                    ...accessibility,
                    highContrast: checked,
                  })
                }
              />
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <Card className="profile-settings-card notification-preferences-card">
            <div className="profile-section-heading">
              <span className="settings-icon-badge">
                <Bell size={20} />
              </span>
              <div>
                <h2>{t("profileSettings.notificationPreferences")}</h2>
                <p>{t("profileSettings.notificationHelp")}</p>
              </div>
            </div>
            <div className="notification-preference-list">
              {[
                ["events", CalendarDays],
                ["clubs", Users],
                ["messages", MessageCircle],
                ["deadlines", Clock3],
              ].map(([key, Icon]) => (
                <ToggleSwitch
                  key={key}
                  icon={Icon}
                  label={t(`profileSettings.notificationTypes.${key}`)}
                  description={t(
                    `profileSettings.notificationDescriptions.${key}`,
                  )}
                  checked={notificationPreferences[key]}
                  onChange={(checked) =>
                    updatePreference("notificationPreferences", {
                      ...notificationPreferences,
                      [key]: checked,
                    })
                  }
                />
              ))}
            </div>
          </Card>
        )}

        {activeTab === "privacy" && (
          <div className="profile-settings-columns">
            <Card className="profile-settings-card">
              <div className="profile-section-heading">
                <span className="settings-icon-badge">
                  <Shield size={20} />
                </span>
                <div>
                  <h2>{t("profileSettings.privacyTitle")}</h2>
                  <p>{t("profileSettings.privacyIntro")}</p>
                </div>
              </div>
              <div className="privacy-data-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={exportData}
                >
                  <Download size={18} />
                  {t("profileSettings.export")}
                </button>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setConfirmAction("import")}
                >
                  <FileUp size={18} />
                  {t("profileSettings.import")}
                </button>
              </div>
              <div className="profile-danger-zone">
                <div>
                  <h3>{t("profileSettings.dangerTitle")}</h3>
                  <p>{t("profileSettings.clearDataWarning")}</p>
                </div>
                <button
                  type="button"
                  className="button button-danger"
                  onClick={() => setConfirmAction("clear")}
                >
                  <Trash2 size={17} />
                  {t("profileSettings.clearData")}
                </button>
              </div>
            </Card>
            <Card className="profile-settings-card profile-about-card">
              <div className="profile-section-heading">
                <span className="settings-icon-badge">
                  <Info size={20} />
                </span>
                <div>
                  <h2>{t("profileSettings.about")}</h2>
                  <p>{t("profileSettings.aboutIntro")}</p>
                </div>
              </div>
              <dl>
                <div>
                  <dt>{t("profileSettings.appVersion")}</dt>
                  <dd>1.0.0</dd>
                </div>
                <div>
                  <dt>{t("profileSettings.storageLocation")}</dt>
                  <dd>{t("profileSettings.serverDatabase")}</dd>
                </div>
              </dl>
              <details className="keyboard-shortcuts">
                <summary>
                  <Mail size={17} />
                  {t("profileSettings.helpShortcuts")}
                </summary>
                <ul>
                  <li>{t("profileSettings.shortcutTab")}</li>
                  <li>{t("profileSettings.shortcutEnter")}</li>
                  <li>{t("profileSettings.shortcutEscape")}</li>
                </ul>
              </details>
            </Card>
          </div>
        )}
      </div>

      <input
        ref={importRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={importData}
        aria-hidden="true"
        tabIndex={-1}
      />

      {dirty && (
        <div className="profile-mobile-savebar">
          <span aria-live="polite">
            {saveStatus === "saving"
              ? t("profileSettings.saving")
              : t("profileSettings.unsaved")}
          </span>
          <button
            type="button"
            className="button button-primary"
            disabled={!dirty}
            onClick={() => saveDraft(true)}
          >
            <Save size={17} />
            {t("profileSettings.save")}
          </button>
        </div>
      )}

      {confirmAction && (
        <ConfirmModal
          title={t(
            confirmAction === "clear"
              ? "profileSettings.confirmClearTitle"
              : "profileSettings.confirmImportTitle",
          )}
          message={t(
            confirmAction === "clear"
              ? "profileSettings.confirmClearMessage"
              : "profileSettings.confirmImportMessage",
          )}
          confirmLabel={t(
            confirmAction === "clear"
              ? "profileSettings.clearData"
              : "profileSettings.import",
          )}
          onCancel={() => setConfirmAction("")}
          onConfirm={confirmDataAction}
        />
      )}
    </div>
  );
}
