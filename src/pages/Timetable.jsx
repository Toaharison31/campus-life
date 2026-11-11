import { useState } from "react";
import { CalendarDays, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { createId } from "../services/storage";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormSelect from "../components/FormSelect";
import TimePicker from "../components/TimePicker";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { getCourseColorClass } from "../services/courseColors";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const blank = {
  name: "",
  day: "Monday",
  startTime: "",
  endTime: "",
  classroom: "",
  teacher: "",
};
const validTime = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function Timetable() {
  const { t } = useTranslation();
  const { courses, setCourses, showToast, now } = useCampus();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [view, setView] = useState("week");
  const currentDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(now);
  const [selectedDay, setSelectedDay] = useState(
    days.includes(currentDay) ? currentDay : "Monday",
  );
  const openForm = (course = null) => {
    setEditing(course || false);
    setForm(course ? { ...course } : blank);
    setError("");
  };
  const closeForm = () => setEditing(null);
  const save = (event) => {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !form.startTime ||
      !form.endTime ||
      !form.classroom.trim() ||
      !form.teacher.trim()
    ) {
      setError("timetable.required");
      return;
    }
    if (!validTime(form.startTime) || !validTime(form.endTime)) {
      setError("timetable.invalidTime");
      return;
    }
    if (form.startTime >= form.endTime) {
      setError("timetable.timeOrder");
      return;
    }
    const conflict = courses.some(
      (course) =>
        course.id !== (editing || {}).id &&
        course.day === form.day &&
        form.startTime < course.endTime &&
        form.endTime > course.startTime,
    );
    if (conflict) {
      setError("timetable.overlap");
      return;
    }
    const saved = {
      ...form,
      name: form.name.trim(),
      classroom: form.classroom.trim(),
      teacher: form.teacher.trim(),
    };
    const persisted = setCourses((items) =>
      editing
        ? items.map((item) =>
            item.id === editing.id ? { ...item, ...saved } : item,
          )
        : [...items, { ...saved, id: createId("course") }],
    );
    closeForm();
    showToast(
      t(persisted ? "common.saved" : "common.storageError"),
      persisted ? "success" : "error",
    );
  };
  const remove = () => {
    const persisted = setCourses((items) =>
      items.filter((item) => item.id !== deleting.id),
    );
    setDeleting(null);
    showToast(
      t(persisted ? "common.deleted" : "common.storageError"),
      persisted ? "success" : "error",
    );
  };
  const totalHours = courses.reduce((sum, course) => {
    if (!validTime(course.startTime) || !validTime(course.endTime)) return sum;
    const [startHour, startMinute] = course.startTime.split(":").map(Number);
    const [endHour, endMinute] = course.endTime.split(":").map(Number);
    return sum + (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
  }, 0);

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("timetable.eyebrow")}
        title={t("timetable.title")}
        subtitle={t("timetable.intro")}
        action={
          <button className="button button-primary" onClick={() => openForm()}>
            <Plus size={17} /> {t("timetable.add")}
          </button>
        }
      />
      <div className="module-summary timetable-summary">
        <div>
          <strong>{courses.length}</strong>
          <span>{t("timetable.classesThisWeek")}</span>
        </div>
        <div>
          <strong>
            {totalHours.toFixed(1)}
            <small>{t("timetable.hours")}</small>
          </strong>
          <span>{t("timetable.timeInClass")}</span>
        </div>
        <div>
          <strong>{new Set(courses.map((course) => course.name)).size}</strong>
          <span>{t("timetable.uniqueCourses")}</span>
        </div>
        <div>
          <strong>
            {
              days.filter((day) => courses.some((course) => course.day === day))
                .length
            }
          </strong>
          <span>{t("timetable.daysOnCampus")}</span>
        </div>
      </div>
      <section className="panel timetable-panel">
        <div className="panel-heading timetable-heading">
          <div>
            <h2>{t("timetable.weeklySchedule")}</h2>
            <p>{t("timetable.weekRange")}</p>
          </div>
          <div className="timetable-controls">
            {view === "day" && (
              <select
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
                aria-label={t("timetable.selectDay")}
              >
                {days.map((day) => (
                  <option value={day} key={day}>
                    {t(`weekday.${day}`)}
                  </option>
                ))}
              </select>
            )}
            <div
              className="view-switch"
              role="group"
              aria-label={t("timetable.viewLabel")}
            >
              <button
                type="button"
                aria-pressed={view === "week"}
                className={view === "week" ? "selected" : ""}
                onClick={() => setView("week")}
              >
                {t("timetable.weekView")}
              </button>
              <button
                type="button"
                aria-pressed={view === "day"}
                className={view === "day" ? "selected" : ""}
                onClick={() => setView("day")}
              >
                {t("timetable.dayView")}
              </button>
            </div>
          </div>
        </div>
        <div className={`week-grid ${view === "day" ? "day-view-grid" : ""}`}>
          {(view === "day" ? [selectedDay] : days).map((day) => {
            const dayCourses = courses
              .filter((course) => course.day === day)
              .sort((a, b) =>
                String(a.startTime || "").localeCompare(
                  String(b.startTime || ""),
                ),
              );
            return (
              <section className="day-column" key={day}>
                <div className="day-heading">
                  <strong>{t(`weekday.${day}`)}</strong>
                  <span>
                    <strong>{dayCourses.length}</strong>{" "}
                    {t("timetable.class", { count: dayCourses.length })}
                  </span>
                </div>
                {dayCourses.length ? (
                  dayCourses.map((course) => (
                    <article
                      className={`course-card ${getCourseColorClass(course)}`}
                      key={course.id}
                    >
                      <div className="course-time">
                        <Clock3 size={13} />
                        {course.startTime}
                        <span>– {course.endTime}</span>
                      </div>
                      <strong>{course.name}</strong>
                      <span>{course.classroom}</span>
                      <small>{course.teacher}</small>
                      <div className="course-actions">
                        <button
                          className="icon-button"
                          title={t("timetable.edit", {
                            title: course.name,
                          })}
                          aria-label={t("timetable.edit", {
                            title: course.name,
                          })}
                          onClick={() => openForm(course)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="icon-button delete-action"
                          title={t("timetable.delete", {
                            title: course.name,
                          })}
                          aria-label={t("timetable.delete", {
                            title: course.name,
                          })}
                          onClick={() => setDeleting(course)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="day-empty">
                    <CalendarDays size={17} />
                    <span>{t("timetable.noClasses")}</span>
                  </div>
                )}
              </section>
            );
          })}
        </div>
        {!courses.length && (
          <EmptyState
            title={t("timetable.emptyTitle")}
            message={t("timetable.emptyMessage")}
          />
        )}
      </section>
      {editing !== null && (
        <Modal
          title={editing ? t("timetable.editTitle") : t("timetable.addTitle")}
          onClose={closeForm}
        >
          <form className="form-body" onSubmit={save} noValidate>
            <label>
              {t("timetable.courseName")}
              <input
                autoFocus
                maxLength="100"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                placeholder={t("timetable.coursePlaceholder")}
              />
            </label>
            <FormSelect
              id="course-day"
              label={t("timetable.day")}
              value={form.day}
              onChange={(day) => setForm({ ...form, day })}
              options={days.map((day) => ({
                value: day,
                label: t(`weekday.${day}`),
              }))}
            />
            <div className="form-row course-time-fields">
              <TimePicker
                id="course-start-time"
                label={t("timetable.startTime")}
                required
                value={form.startTime}
                onChange={(startTime) => setForm({ ...form, startTime })}
              />
              <TimePicker
                id="course-end-time"
                label={t("timetable.endTime")}
                required
                value={form.endTime}
                onChange={(endTime) => setForm({ ...form, endTime })}
              />
            </div>
            <label>
              {t("timetable.classroom")}
              <input
                maxLength="80"
                value={form.classroom}
                onChange={(event) =>
                  setForm({ ...form, classroom: event.target.value })
                }
                placeholder={t("timetable.classroomPlaceholder")}
              />
            </label>
            <label>
              {t("timetable.teacher")}
              <input
                maxLength="100"
                value={form.teacher}
                onChange={(event) =>
                  setForm({ ...form, teacher: event.target.value })
                }
                placeholder={t("timetable.teacherPlaceholder")}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {t(error)}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={closeForm}
              >
                {t("timetable.cancel")}
              </button>
              <button className="button button-primary">
                {t("timetable.save")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={t("timetable.deleteTitle")}
          message={t("timetable.deleteMessage", { title: deleting.name })}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
