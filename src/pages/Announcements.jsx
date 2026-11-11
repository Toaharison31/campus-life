import { useMemo, useState } from "react";
import {
  CheckCheck,
  Eye,
  LayoutGrid,
  List,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { createId } from "../services/storage";
import {
  formatLongDate,
  getDateDifferenceInDays,
  getLocalDateString,
} from "../services/dates";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import FormSelect from "../components/FormSelect";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import { PriorityBadge, UnreadBadge } from "../components/StatusBadges";

const categories = [
  "Academic",
  "Campus",
  "Events",
  "Administrative",
  "Urgent",
  "General",
];
const blank = {
  title: "",
  content: "",
  category: "Academic",
  priority: "Medium",
  author: "",
};
export default function Announcements() {
  const { t, i18n } = useTranslation();
  const { announcements, setAnnouncements, profile, showToast } = useCampus();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("grid");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const today = getLocalDateString();
  const filtered = useMemo(
    () =>
      [...announcements]
        .filter(
          (item) =>
            (category === "All" || item.category === category) &&
            `${item.title} ${item.content} ${item.author}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sortBy === "oldest"
            ? (a.publishedAt || "").localeCompare(b.publishedAt || "")
            : (b.publishedAt || "").localeCompare(a.publishedAt || ""),
        ),
    [announcements, category, query, sortBy],
  );
  const openForm = (item = null) => {
    setEditing(item || false);
    setForm(
      item
        ? { ...item }
        : {
            ...blank,
            author: profile.name.trim() || t("profile.studentName"),
          },
    );
    setError("");
  };
  const closeForm = () => setEditing(null);
  const save = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) {
      setError("announcements.validation");
      return;
    }
    const saved = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      author: form.author.trim(),
    };
    const persisted = setAnnouncements((items) =>
      editing
        ? items.map((item) =>
            item.id === editing.id ? { ...item, ...saved } : item,
          )
        : [
            { ...saved, id: createId("announcement"), publishedAt: today },
            ...items,
          ],
    );
    closeForm();
    showToast(
      t(persisted ? "common.saved" : "common.storageError"),
      persisted ? "success" : "error",
    );
  };
  const remove = () => {
    const persisted = setAnnouncements((items) =>
      items.filter((item) => item.id !== deleting.id),
    );
    setDeleting(null);
    showToast(
      t(persisted ? "common.deleted" : "common.storageError"),
      persisted ? "success" : "error",
    );
  };
  const markRead = (item, isRead = true) => {
    const persisted = setAnnouncements((items) =>
      items.map((record) =>
        record.id === item.id ? { ...record, isRead } : record,
      ),
    );
    if (!persisted) showToast(t("common.storageError"), "error");
  };

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("announcements.eyebrow")}
        title={t("announcements.title")}
        subtitle={t("announcements.intro")}
        action={
          <button className="button button-primary" onClick={() => openForm()}>
            <Plus size={17} /> {t("announcements.publish")}
          </button>
        }
      />
      <section className="panel announcement-tools">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder={t("announcements.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t("announcements.searchLabel")}
          />
        </div>
        <FormSelect
          id="announcement-filter-category"
          className="toolbar-form-select"
          label={t("announcements.filterCategory")}
          value={category}
          onChange={setCategory}
          options={[
            { value: "All", label: t("announcements.allCategories") },
            ...categories.map((value) => ({
              value,
              label: t(`category.${value}`),
            })),
          ]}
        />
        <FormSelect
          id="announcement-sort"
          className="toolbar-form-select"
          label={t("announcements.sortBy")}
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "newest", label: t("announcements.sortNewest") },
            { value: "oldest", label: t("announcements.sortOldest") },
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
          {t("announcements.unreadCount", {
            count: announcements.filter((item) => !item.isRead).length,
          })}
        </span>
      </section>
      <div
        className={`announcement-cards ${view === "list" ? "cards-list" : ""}`}
      >
        {filtered.map((item) => {
          const ageInDays = getDateDifferenceInDays(today, item.publishedAt);
          const recent = ageInDays !== null && ageInDays >= 0 && ageInDays < 7;
          return (
            <article className="panel announcement-card" key={item.id}>
              <div className="announcement-card-top">
                <span
                  className={`category-badge category-${String(item.category || "General").toLowerCase()}`}
                >
                  {t(`category.${item.category}`)}
                </span>
                {recent && (
                  <span className="new-badge">
                    <i /> {t("announcements.recent")}
                  </span>
                )}
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={t(
                      item.isRead
                        ? "announcements.markUnread"
                        : "announcements.markRead",
                      { title: item.title },
                    )}
                    onClick={() => markRead(item, !item.isRead)}
                  >
                    {item.isRead ? <Eye size={16} /> : <CheckCheck size={16} />}
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("announcements.readDetails", {
                      title: item.title,
                    })}
                    onClick={() => {
                      markRead(item);
                      setViewing({ ...item, isRead: true });
                    }}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={t("announcements.edit", { title: item.title })}
                    onClick={() => openForm(item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button delete-action"
                    aria-label={t("announcements.delete", {
                      title: item.title,
                    })}
                    onClick={() => setDeleting(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h2 className={!item.isRead ? "announcement-unread" : ""}>
                {item.title}
              </h2>
              <div className="announcement-badges">
                {!item.isRead && (
                  <UnreadBadge>{t("announcements.unread")}</UnreadBadge>
                )}
                <PriorityBadge
                  level={item.priority || "Medium"}
                  label={t(`priority.${item.priority || "Medium"}`)}
                />
              </div>
              <p className="announcement-content">{item.content}</p>
              <div className="announcement-card-footer">
                <div className="author-avatar">
                  <Megaphone size={14} />
                </div>
                <strong>{item.author}</strong>
                <span>·</span>
                <time>
                  {formatLongDate(
                    item.publishedAt,
                    i18n.resolvedLanguage || "fr",
                  )}
                </time>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <section className="panel">
          <EmptyState
            title={
              announcements.length
                ? t("announcements.noMatches")
                : t("announcements.emptyTitle")
            }
            message={
              announcements.length
                ? t("announcements.tryAnother")
                : t("announcements.emptyMessage")
            }
          />
        </section>
      )}
      {editing !== null && (
        <Modal
          title={
            editing
              ? t("announcements.editTitle")
              : t("announcements.publishTitle")
          }
          onClose={closeForm}
          wide
        >
          <form className="form-body" onSubmit={save} noValidate>
            <label>
              {t("announcements.titleLabel")}
              <input
                autoFocus
                maxLength="140"
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder={t("announcements.titlePlaceholder")}
              />
            </label>
            <div className="form-row">
              <FormSelect
                id="announcement-category"
                label={t("announcements.category")}
                value={form.category}
                onChange={(category) => setForm({ ...form, category })}
                options={categories.map((value) => ({
                  value,
                  label: t(`category.${value}`),
                }))}
              />
              <FormSelect
                id="announcement-priority"
                label={t("announcements.priority")}
                value={form.priority || "Medium"}
                onChange={(priority) => setForm({ ...form, priority })}
                options={["Low", "Medium", "High"].map((value) => ({
                  value,
                  label: t(`priority.${value}`),
                }))}
              />
              <label>
                {t("announcements.author")}
                <input
                  maxLength="80"
                  value={form.author}
                  onChange={(event) =>
                    setForm({ ...form, author: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              {t("announcements.content")}
              <textarea
                rows="5"
                maxLength="2000"
                value={form.content}
                onChange={(event) =>
                  setForm({ ...form, content: event.target.value })
                }
                placeholder={t("announcements.contentPlaceholder")}
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
                {t("announcements.cancel")}
              </button>
              <button className="button button-primary">
                <Megaphone size={16} /> {t("announcements.publishButton")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={t("announcements.deleteTitle")}
          message={t("announcements.deleteMessage", { title: deleting.title })}
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}
      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} wide>
          <div className="announcement-detail">
            <div className="announcement-badges">
              <span
                className={`category-badge category-${String(viewing.category || "General").toLowerCase()}`}
              >
                {t(`category.${viewing.category || "General"}`)}
              </span>
              <PriorityBadge
                level={viewing.priority || "Medium"}
                label={t(`priority.${viewing.priority || "Medium"}`)}
              />
            </div>
            <p>{viewing.content}</p>
            <span>
              {viewing.author} ·{" "}
              {formatLongDate(
                viewing.publishedAt,
                i18n.resolvedLanguage || "fr",
              )}
            </span>
          </div>
        </Modal>
      )}
    </div>
  );
}
