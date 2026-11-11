import { useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  Video,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { createId } from "../services/storage";
import { getLocalDateString } from "../services/dates";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";

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
  const { resources, setResources } = useCampus();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const today = getLocalDateString();
  const filtered = useMemo(
    () =>
      resources.filter(
        (item) =>
          (category === "All" || item.category === category) &&
          `${item.title} ${item.description} ${item.category} ${item.type}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [resources, category, query],
  );
  const openForm = (item = null) => {
    setEditing(item || false);
    setForm(item ? { ...item } : blank);
    setError("");
  };
  const closeForm = () => setEditing(null);
  const save = (event) => {
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
    };
    setResources((items) =>
      editing
        ? items.map((item) =>
            item.id === editing.id ? { ...item, ...saved } : item,
          )
        : [{ ...saved, id: createId("resource"), createdAt: today }, ...items],
    );
    closeForm();
  };
  const remove = () => {
    setResources((items) => items.filter((item) => item.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="module-page">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">{t("resources.eyebrow")}</div>
          <h1>{t("resources.title")}</h1>
          <p>{t("resources.intro")}</p>
        </div>
        <button className="button button-primary" onClick={() => openForm()}>
          <Plus size={17} /> {t("resources.add")}
        </button>
      </div>
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
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label={t("resources.filterCategory")}
        >
          <option value="All">{t("resources.allCategories")}</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {t(`category.${value}`)}
            </option>
          ))}
        </select>
        <span className="results-note">
          {t("resources.resources", { count: filtered.length })}
        </span>
      </section>
      {filtered.length ? (
        <div className="resource-grid">
          {filtered.map((item) => {
            const Icon = typeIcon(item.type);
            return (
              <article className="panel resource-card" key={item.id}>
                <div className="resource-card-top">
                  <span className="resource-type-icon">
                    <Icon size={19} />
                  </span>
                  <div className="row-actions">
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
                  </div>
                </div>
                <span className="category-badge category-general">
                  {t(`category.${item.category}`)}
                </span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <div className="resource-card-footer">
                  <span>{t(`resourceType.${item.type}`)}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("resources.openLabel", { title: item.title })}
                  >
                    {t("resources.open")} <ExternalLink size={14} />
                  </a>
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
              <label>
                {t("resources.category")}
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                >
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {t(`category.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("resources.type")}
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                >
                  {types.map((value) => (
                    <option key={value} value={value}>
                      {t(`resourceType.${value}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {error && <p className="form-error">{t(error)}</p>}
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
