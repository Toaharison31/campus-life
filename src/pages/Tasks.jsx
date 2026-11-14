import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { api } from "../services/api";
import {
  formatLongDate,
  getLocalDateString,
  isValidDateString,
} from "../services/dates";
import { getTaskStats } from "../services/studentData";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import DatePicker from "../components/DatePicker";
import FormSelect from "../components/FormSelect";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import PageHeader from "../components/PageHeader";
import {
  CourseChip,
  PriorityBadge,
  TaskStatusBadge,
} from "../components/StatusBadges";

const blank = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  category: "Academic",
  courseId: "",
  status: "Pending",
};
const categories = ["Academic", "Personal", "Project", "Exam", "Other"];

function FilterSelect({ id, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState("bottom");
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    if (!open) return undefined;
    optionRefs.current[activeIndex]?.focus();
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [activeIndex, open]);

  const openMenu = (index = selectedIndex) => {
    const triggerBounds = triggerRef.current?.getBoundingClientRect();
    if (triggerBounds) {
      const mobile = window.matchMedia("(max-width: 800px)").matches;
      const bottomInset = mobile ? 80 : 16;
      const menuHeight = Math.min(options.length * 40 + 10, window.innerHeight * 0.45);
      const spaceBelow =
        window.innerHeight - triggerBounds.bottom - bottomInset;
      setPlacement(
        spaceBelow < menuHeight && triggerBounds.top > spaceBelow
          ? "top"
          : "bottom",
      );
    }
    setActiveIndex(index);
    setOpen(true);
  };
  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };
  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(selectedIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) closeMenu();
      else openMenu(selectedIndex);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    }
  };
  const handleOptionKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
    else if (event.key === "ArrowUp")
      nextIndex = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      onChange(options[index].value);
      closeMenu(true);
      return;
    } else {
      return;
    }
    event.preventDefault();
    setActiveIndex(nextIndex);
  };
  const selectedOption = options[selectedIndex];

  return (
    <div className="filter-select" ref={rootRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="filter-select-trigger"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={`${id}-options`}
          className="filter-select-options"
          data-placement={placement}
          role="listbox"
          aria-label={label}
        >
          {options.map((option, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className="filter-select-option"
              id={`${id}-option-${index}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                closeMenu(true);
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Tasks() {
  const { t, i18n } = useTranslation();
  const { tasks, setTasks, showToast, courses } = useCampus();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const routeStatus = searchParams.get("status");
  const status = ["Pending", "Completed", "Overdue"].includes(routeStatus)
    ? routeStatus
    : "All";
  const [priority, setPriority] = useState("All");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const today = getLocalDateString();
  const filtered = tasks.filter(
    (task) =>
      (status === "All" ||
        (status === "Overdue"
          ? task.status !== "Completed" && task.dueDate < today
          : (task.status === "Completed" ? "Completed" : "Pending") === status)) &&
      (priority === "All" || task.priority === priority) &&
      (category === "All" || (task.category || "Academic") === category) &&
      `${task.title} ${task.description || ""} ${task.category || ""} ${
        courses.find((course) => course.id === task.courseId)?.name || ""
      }`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const stats = getTaskStats(tasks, today);
  const openForm = (task = null) => {
    setEditing(task || false);
    setForm(task ? { ...task } : blank);
    setError("");
  };
  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !isValidDateString(form.dueDate)) {
      setError("tasks.validation");
      return;
    }
    const saved = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      courseId: form.courseId || null,
    };
    try {
      const storedTask = editing
        ? await api.updateTask(editing.id, saved)
        : await api.createTask(saved);
      const persisted = setTasks((items) =>
        editing
          ? items.map((item) =>
              item.id === editing.id ? { ...item, ...storedTask } : item,
            )
          : [storedTask, ...items],
      );
      setEditing(null);
      showToast(
        t(persisted ? "common.saved" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not save task.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const remove = async () => {
    try {
      await api.deleteTask(deleting.id);
      const persisted = setTasks((items) =>
        items.filter((item) => item.id !== deleting.id),
      );
      setDeleting(null);
      showToast(
        t(persisted ? "common.deleted" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not delete task.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const toggle = async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const updatedTask = {
      ...task,
      status: task.status === "Completed" ? "Pending" : "Completed",
      completedAt:
        task.status === "Completed" ? null : getLocalDateString(),
    };
    try {
      const storedTask = await api.updateTask(id, updatedTask);
      const persisted = setTasks((items) =>
        items.map((item) => (item.id === id ? storedTask : item)),
      );
      if (!persisted) showToast(t("common.storageError"), "error");
    } catch (error) {
      console.error("Could not update task status.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const isEditing = !editing;
  const formatDate = (date) =>
    formatLongDate(date, i18n.resolvedLanguage || "fr");

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("tasks.eyebrow")}
        title={t("tasks.title")}
        subtitle={t("tasks.intro")}
        action={
          <button className="button button-primary" onClick={() => openForm()}>
            <Plus size={17} /> {t("tasks.add")}
          </button>
        }
      />
      <div className="module-summary">
        <div>
          <strong>{stats.total}</strong>
          <span>{t("tasks.total")}</span>
        </div>
        <div>
          <strong>{stats.pending}</strong>
          <span>{t("tasks.pending")}</span>
        </div>
        <div>
          <strong>{stats.completed}</strong>
          <span>{t("tasks.completed")}</span>
        </div>
        <div className="overdue-count">
          <strong>{stats.overdue}</strong>
          <span>{t("tasks.overdue")}</span>
        </div>
      </div>
      <section className="panel listing-panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder={t("tasks.search")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t("tasks.searchLabel")}
            />
          </div>
          <div className="filter-controls">
            <ListFilter size={17} />
            <FilterSelect
              id="tasks-filter-status"
              label={t("tasks.filterStatus")}
              value={status}
              options={[
                { value: "All", label: t("tasks.allStatus") },
                { value: "Pending", label: t("status.Pending") },
                { value: "Completed", label: t("status.Completed") },
                { value: "Overdue", label: t("tasks.overdue") },
              ]}
              onChange={(nextStatus) => {
                if (nextStatus === "All") setSearchParams({});
                else setSearchParams({ status: nextStatus });
              }}
            />
            <FilterSelect
              id="tasks-filter-priority"
              label={t("tasks.filterPriority")}
              value={priority}
              options={[
                { value: "All", label: t("tasks.allPriorities") },
                { value: "High", label: t("priority.High") },
                { value: "Medium", label: t("priority.Medium") },
                { value: "Low", label: t("priority.Low") },
              ]}
              onChange={setPriority}
            />
            <FilterSelect
              id="tasks-filter-category"
              label={t("tasks.filterCategory")}
              value={category}
              options={[
                { value: "All", label: t("tasks.allCategories") },
                ...categories.map((value) => ({
                  value,
                  label: t(`category.${value}`),
                })),
              ]}
              onChange={setCategory}
            />
          </div>
        </div>
        {filtered.length ? (
          <div className="task-table">
            <div className="table-head task-columns">
              <span>{t("tasks.task")}</span>
              <span>{t("tasks.dueDate")}</span>
              <span>{t("tasks.priority")}</span>
              <span>{t("tasks.status")}</span>
              <span>{t("tasks.actions")}</span>
            </div>
            {filtered.map((task) => {
              const taskStatus =
                task.status === "Completed" ? "Completed" : "Pending";
              const taskPriority = ["Low", "Medium", "High"].includes(
                task.priority,
              )
                ? task.priority
                : "Medium";
              const overdue = taskStatus === "Pending" && task.dueDate < today;
              const linkedCourse = courses.find(
                (course) => course.id === task.courseId,
              );
              return (
                <div className="table-row task-columns" key={task.id}>
                  <div className="table-task-cell task-info-cell">
                    <button
                      className={`task-check ${taskStatus === "Completed" ? "checked" : ""}`}
                      onClick={() => toggle(task.id)}
                      aria-label={t(
                        taskStatus === "Completed"
                          ? "tasks.markPending"
                          : "tasks.markCompleted",
                        { title: task.title },
                      )}
                    >
                      {task.status === "Completed" && <Check size={13} />}
                    </button>
                    <div>
                      <strong
                        className={
                          taskStatus === "Completed" ? "text-done" : ""
                        }
                      >
                        {task.title}
                      </strong>
                      {task.description && <span>{task.description}</span>}
                      <div className="task-chip-row">
                        <Badge tone="neutral" className="task-category">
                          {t(`category.${task.category || "Academic"}`)}
                        </Badge>
                        {linkedCourse && <CourseChip course={linkedCourse} />}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`due-cell task-due-cell ${overdue ? "overdue" : ""}`}
                  >
                    <CalendarDays size={15} />
                    <span className="task-mobile-label">
                      {t("tasks.dueDate")}
                    </span>
                    {overdue && (
                      <span className="sr-only">{t("tasks.overdue")}: </span>
                    )}
                    {formatDate(task.dueDate)}
                    {overdue && <small>{t("tasks.overdue")}</small>}
                  </div>
                  <div className="task-priority-cell">
                    <span className="task-mobile-label">
                      {t("tasks.priority")}
                    </span>
                    <PriorityBadge
                      level={taskPriority}
                      label={t(`priority.${taskPriority}`)}
                    />
                  </div>
                  <div className="task-status-cell">
                    <span className="task-mobile-label">
                      {t("tasks.status")}
                    </span>
                    <TaskStatusBadge
                      status={overdue ? "Overdue" : taskStatus}
                      label={t(
                        overdue
                          ? "tasks.overdue"
                          : `status.${taskStatus}`,
                      )}
                    />
                  </div>
                  <div className="row-actions task-row-actions">
                    <button
                      className="icon-button"
                      onClick={() => openForm(task)}
                      aria-label={t("tasks.edit", { title: task.title })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button delete-action"
                      onClick={() => setDeleting(task)}
                      aria-label={t("tasks.delete", { title: task.title })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={tasks.length ? t("tasks.noMatches") : t("tasks.clear")}
            message={
              tasks.length ? t("tasks.adjustFilters") : t("tasks.addToStart")
            }
          />
        )}
      </section>
      {editing !== null && (
        <Modal
          title={isEditing ? t("tasks.addTitle") : t("tasks.editTitle")}
          onClose={() => setEditing(null)}
        >
          <form className="form-body" onSubmit={save} noValidate>
            <label>
              {t("tasks.titleLabel")}
              <input
                autoFocus
                maxLength="100"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder={t("tasks.titlePlaceholder")}
              />
            </label>
            <label>
              {t("tasks.description")}{" "}
              <span className="optional">{t("tasks.optional")}</span>
              <textarea
                rows="3"
                maxLength="500"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder={t("tasks.descriptionPlaceholder")}
              />
            </label>
            <div className="form-row">
              <FormSelect
                id="task-course"
                label={t("tasks.course")}
                value={form.courseId || ""}
                onChange={(courseId) => setForm({ ...form, courseId })}
                options={[
                  { value: "", label: t("tasks.noCourse") },
                  ...courses.map((course) => ({
                    value: course.id,
                    label: course.name,
                  })),
                ]}
              />
              <DatePicker
                id="task-due-date"
                label={t("tasks.dueDate")}
                value={form.dueDate}
                onChange={(dueDate) => setForm({ ...form, dueDate })}
                language={i18n.resolvedLanguage || "fr"}
                required
              />
              <FormSelect
                id="task-category"
                label={t("tasks.category")}
                value={form.category || "Academic"}
                onChange={(category) => setForm({ ...form, category })}
                options={categories.map((value) => ({
                  value,
                  label: t(`category.${value}`),
                }))}
              />
              <FormSelect
                id="task-priority"
                label={t("tasks.priorityLabel")}
                value={form.priority}
                onChange={(priority) => setForm({ ...form, priority })}
                options={["Low", "Medium", "High"].map((value) => ({
                  value,
                  label: t(`priority.${value}`),
                }))}
              />
            </div>
            {error && (
              <p className="form-error" role="alert">
                {t(error)}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setEditing(null)}
              >
                {t("tasks.cancel")}
              </button>
              <button className="button button-primary">
                <Check size={16} /> {t("tasks.save")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={t("tasks.deleteTitle")}
          message={t("tasks.deleteMessage", { title: deleting.title })}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
