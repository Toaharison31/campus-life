import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Heart,
  LayoutGrid,
  Link as LinkIcon,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { useAuth } from "../context/useAuth";
import { api } from "../services/api";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormSelect from "../components/FormSelect";
import EmptyState from "../components/EmptyState";
import { getCourseColorClass } from "../services/courseColors";
import { CourseChip } from "../components/StatusBadges";

const categories = [
  "Programming",
  "Mathematics",
  "Networking",
  "Database",
  "Documentation",
  "Other",
];
const types = ["Article", "Course", "Documentation", "Video", "Book", "Other"];
const blank = {
  title: "",
  description: "",
  category: "Programming",
  type: "Article",
  url: "",
  courseId: "",
  isPublic: false,
};
const typeIcon = (type) =>
  type === "Video"
    ? Video
    : type === "Documentation"
      ? FileText
      : type === "Course"
        ? BookOpen
        : LinkIcon;

function isSafeHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export default function Resources() {
  const { t } = useTranslation();
  const { resources, setResources, showToast, courses } = useCampus();
  const { user } = useAuth();
  const canPublishOfficial = ["ADMIN", "DELEGATE"].includes(user?.role);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [view, setView] = useState("grid");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const filtered = useMemo(
    () =>
      resources
        .filter(
          (item) =>
            (category === "All" || item.category === category) &&
            (!favoritesOnly || item.favorite) &&
            `${item.title} ${item.description} ${item.category} ${item.type} ${
              courses.find((course) => course.id === item.courseId)?.name || ""
            }`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sortBy === "title"
            ? a.title.localeCompare(b.title)
            : (b.createdAt || "").localeCompare(a.createdAt || ""),
        ),
    [resources, category, favoritesOnly, query, sortBy, courses],
  );
  const openForm = (item = null) => {
    setEditing(item || false);
    setForm(
      item
        ? {
            title: item.title,
            description: item.description || "",
            category: item.category || "Other",
            type: item.type || item.resourceType || "Article",
            url: item.url,
            courseId: item.courseId || "",
            isPublic: Boolean(item.isPublic),
          }
        : blank,
    );
    setError("");
  };
  const closeForm = () => setEditing(null);
  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.url.trim()) {
      setError("resources.required");
      return;
    }
    if (!isSafeHttpUrl(form.url.trim())) {
      setError("resources.invalidUrl");
      return;
    }
    const saved = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      courseId: form.courseId || null,
    };
    try {
      const storedResource = editing
        ? await api.updateResource(editing.id, saved)
        : await api.createResource(saved);
      const persisted = setResources((items) =>
        editing
          ? items.map((item) =>
              item.id === editing.id ? { ...item, ...storedResource } : item,
            )
          : [storedResource, ...items],
      );
      closeForm();
      showToast(
        t(persisted ? "common.saved" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not save resource.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const remove = async () => {
    try {
      await api.deleteResource(deleting.id);
      const persisted = setResources((items) =>
        items.filter((item) => item.id !== deleting.id),
      );
      setDeleting(null);
      showToast(
        t(persisted ? "common.deleted" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not delete resource.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const toggleFavorite = async (resource) => {
    const favorite = !resource.favorite;
    try {
      const updatedResource = await api.updateResource(resource.id, {
        favorite,
      });
      const persisted = setResources((items) =>
        items.map((item) =>
          item.id === resource.id ? updatedResource : item,
        ),
      );
      if (!persisted) showToast(t("common.storageError"), "error");
    } catch (error) {
      console.error("Could not update resource favorite status.", error);
      showToast(t("common.storageError"), "error");
    }
  };

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("resources.eyebrow")}
        title={t("resources.title")}
        subtitle={t("resources.intro")}
        action={
          <button className="button button-primary" onClick={() => openForm()}>
            <Plus size={17} /> {t("resources.add")}
          </button>
        }
      />
      <section className="panel library-banner">
        <div className="library-icon">
          <BookOpen size={22} />
        </div>
        <div>
          <strong>{t("resources.bannerTitle")}</strong>
          <p>{t("resources.bannerMessage")}</p>
        </div>
        <span className="library-count">
          <strong>{resources.length}</strong> {t("resources.saved")}
        </span>
      </section>
      <section className="panel resource-tools">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder={t("resources.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("resources.searchLabel")}
          />
        </div>
        <FormSelect
          id="resource-filter-category"
          className="toolbar-form-select"
          label={t("resources.filterCategory")}
          value={category}
          onChange={setCategory}
          options={[
            { value: "All", label: t("resources.allCategories") },
            ...categories.map((value) => ({
              value,
              label: t(`category.${value}`),
            })),
          ]}
        />
        <button
          className={`favorite-filter ${favoritesOnly ? "selected" : ""}`}
          type="button"
          aria-pressed={favoritesOnly}
          onClick={() => setFavoritesOnly((value) => !value)}
        >
          <Heart size={15} fill={favoritesOnly ? "currentColor" : "none"} />
          {t("resources.favorites")}
        </button>
        <FormSelect
          id="resource-sort"
          className="toolbar-form-select"
          label={t("resources.sortBy")}
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "recent", label: t("resources.sortRecent") },
            { value: "title", label: t("resources.sortTitle") },
          ]}
        />
        <div
          className="view-toggle"
          role="group"
          aria-label={t("common.viewMode")}
        >
          <button
            type="button"
            aria-label={t("common.gridView")}
            aria-pressed={view === "grid"}
            className={view === "grid" ? "selected" : ""}
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={t("common.listView")}
            aria-pressed={view === "list"}
            className={view === "list" ? "selected" : ""}
            onClick={() => setView("list")}
          >
            <List size={16} aria-hidden="true" />
          </button>
        </div>
        <span className="results-note">
          {t("resources.resources", { count: filtered.length })}
        </span>
      </section>
      {filtered.length ? (
        <div className={`resource-grid ${view === "list" ? "cards-list" : ""}`}>
          {filtered.map((item) => {
            const Icon = typeIcon(item.type);
            const canManage =
              item.isOwner || (user?.role === "ADMIN" && item.isShared);
            const linkedCourse = courses.find(
              (course) => course.id === item.courseId,
            );
            return (
              <article
                className={`panel resource-card ${linkedCourse ? getCourseColorClass(linkedCourse) : ""}`}
                key={item.id}
              >
                <div className="resource-card-top">
                  <span className="resource-type-icon">
                    <Icon size={19} />
                  </span>
                  <div className="row-actions">
                    <button
                      className={`icon-button favorite-button ${item.favorite ? "is-favorite" : ""}`}
                      aria-pressed={Boolean(item.favorite)}
                      aria-label={t(
                        item.favorite
                          ? "resources.removeFavorite"
                          : "resources.addFavorite",
                        { title: item.title },
                      )}
                      onClick={() => toggleFavorite(item)}
                    >
                      <Heart
                        size={15}
                        fill={item.favorite ? "currentColor" : "none"}
                      />
                    </button>
                    {canManage && (
                      <>
                        <button
                          className="icon-button"
                          aria-label={t("resources.edit", { title: item.title })}
                          onClick={() => openForm(item)}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="icon-button delete-action"
                          aria-label={t("resources.delete", { title: item.title })}
                          onClick={() => setDeleting(item)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {item.isShared && (
                  <span className="shared-content-badge">
                    {t("resources.official")}
                  </span>
                )}
                <span className="category-badge category-general">
                  {t(`category.${item.category}`)}
                </span>
                {linkedCourse && <CourseChip course={linkedCourse} />}
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="resource-card-footer">
                  <span>{t(`resourceType.${item.type}`)}</span>
                  {isSafeHttpUrl(item.url) ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("resources.openLabel", {
                        title: item.title,
                      })}
                    >
                      {t("resources.open")} <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="invalid-resource-url">
                      {t("resources.invalidUrl")}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title={
              resources.length
                ? t("resources.noMatches")
                : t("resources.emptyTitle")
            }
            message={
              resources.length
                ? t("resources.tryAnother")
                : t("resources.emptyMessage")
            }
          />
        </section>
      )}
      {editing !== null && (
        <Modal
          title={editing ? t("resources.editTitle") : t("resources.addTitle")}
          onClose={closeForm}
        >
          <form className="form-body" onSubmit={save} noValidate>
            <label>
              {t("resources.titleLabel")}
              <input
                autoFocus
                maxLength="120"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder={t("resources.titlePlaceholder")}
              />
            </label>
            <label>
              {t("resources.description")}
              <textarea
                rows="3"
                maxLength="500"
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder={t("resources.descriptionPlaceholder")}
              />
            </label>
            <label>
              {t("resources.url")}
              <input
                type="url"
                maxLength="2048"
                value={form.url}
                onChange={(event) =>
                  setForm({ ...form, url: event.target.value })
                }
                placeholder={t("resources.urlPlaceholder")}
              />
            </label>
            <div className="form-row">
              <FormSelect
                id="resource-course"
                label={t("resources.course")}
                value={form.courseId || ""}
                onChange={(courseId) => setForm({ ...form, courseId })}
                options={[
                  { value: "", label: t("resources.noCourse") },
                  ...courses.map((course) => ({
                    value: course.id,
                    label: course.name,
                  })),
                ]}
              />
              <FormSelect
                id="resource-category"
                label={t("resources.category")}
                value={form.category}
                onChange={(category) => setForm({ ...form, category })}
                options={categories.map((value) => ({
                  value,
                  label: t(`category.${value}`),
                }))}
              />
              <FormSelect
                id="resource-type"
                label={t("resources.type")}
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
                options={types.map((value) => ({
                  value,
                  label: t(`resourceType.${value}`),
                }))}
              />
            </div>
            {canPublishOfficial && (
              <label className="shared-content-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(form.isPublic)}
                  onChange={(event) =>
                    setForm({ ...form, isPublic: event.target.checked })
                  }
                />
                <span>{t("resources.publishOfficial")}</span>
              </label>
            )}
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
                {t("resources.cancel")}
              </button>
              <button className="button button-primary">
                {t("resources.save")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={t("resources.deleteTitle")}
          message={t("resources.deleteMessage", { title: deleting.title })}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
