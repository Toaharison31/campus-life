// Compose le tableau de bord à partir des activités et indicateurs du campus.
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  GraduationCap,
  NotebookTabs,
  Plus,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { api } from "../services/api";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import {
  formatShortDate,
  getLocalDateString,
  getTodayScheduleLabel,
} from "../services/dates";
import {
  getClassesForDay,
  getCampusAlerts,
  getNextClass,
  getTaskStats,
  getWeeklyActivity,
} from "../services/studentData";
import { getCourseColorClass } from "../services/courseColors";
import {
  CourseChip,
  PriorityBadge,
  UnreadBadge,
} from "../components/StatusBadges";

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { tasks, courses, exams, announcements, resources, profile, now } =
    useCampus();
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState(false);
  const summaryRequestRef = useRef(null);
  useEffect(() => {
    let active = true;
    if (!summaryRequestRef.current) {
      summaryRequestRef.current = api.getDashboardSummary();
    }
    const request = summaryRequestRef.current;
    request
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((error) => {
        console.error("Could not load dashboard analytics.", error);
        if (active) setSummaryError(true);
      })
      .finally(() => {
        if (summaryRequestRef.current === request) {
          summaryRequestRef.current = null;
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const displayName = profile.name.trim() || t("profile.studentName");
  const {
    completed,
    pending,
    overdue,
    completion: progress,
  } = getTaskStats(tasks, getLocalDateString(now));
  const language = i18n.resolvedLanguage || "fr";
  const greetingKey =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 18
        ? "afternoon"
        : "evening";
  const nextClass = getNextClass(courses, now);
  const todayClasses = getClassesForDay(courses, now);
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  const classState = (course) => {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(course.endTime || ""))
      return "upcoming";
    const [hour, minute] = course.endTime.split(":").map(Number);
    return hour * 60 + minute <= currentMinute ? "done" : "upcoming";
  };
  const allClassesDone =
    todayClasses.length > 0 &&
    todayClasses.every((course) => classState(course) === "done");
  const weeklyActivity = getWeeklyActivity(tasks);
  const alerts = getCampusAlerts({
    tasks,
    courses,
    exams,
    announcements,
    now,
    preferences: profile.notificationPreferences,
  }).slice(0, 5);
  const nextClassDate = nextClass ? new Date(now) : null;
  if (nextClassDate) {
    nextClassDate.setDate(nextClassDate.getDate() + nextClass.dayOffset);
    const [hour, minute] = nextClass.startTime.split(":").map(Number);
    nextClassDate.setHours(hour, minute, 0, 0);
  }
  const minutesUntilNextClass = nextClassDate
    ? Math.max(0, Math.ceil((nextClassDate.getTime() - now.getTime()) / 60_000))
    : null;
  const activityMax = Math.max(1, ...weeklyActivity.map((day) => day.count));
  const urgentDeadline = new Date(now);
  urgentDeadline.setDate(urgentDeadline.getDate() + 2);
  const urgentLimit = getLocalDateString(urgentDeadline);
  const taskStats = summary?.tasks || {
    total: tasks.length,
    completed,
    pending,
    overdue,
    urgent: tasks.filter(
      (task) =>
        task.status !== "Completed" &&
        task.priority === "High" &&
        task.dueDate &&
        task.dueDate <= urgentLimit,
    ).length,
    completion: progress,
  };
  const recentTasks = [...tasks]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 4);
  const recentAnnouncements = [...announcements]
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, 3);

  return (
    <div className="dashboard-page dashboard-v2">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <Badge tone="hero">
            <span className="hero-brand-symbol" aria-hidden="true">
              <BookOpen size={15} strokeWidth={2.2} />
            </span>
            {t("dashboard.eyebrow")}
          </Badge>
          <h1>
            {t(`dashboard.greetings.${greetingKey}`, { name: displayName })}
          </h1>
          <p>{t("dashboard.intro")}</p>
          <Button as={Link} to="/tasks" className="hero-action">
            <Plus size={17} aria-hidden="true" />
            {t("dashboard.newTask")}
          </Button>
        </div>
        <div className="hero-profile">
          <div className="avatar avatar-large" aria-hidden="true">
            {displayName
              .split(/\s+/)
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <span>{t("dashboard.profile")}</span>
            <strong>{displayName}</strong>
            <small>
              {[profile.major, profile.year].filter(Boolean).join(" · ")}
            </small>
          </div>
          <Link
            to="/profile"
            className="hero-profile-link"
            aria-label={t("profileSettings.title")}
          >
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-campus-emblem" aria-hidden="true">
          <div className="hero-campus-orbit" />
          <div className="hero-campus-mark">
            <GraduationCap size={54} strokeWidth={1.55} />
            <span>CAMPUS LIFE</span>
          </div>
          <span className="hero-emblem-chip hero-emblem-calendar">
            <CalendarDays size={18} />
          </span>
          <span className="hero-emblem-chip hero-emblem-book">
            <BookOpen size={18} />
          </span>
          <span className="hero-emblem-chip hero-emblem-check">
            <Check size={18} />
          </span>
          <Sparkles className="hero-emblem-sparkle" size={18} />
        </div>
      </section>

      <div className="dashboard-date-line">
        <span>{getTodayScheduleLabel(language)}</span>
      </div>

      <section
        className="stats-grid"
        aria-label={t("dashboard.taskCompletion")}
      >
        <StatCard
          icon={NotebookTabs}
          label={t("dashboard.totalTasks")}
          value={taskStats.total}
          note={t("dashboard.allCourses")}
          tone="blue"
          onClick={() => navigate("/tasks")}
        />
        <StatCard
          icon={Check}
          label={t("dashboard.completed")}
          value={taskStats.completed}
          note={t("dashboard.completionRate", { percent: taskStats.completion })}
          tone="green"
          onClick={() => navigate("/tasks?status=Completed")}
        />
        <StatCard
          icon={Clock3}
          label={t("dashboard.pending")}
          value={taskStats.pending}
          note={t("dashboard.urgentTasksCount", {
            count: taskStats.urgent || 0,
          })}
          tone="amber"
          onClick={() => navigate("/tasks?status=Pending")}
        />
        <StatCard
          icon={AlertCircle}
          label={t("dashboard.overdue")}
          value={taskStats.overdue}
          note={
            taskStats.overdue === 0
              ? t("dashboard.allCaughtUp")
              : t("dashboard.overdueTasks")
          }
          tone="red"
          onClick={() => navigate("/tasks?status=Overdue")}
        />
      </section>

      <Card className="dashboard-card alert-center">
        <div className="panel-heading">
          <div>
            <h2>{t("dashboard.alertCenter")}</h2>
            <p>{t("dashboard.alertCenterIntro")}</p>
          </div>
          <Link className="text-link" to="/notifications">
            {t("dashboard.allAlerts")} <ArrowRight size={15} />
          </Link>
        </div>
        {summaryError && (
          <p className="alert-center-note">{t("dashboard.analyticsUnavailable")}</p>
        )}
        {alerts.length ? (
          <ul className="alert-center-list">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link to={alert.href} className={`alert-center-item alert-${alert.type}`}>
                  <span className="alert-center-icon">
                    {alert.type === "class" || alert.type === "exam" ? (
                      <CalendarDays size={17} />
                    ) : alert.type === "announcement" ? (
                      <Sparkles size={17} />
                    ) : alert.type === "overdue" ? (
                      <AlertCircle size={17} />
                    ) : (
                      <Clock3 size={17} />
                    )}
                  </span>
                  <span className="alert-center-copy">
                    <strong>{alert.title}</strong>
                    <small>
                      {t(`dashboard.alertTypes.${alert.type}`)} ·{" "}
                      {formatShortDate(alert.date, language)}
                      {alert.time ? ` · ${alert.time}` : ""}
                    </small>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="alert-center-empty">{t("dashboard.noAlerts")}</p>
        )}
      </Card>

      <div className="dashboard-grid">
        <Card className="dashboard-card task-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("dashboard.recentTasks")}</h2>
              <p>{t("dashboard.recentTasksIntro")}</p>
            </div>
            <Link className="text-link" to="/tasks">
              {t("dashboard.viewAll")} <ArrowRight size={15} />
            </Link>
          </div>
          {recentTasks.length ? (
            <div className="task-list">
              {recentTasks.map((task) => {
                const linkedCourse = courses.find(
                  (course) => course.id === task.courseId,
                );
                const priority = ["Low", "Medium", "High"].includes(
                  task.priority,
                )
                  ? task.priority
                  : "Medium";
                return (
                  <div className="task-row" key={task.id}>
                    <span
                      className={`task-check ${task.status === "Completed" ? "checked" : ""}`}
                      aria-label={t(`status.${task.status}`)}
                    >
                      {task.status === "Completed" && <Check size={13} />}
                    </span>
                    <div className="task-row-copy">
                      <strong
                        className={
                          task.status === "Completed" ? "text-done" : ""
                        }
                      >
                        {task.title}
                      </strong>
                      <span>
                        {t("dashboard.dueShort", {
                          date: formatShortDate(task.dueDate, language),
                        })}
                      </span>
                      {linkedCourse && <CourseChip course={linkedCourse} />}
                    </div>
                    <PriorityBadge
                      level={priority}
                      label={t(`priority.${priority}`)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title={t("dashboard.emptyTasksTitle")}
              message={t("dashboard.emptyTasksMessage")}
              action={t("tasks.add")}
              to="/tasks"
            />
          )}
          <div className="task-progress">
            <div
              className="progress-ring"
              style={{ "--progress-value": `${taskStats.completion}%` }}
              role="img"
              aria-label={t("dashboard.completionRate", {
                percent: taskStats.completion,
              })}
            >
              <span>{taskStats.completion}%</span>
            </div>
            <div className="task-progress-copy">
              <strong>{t("dashboard.taskCompletion")}</strong>
              <span>
                {t("dashboard.completedOf", {
                  completed: taskStats.completed,
                  total: taskStats.total,
                  count: taskStats.total,
                })}
              </span>
              <div className="progress-track" aria-hidden="true">
                <i style={{ width: `${taskStats.completion}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="dashboard-card schedule-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("dashboard.todaysClasses")}</h2>
              <p>{getTodayScheduleLabel(language)}</p>
            </div>
            <span className="section-icon">
              <CalendarDays size={19} aria-hidden="true" />
            </span>
          </div>
          {todayClasses.length ? (
            <div className="class-list">
              {todayClasses.map((course, index) => (
                <div
                  className={`class-row ${index === 0 && !allClassesDone ? "class-row-next" : ""} ${classState(course) === "done" ? "class-row-done" : ""} ${getCourseColorClass(course)}`}
                  style={
                    course.color
                      ? { "--course-accent-color": course.color }
                      : undefined
                  }
                  key={course.id}
                >
                  <div className="class-time">
                    {course.startTime}
                    <span>{course.endTime}</span>
                  </div>
                  <div className="class-indicator" />
                  <div className="class-copy">
                    {classState(course) === "done" ? (
                      <span className="class-state-done">
                        {t("dashboard.classDone")}
                      </span>
                    ) : index === 0 && !allClassesDone ? (
                      <span>{t("dashboard.nextClassLabel")}</span>
                    ) : null}
                    <strong>{course.name}</strong>
                    <span>
                      {course.classroom} · {course.teacher}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("dashboard.noClassesToday")}
              message={t("dashboard.freeTime")}
              action={t("dashboard.viewTimetable")}
              to="/timetable"
              icon={CalendarDays}
            />
          )}
          {allClassesDone && (
            <p className="no-more-classes">{t("dashboard.noMoreClasses")}</p>
          )}
          {nextClass && minutesUntilNextClass !== null && minutesUntilNextClass < 1440 && (
            <p className="class-countdown">
              {t("dashboard.classCountdown", {
                title: nextClass.name,
                minutes: minutesUntilNextClass,
              })}
            </p>
          )}
          <Link className="schedule-footer" to="/timetable">
            {nextClass
              ? t("dashboard.nextClass", {
                  day:
                    nextClass.dayOffset === 0
                      ? t("dashboard.today")
                      : t(`weekday.${nextClass.day}`),
                  time: nextClass.startTime,
                  title: nextClass.name,
                })
              : t("dashboard.weeklyTimetable")}{" "}
            <ArrowRight size={15} />
          </Link>
        </Card>

        <Card className="dashboard-card announcements-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("dashboard.campusUpdates")}</h2>
              <p>{t("dashboard.latestUniversity")}</p>
            </div>
            <Link
              className="panel-icon-link"
              to="/announcements"
              aria-label={t("dashboard.allUpdates")}
            >
              <ArrowRight size={17} />
            </Link>
          </div>
          {recentAnnouncements.length ? (
            <div className="announcement-list">
              {recentAnnouncements.map((item) => (
                <article
                  className={`announcement-row ${item.isRead ? "" : "announcement-row-unread"}`}
                  key={item.id}
                >
                  <span
                    className={`category-mark category-${String(item.category || "General").toLowerCase()}`}
                  />
                  <div>
                    <div className="announcement-meta">
                      <span>{t(`category.${item.category}`)}</span>
                      {!item.isRead && (
                        <UnreadBadge>{t("announcements.unread")}</UnreadBadge>
                      )}
                      <time>{formatShortDate(item.publishedAt, language)}</time>
                    </div>
                    <strong>{item.title}</strong>
                    <p>{item.content}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("dashboard.noAnnouncements")}
              action={t("dashboard.allUpdates")}
              to="/announcements"
            />
          )}
        </Card>

        <Card className="dashboard-card activity-panel">
          <div className="panel-heading">
            <div>
              <h2>{t("dashboard.weeklyActivity")}</h2>
              <p>{t("dashboard.weeklyActivityIntro")}</p>
            </div>
            <span className="section-icon">
              <Activity size={19} aria-hidden="true" />
            </span>
          </div>
          <div
            className="activity-chart"
            role="img"
            aria-label={t("dashboard.weeklyActivity")}
          >
            {weeklyActivity.map((day) => (
              <div className="activity-day" key={day.date}>
                <span>{day.count}</span>
                <i
                  style={{
                    height: `${Math.max(8, (day.count / activityMax) * 74)}px`,
                  }}
                />
                <small>
                  {new Date(`${day.date}T12:00:00`).toLocaleDateString(
                    language === "fr" ? "fr-FR" : "en-US",
                    { weekday: "short" },
                  )}
                </small>
              </div>
            ))}
          </div>
          <Link className="quick-resource" to="/resources">
            <span className="section-icon">
              <BookOpen size={17} aria-hidden="true" />
            </span>
            <div>
              <strong>{t("dashboard.exploreLibrary")}</strong>
              <small>
                {t("dashboard.resourcesReady", { count: resources.length })}
              </small>
            </div>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Card>
      </div>
    </div>
  );
}
