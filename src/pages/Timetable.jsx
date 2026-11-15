// Affiche et gère les cours ainsi que les examens de l'étudiant.
import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { api } from "../services/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import ColorField from "../components/ColorField";
import DatePicker from "../components/DatePicker";
import FormSelect from "../components/FormSelect";
import TimePicker from "../components/TimePicker";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { getCourseColorClass } from "../services/courseColors";
import { getLocalDateString } from "../services/dates";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const getColorToken = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;
const defaultCourseColor = getColorToken("--course-5-border", "#1d4ed8");
const defaultExamColor = getColorToken("--course-2-border", "#c2410c");
const blank = {
  name: "",
  day: "Monday",
  startTime: "",
  endTime: "",
  classroom: "",
  teacher: "",
  color: defaultCourseColor,
};
const blankExam = {
  title: "",
  courseId: "",
  examDate: "",
  startTime: "",
  endTime: "",
  location: "",
  color: defaultExamColor,
};
const validTime = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export default function Timetable() {
  const { t, i18n } = useTranslation();
  const { courses, setCourses, exams, setExams, showToast, now } = useCampus();
  const [editing, setEditing] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingExam, setDeletingExam] = useState(null);
  const [form, setForm] = useState(blank);
  const [examForm, setExamForm] = useState(blankExam);
  const [error, setError] = useState("");
  const [examError, setExamError] = useState("");
  const [view, setView] = useState("week");
  const currentDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(now);
  const [selectedDay, setSelectedDay] = useState(
    days.includes(currentDay) ? currentDay : "Monday",
  );
  const openForm = (course = null) => {
    setEditingExam(null);
    setEditing(course || false);
    setForm(
      course
        ? {
            name: course.name ?? course.courseName ?? "",
            day: course.day ?? "Monday",
            startTime: course.startTime ?? "",
            endTime: course.endTime ?? "",
            classroom: course.classroom ?? "",
            teacher: course.teacher ?? course.teacherName ?? "",
            color: course.color || defaultCourseColor,
          }
        : blank,
    );
    setError("");
  };
  const closeForm = () => setEditing(null);
  const openExamForm = (exam = null) => {
    setEditing(null);
    setDeletingExam(null);
    setEditingExam(exam || false);
    setExamForm(
      exam
        ? { ...exam, courseId: exam.courseId || "" }
        : { ...blankExam, examDate: getLocalDateString(now) },
    );
    setExamError("");
  };
  const closeExamForm = () => setEditingExam(null);
  const save = async (event) => {
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
      color: form.color,
    };
    try {
      const storedCourse = editing
        ? await api.updateCourse(editing.id, saved)
        : await api.createCourse(saved);
      const persisted = setCourses((items) =>
        editing
          ? items.map((item) =>
              item.id === editing.id ? { ...item, ...storedCourse } : item,
            )
          : [...items, storedCourse],
      );
      closeForm();
      showToast(
        t(persisted ? "common.saved" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not save course.", error);
      if (error.statusCode === 409) {
        setError("timetable.overlap");
      } else {
        showToast(t("common.storageError"), "error");
      }
    }
  };
  const saveExam = async (event) => {
    event.preventDefault();
    if (
      !examForm.title.trim() ||
      !examForm.examDate ||
      !validTime(examForm.startTime) ||
      !validTime(examForm.endTime)
    ) {
      setExamError("timetable.examRequired");
      return;
    }
    if (examForm.startTime >= examForm.endTime) {
      setExamError("timetable.timeOrder");
      return;
    }
    const examDay = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "UTC",
    }).format(new Date(`${examForm.examDate}T12:00:00.000Z`));
    const overlaps = (start, end, otherStart, otherEnd) =>
      start < otherEnd && end > otherStart;
    const courseConflict =
      examForm.examDate >= getLocalDateString(now) &&
      courses.some(
        (course) =>
          course.day === examDay &&
          overlaps(
            examForm.startTime,
            examForm.endTime,
            course.startTime,
            course.endTime,
          ),
      );
    const examConflict = exams.some(
      (exam) =>
        exam.id !== (editingExam || {}).id &&
        exam.examDate === examForm.examDate &&
        overlaps(
          examForm.startTime,
          examForm.endTime,
          exam.startTime,
          exam.endTime,
        ),
    );
    if (courseConflict || examConflict) {
      setExamError("timetable.overlap");
      return;
    }
    const saved = {
      ...examForm,
      title: examForm.title.trim(),
      courseName:
        courses.find((course) => course.id === examForm.courseId)?.name || null,
      courseId: examForm.courseId || null,
      location: examForm.location.trim() || null,
    };
    try {
      const stored = editingExam
        ? await api.updateExam(editingExam.id, saved)
        : await api.createExam(saved);
      setExams((items) =>
        editingExam
          ? items.map((item) => (item.id === editingExam.id ? stored : item))
          : [...items, stored],
      );
      closeExamForm();
      showToast(t("common.saved"), "success");
    } catch (requestError) {
      console.error("Could not save exam.", requestError);
      setExamError(
        requestError.statusCode === 409
          ? "timetable.overlap"
          : "common.storageError",
      );
    }
  };
  const remove = async () => {
    try {
      await api.deleteCourse(deleting.id);
      const persisted = setCourses((items) =>
        items.filter((item) => item.id !== deleting.id),
      );
      setDeleting(null);
      showToast(
        t(persisted ? "common.deleted" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not delete course.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const removeExam = async () => {
    try {
      await api.deleteExam(deletingExam.id);
      setExams((items) => items.filter((item) => item.id !== deletingExam.id));
      setDeletingExam(null);
      showToast(t("common.deleted"), "success");
    } catch (requestError) {
      console.error("Could not delete exam.", requestError);
      showToast(t("common.storageError"), "error");
    }
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
          <div className="timetable-header-actions">
            <button
              className="button button-secondary"
              onClick={() => openExamForm()}
            >
              <CalendarDays size={17} /> {t("timetable.addExam")}
            </button>
          <button className="button button-primary" onClick={() => openForm()}>
            <Plus size={17} /> {t("timetable.add")}
          </button>
          </div>
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
        <div
          className="week-grid-scroll"
          role="region"
          aria-label={t("timetable.weeklySchedule")}
          tabIndex={view === "week" ? 0 : undefined}
        >
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
                        style={
                          course.color
                            ? { "--course-accent-color": course.color }
                            : undefined
                        }
                        key={course.id}
                      >
                        <div className="course-time">
                          <Clock3 size={13} />
                          {course.startTime}
                          <span>– {course.endTime}</span>
                        </div>
                        <strong title={course.name}>{course.name}</strong>
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
        </div>
        {!courses.length && (
          <EmptyState
            title={t("timetable.emptyTitle")}
            message={t("timetable.emptyMessage")}
          />
        )}
      </section>
      <section className="panel exam-panel">
        <div className="panel-heading">
          <div>
            <h2>{t("timetable.examsTitle")}</h2>
            <p>{t("timetable.examsIntro")}</p>
          </div>
          <span className="section-icon">
            <CalendarDays size={19} aria-hidden="true" />
          </span>
        </div>
        {exams.length ? (
          <div className="exam-list">
            {[...exams]
              .sort(
                (a, b) =>
                  a.examDate.localeCompare(b.examDate) ||
                  a.startTime.localeCompare(b.startTime),
              )
              .map((exam) => (
                <article className="exam-row" key={exam.id}>
                  <span
                    className="exam-color"
                    style={{ backgroundColor: exam.color || defaultExamColor }}
                  />
                  <div className="exam-copy">
                    <strong>{exam.title}</strong>
                    <span>
                      {exam.courseName || t("timetable.exam")} · {exam.examDate}
                    </span>
                    <small>
                      {exam.startTime}–{exam.endTime}
                      {exam.location ? ` · ${exam.location}` : ""}
                    </small>
                  </div>
                  <div className="course-actions">
                    <button
                      className="icon-button"
                      aria-label={t("timetable.editExam", { title: exam.title })}
                      onClick={() => openExamForm(exam)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-button delete-action"
                      aria-label={t("timetable.deleteExam", { title: exam.title })}
                      onClick={() => setDeletingExam(exam)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <p className="exam-empty">{t("timetable.noExams")}</p>
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
            <ColorField
              label={t("timetable.color")}
              value={form.color}
              onChange={(color) => setForm({ ...form, color })}
            />
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
      {editingExam !== null && (
        <Modal
          title={editingExam ? t("timetable.editExamTitle") : t("timetable.addExamTitle")}
          onClose={closeExamForm}
        >
          <form className="form-body" onSubmit={saveExam} noValidate>
            <label>
              {t("timetable.examName")}
              <input
                autoFocus
                maxLength="120"
                value={examForm.title}
                onChange={(event) =>
                  setExamForm({ ...examForm, title: event.target.value })
                }
              />
            </label>
            <FormSelect
              id="exam-course"
              label={t("timetable.examCourse")}
              value={examForm.courseId}
              onChange={(courseId) => setExamForm({ ...examForm, courseId })}
              options={[
                { value: "", label: t("timetable.examNoCourse") },
                ...courses.map((course) => ({
                  value: course.id,
                  label: course.name,
                })),
              ]}
            />
            <DatePicker
              id="exam-date"
              label={t("timetable.examDate")}
              value={examForm.examDate}
              onChange={(examDate) => setExamForm({ ...examForm, examDate })}
              language={i18n.resolvedLanguage || "fr"}
              required
            />
            <div className="form-row course-time-fields">
              <TimePicker
                id="exam-start-time"
                label={t("timetable.startTime")}
                required
                value={examForm.startTime}
                onChange={(startTime) => setExamForm({ ...examForm, startTime })}
              />
              <TimePicker
                id="exam-end-time"
                label={t("timetable.endTime")}
                required
                value={examForm.endTime}
                onChange={(endTime) => setExamForm({ ...examForm, endTime })}
              />
            </div>
            <label>
              {t("timetable.examLocation")}
              <input
                maxLength="100"
                value={examForm.location}
                onChange={(event) =>
                  setExamForm({ ...examForm, location: event.target.value })
                }
              />
            </label>
            <ColorField
              label={t("timetable.examColor")}
              value={examForm.color}
              onChange={(color) => setExamForm({ ...examForm, color })}
            />
            {examError && (
              <p className="form-error" role="alert">
                {t(examError)}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={closeExamForm}
              >
                {t("timetable.cancel")}
              </button>
              <button className="button button-primary">
                {t("timetable.saveExam")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deletingExam && (
        <ConfirmDialog
          title={t("timetable.deleteExamTitle")}
          message={t("timetable.deleteExamMessage", { title: deletingExam.title })}
          onCancel={() => setDeletingExam(null)}
          onConfirm={removeExam}
        />
      )}
    </div>
  );
}
