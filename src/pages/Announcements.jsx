// Gère les annonces, leur publication et les échanges associés.
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Eye,
  EyeOff,
  Heart,
  LayoutGrid,
  List,
  Megaphone,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { useAuth } from "../context/useAuth";
import { api } from "../services/api";
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
const EmojiPickerUI = lazy(() => import("emoji-picker-react"));
const emojiDataLoaders = {
  en: () => import("emoji-picker-react/data/emojis-en"),
  fr: () => import("emoji-picker-react/data/emojis-fr"),
};
const announcementTypes = ["TEXT", "IMAGE", "VIDEO", "IMPORTANT"];
const announcementPriorities = ["LOW", "NORMAL", "URGENT"];
const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
]);
const normalizeAnnouncementPriority = (value) => {
  const priority = String(value || "NORMAL").toUpperCase();
  return {
    LOW: "LOW",
    MEDIUM: "NORMAL",
    NORMAL: "NORMAL",
    HIGH: "URGENT",
    URGENT: "URGENT",
  }[priority] || "NORMAL";
};
const youtubeEmbedUrl = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!["http:", "https:"].includes(url.protocol) || !youtubeHosts.has(host)) {
    return null;
  }
  const id =
    host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];
  return /^[\w-]{11}$/.test(id || "")
    ? `https://www.youtube-nocookie.com/embed/${id}`
    : null;
};
const isDirectVideoUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      /\.(?:mp4|webm|ogg)$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
};
function AnnouncementMedia({ item }) {
  if (!item.mediaUrl) return null;
  if (item.type === "IMAGE") {
    return (
      <img
        className="announcement-media-image"
        src={item.mediaUrl}
        alt={item.title}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }
  if (item.type !== "VIDEO") return null;

  const embedUrl = youtubeEmbedUrl(item.mediaUrl);
  if (!embedUrl && !isDirectVideoUrl(item.mediaUrl)) return null;
  return (
    <div className="announcement-media-video">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={item.title}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          aria-label={item.title}
          controls
          playsInline
          preload="metadata"
          src={item.mediaUrl}
        >
          {item.title}
        </video>
      )}
    </div>
  );
}
function CommentAvatar({ name, src }) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="announcement-comment-avatar" aria-hidden="true">
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}
function EmojiPicker({ label, onSelect, className = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage?.startsWith("fr") ? "fr" : "en";
  const pickerLabels = {
    searchPlaceholder: t("announcements.emojiSearchPlaceholder"),
    searchLabel: t("announcements.emojiSearchLabel"),
    searchClear: t("announcements.emojiSearchClear"),
    searchResultsNone: t("announcements.emojiSearchResultsNone"),
    searchResultsOne: t("announcements.emojiSearchResultsOne"),
    searchResultsMany: t("announcements.emojiSearchResultsMany"),
    categoryNavigation: t("announcements.emojiCategoryNavigation"),
    reactions: t("announcements.emojiReactions"),
    expandReactions: t("announcements.emojiExpandReactions"),
    loading: t("announcements.emojiLoading"),
    loadingError: t("announcements.emojiLoadingError"),
    retryLoading: t("announcements.emojiRetryLoading"),
    skinToneNeutral: t("announcements.emojiSkinToneNeutral"),
    skinToneLight: t("announcements.emojiSkinToneLight"),
    skinToneMediumLight: t("announcements.emojiSkinToneMediumLight"),
    skinToneMedium: t("announcements.emojiSkinToneMedium"),
    skinToneMediumDark: t("announcements.emojiSkinToneMediumDark"),
    skinToneDark: t("announcements.emojiSkinToneDark"),
  };

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div
      className={`emoji-picker ${className}`.trim()}
      ref={rootRef}
    >
      <button
        type="button"
        className="emoji-picker-trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        😊
      </button>
      {open && (
        <div className="emoji-picker-menu">
          <Suspense
            fallback={
              <div className="emoji-picker-loading" role="status">
                {t("announcements.emojiLoading")}
              </div>
            }
          >
            <EmojiPickerUI
              width="100%"
              height={360}
              lazyLoadEmojis
              emojiData={emojiDataLoaders[language]}
              labels={pickerLabels}
              previewConfig={{ showPreview: false }}
              onEmojiClick={({ emoji }) => {
                onSelect(emoji);
                setOpen(false);
              }}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
const saveSelection = (event, selectionRef) => {
  const field = event.currentTarget;
  selectionRef.current = {
    start: field.selectionStart,
    end: field.selectionEnd,
  };
};
const insertEmojiAtCursor = (
  fieldRef,
  selectionRef,
  value,
  emoji,
  setValue,
  maxHeight = 120,
) => {
  const start = Math.min(selectionRef.current.start, value.length);
  const end = Math.max(start, Math.min(selectionRef.current.end, value.length));
  const updated = `${value.slice(0, start)}${emoji}${value.slice(end)}`;
  const cursor = start + emoji.length;
  setValue(updated);
  selectionRef.current = { start: cursor, end: cursor };
  requestAnimationFrame(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    field.setSelectionRange(cursor, cursor);
    field.style.height = "auto";
    field.style.height = `${Math.min(field.scrollHeight, maxHeight)}px`;
  });
};
const commentDraftKey = (announcementId, parentId) =>
  parentId ? `${announcementId}:reply:${parentId}` : announcementId;
const appendComment = (comments, newComment, parentId) => {
  if (!parentId) return [...comments, newComment];
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newComment],
      };
    }
    return comment.replies?.length
      ? {
          ...comment,
          replies: appendComment(comment.replies, newComment, parentId),
        }
      : comment;
  });
};
const updateComment = (comments, commentId, updates) =>
  comments.map((comment) =>
    comment.id === commentId
      ? { ...comment, ...updates }
      : comment.replies?.length
        ? {
            ...comment,
            replies: updateComment(comment.replies, commentId, updates),
          }
        : comment,
  );
function CommentComposer({
  id,
  value,
  onChange,
  onSubmit,
  profile,
  user,
  isReply = false,
  isSubmitting = false,
}) {
  const { t } = useTranslation();
  const textareaRef = useRef(null);
  const selectionRef = useRef({ start: value.length, end: value.length });

  useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = value ? "auto" : "";
    if (value) field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
  }, [value]);

  const handleEmoji = (emoji) =>
    insertEmojiAtCursor(
      textareaRef,
      selectionRef,
      value,
      emoji,
      onChange,
    );

  return (
    <form
      className={`announcement-comment-form ${isReply ? "is-reply" : ""}`}
      onSubmit={onSubmit}
    >
      <CommentAvatar
        name={profile.name || user?.displayName}
        src={profile.avatar}
      />
      <div className="announcement-comment-compose">
        <textarea
          ref={textareaRef}
          id={id}
          className="announcement-comment-input"
          aria-label={t(
            isReply ? "announcements.reply" : "announcements.commentLabel",
          )}
          maxLength={2000}
          autoFocus={isReply}
          placeholder={t(
            isReply
              ? "announcements.replyPlaceholder"
              : "announcements.commentPlaceholder",
          )}
          rows={1}
          value={value}
          onBlur={(event) => saveSelection(event, selectionRef)}
          onClick={(event) => saveSelection(event, selectionRef)}
          onSelect={(event) => saveSelection(event, selectionRef)}
          onChange={(event) => {
            saveSelection(event, selectionRef);
            onChange(event.currentTarget.value);
          }}
        />
        <EmojiPicker
          className="announcement-comment-emoji"
          label={t("announcements.chooseEmoji")}
          onSelect={handleEmoji}
        />
        <button
          className="announcement-comment-submit"
          type="submit"
          aria-label={t(
            isReply ? "announcements.sendReply" : "announcements.postComment",
          )}
          title={t(
            isReply ? "announcements.sendReply" : "announcements.postComment",
          )}
          disabled={!value.trim() || isSubmitting}
        >
          <Send size={15} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
const blank = {
  title: "",
  content: "",
  type: "TEXT",
  mediaUrl: "",
  category: "Academic",
  priority: "NORMAL",
  author: "",
  isPublic: false,
};
export default function Announcements() {
  const { t, i18n } = useTranslation();
  const { announcements, setAnnouncements, profile, showToast } = useCampus();
  const { user } = useAuth();
  const canPublishOfficial = ["ADMIN", "DELEGATE"].includes(user?.role);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [view, setView] = useState("grid");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [openComments, setOpenComments] = useState({});
  const [allCommentsVisible, setAllCommentsVisible] = useState({});
  const [commentsByAnnouncement, setCommentsByAnnouncement] = useState({});
  const [commentsLoaded, setCommentsLoaded] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [commentsError, setCommentsError] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [commentLikesPending, setCommentLikesPending] = useState({});
  const [replyingTo, setReplyingTo] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [likesPending, setLikesPending] = useState({});
  const commentRequests = useRef(new Set());
  const announcementContentRef = useRef(null);
  const announcementSelection = useRef({ start: 0, end: 0 });
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
  const viewingType = String(viewing?.type || "TEXT").toUpperCase();
  const viewingPriority = normalizeAnnouncementPriority(viewing?.priority);
  const openForm = (item = null) => {
    const content = item?.content || "";
    announcementSelection.current = {
      start: content.length,
      end: content.length,
    };
    setEditing(item || false);
    setForm(
      item
        ? {
            title: item.title,
            content,
            type: item.type || "TEXT",
            mediaUrl: item.mediaUrl || "",
            category: item.category || "General",
            priority: normalizeAnnouncementPriority(item.priority),
            author: item.author || "",
            isPublic: Boolean(item.isPublic),
          }
        : {
            ...blank,
            author: profile.name.trim() || t("profile.studentName"),
          },
    );
    setError("");
  };
  const closeForm = () => setEditing(null);
  const insertAnnouncementEmoji = (emoji) =>
    insertEmojiAtCursor(
      announcementContentRef,
      announcementSelection,
      form.content,
      emoji,
      (content) => setForm((current) => ({ ...current, content })),
      500,
    );
  const save = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.author.trim()) {
      setError("announcements.validation");
      return;
    }
    if (
      ["IMAGE", "VIDEO"].includes(form.type) &&
      !form.mediaUrl.trim()
    ) {
      setError("announcements.mediaRequired");
      return;
    }
    const saved = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      mediaUrl: form.mediaUrl.trim() || null,
      author: form.author.trim(),
    };
    try {
      const newAnnouncement = {
        ...saved,
        publishedAt: today,
      };
      const storedAnnouncement = editing
        ? await api.updateAnnouncement(editing.id, saved)
        : await api.createAnnouncement(newAnnouncement);
      const persisted = setAnnouncements((items) =>
        editing
          ? items.map((item) =>
              item.id === editing.id
                ? { ...item, ...storedAnnouncement }
                : item,
            )
          : [storedAnnouncement, ...items],
      );
      closeForm();
      showToast(
        t(persisted ? "common.saved" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not save announcement.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const remove = async () => {
    try {
      await api.deleteAnnouncement(deleting.id);
      const persisted = setAnnouncements((items) =>
        items.filter((item) => item.id !== deleting.id),
      );
      setDeleting(null);
      showToast(
        t(persisted ? "common.deleted" : "common.storageError"),
        persisted ? "success" : "error",
      );
    } catch (error) {
      console.error("Could not delete announcement.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const markRead = async (item, isRead = true) => {
    try {
      const updatedAnnouncement = await api.updateAnnouncement(item.id, {
        isRead,
      });
      const persisted = setAnnouncements((items) =>
        items.map((record) =>
          record.id === item.id ? updatedAnnouncement : record,
        ),
      );
      if (!persisted) showToast(t("common.storageError"), "error");
    } catch (error) {
      console.error("Could not update announcement read status.", error);
      showToast(t("common.storageError"), "error");
    }
  };
  const toggleLike = async (item) => {
    if (likesPending[item.id]) return;
    setLikesPending((pending) => ({ ...pending, [item.id]: true }));
    try {
      const result = await api.toggleAnnouncementLike(item.id);
      setAnnouncements((items) =>
        items.map((record) =>
          record.id === item.id
            ? {
                ...record,
                isLiked: result.isLiked,
                likeCount: result.likesCount,
              }
            : record,
        ),
      );
    } catch (error) {
      console.error("Could not toggle announcement like.", error);
      showToast(t("common.apiError"), "error");
    } finally {
      setLikesPending((pending) => ({ ...pending, [item.id]: false }));
    }
  };
  const toggleCommentLike = async (announcement, comment) => {
    if (commentLikesPending[comment.id]) return;
    setCommentLikesPending((pending) => ({
      ...pending,
      [comment.id]: true,
    }));
    try {
      const result = await api.toggleAnnouncementCommentLike(comment.id);
      setCommentsByAnnouncement((records) => ({
        ...records,
        [announcement.id]: updateComment(
          records[announcement.id] || [],
          comment.id,
          {
            isLiked: result.isLiked,
            likeCount: result.likesCount,
          },
        ),
      }));
    } catch (error) {
      console.error("Could not toggle announcement comment like.", error);
      showToast(t("common.apiError"), "error");
    } finally {
      setCommentLikesPending((pending) => ({
        ...pending,
        [comment.id]: false,
      }));
    }
  };
  const loadComments = async (item) => {
    if (commentRequests.current.has(item.id)) return;
    commentRequests.current.add(item.id);
    setCommentsLoading((loading) => ({ ...loading, [item.id]: true }));
    setCommentsError((errors) => ({ ...errors, [item.id]: false }));
    try {
      const comments = await api.getAnnouncementComments(item.id);
      if (!Array.isArray(comments)) {
        throw new Error("The comments response was not a list.");
      }
      setCommentsByAnnouncement((records) => ({
        ...records,
        [item.id]: comments,
      }));
      setCommentsLoaded((loaded) => ({ ...loaded, [item.id]: true }));
    } catch (error) {
      console.error("Could not load announcement comments.", error);
      setCommentsError((errors) => ({ ...errors, [item.id]: true }));
      showToast(t("common.apiError"), "error");
    } finally {
      commentRequests.current.delete(item.id);
      setCommentsLoading((loading) => ({ ...loading, [item.id]: false }));
    }
  };
  const toggleComments = (item) => {
    const shouldOpen = !openComments[item.id];
    setOpenComments((open) => ({ ...open, [item.id]: shouldOpen }));
    if (shouldOpen && !commentsLoaded[item.id]) loadComments(item);
  };
  const submitComment = async (event, item, parentId = null) => {
    event.preventDefault();
    const draftKey = commentDraftKey(item.id, parentId);
    const content = (commentDrafts[draftKey] || "").trim();
    if (!content || commentSubmitting[draftKey]) return;

    setCommentSubmitting((submitting) => ({
      ...submitting,
      [draftKey]: true,
    }));
    try {
      const comment = await api.createAnnouncementComment(
        item.id,
        content,
        parentId,
      );
      setCommentsByAnnouncement((records) => ({
        ...records,
        [item.id]: appendComment(
          records[item.id] || [],
          comment,
          parentId,
        ),
      }));
      setCommentsLoaded((loaded) => ({ ...loaded, [item.id]: true }));
      setCommentDrafts((drafts) => ({ ...drafts, [draftKey]: "" }));
      if (parentId) {
        setOpenReplies((open) => ({ ...open, [parentId]: true }));
        setReplyingTo((records) =>
          records[item.id] === parentId
            ? { ...records, [item.id]: null }
            : records,
        );
      }
      setAnnouncements((items) =>
        items.map((record) =>
          record.id === item.id
            ? { ...record, commentCount: (record.commentCount || 0) + 1 }
            : record,
        ),
      );
    } catch (error) {
      console.error("Could not create announcement comment.", error);
      showToast(t("common.apiError"), "error");
    } finally {
      setCommentSubmitting((submitting) => ({
        ...submitting,
        [draftKey]: false,
      }));
    }
  };
  const shareAnnouncement = async (item) => {
    const url = new URL("/announcements", window.location.origin);
    url.hash = `announcement-${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: url.toString() });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url.toString());
        showToast(t("announcements.shareSuccess"), "success");
      } else {
        throw new Error("Sharing is not supported in this browser.");
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Could not share announcement.", error);
      showToast(t("announcements.shareFailed"), "error");
    }
  };
  const renderComment = (item, comment, depth = 0) => {
    const draftKey = commentDraftKey(item.id, comment.id);
    const isReplying = replyingTo[item.id] === comment.id;
    const areRepliesOpen = Boolean(openReplies[comment.id]);
    return (
      <article
        className={`announcement-comment ${depth ? "is-reply" : ""}`}
        key={comment.id}
      >
        <CommentAvatar
          name={comment.user.displayName}
          src={comment.user.profile?.avatar}
        />
        <div className="announcement-comment-content">
          <div className="announcement-comment-body">
            <div className="announcement-comment-heading">
              <strong>{comment.user.displayName}</strong>
              <time dateTime={comment.createdAt}>
                {formatLongDate(
                  String(comment.createdAt).slice(0, 10),
                  i18n.resolvedLanguage || "fr",
                )}
              </time>
            </div>
            <p>{comment.content}</p>
          </div>
          <div className="announcement-comment-actions">
            <button
              type="button"
              className={`announcement-comment-action ${comment.isLiked ? "is-liked" : ""}`}
              aria-pressed={Boolean(comment.isLiked)}
              disabled={Boolean(commentLikesPending[comment.id])}
              onClick={() => toggleCommentLike(item, comment)}
            >
              <Heart
                size={13}
                fill={comment.isLiked ? "currentColor" : "none"}
                aria-hidden="true"
              />
              <span>{t("announcements.like")}</span>
              <span>{comment.likeCount || 0}</span>
            </button>
            <button
              type="button"
              className="announcement-comment-action"
              aria-expanded={isReplying}
              onClick={() =>
                setReplyingTo((records) => ({
                  ...records,
                  [item.id]: isReplying ? null : comment.id,
                }))
              }
            >
              {t("announcements.reply")}
            </button>
            {comment.replies?.length > 0 && (
              <button
                type="button"
                className="announcement-comment-action announcement-comment-replies-toggle"
                aria-expanded={areRepliesOpen}
                aria-controls={`comment-replies-${comment.id}`}
                onClick={() =>
                  setOpenReplies((open) => ({
                    ...open,
                    [comment.id]: !open[comment.id],
                  }))
                }
              >
                {areRepliesOpen ? (
                  <ChevronUp size={13} aria-hidden="true" />
                ) : (
                  <ChevronDown size={13} aria-hidden="true" />
                )}
                {t(
                  areRepliesOpen
                    ? "announcements.hideReplies"
                    : "announcements.showReplies",
                  { count: comment.replies.length },
                )}
              </button>
            )}
          </div>
          {isReplying && (
            <CommentComposer
              id={`reply-${comment.id}`}
              value={commentDrafts[draftKey] || ""}
              onChange={(value) =>
                setCommentDrafts((drafts) => ({
                  ...drafts,
                  [draftKey]: value,
                }))
              }
              onSubmit={(event) =>
                submitComment(event, item, comment.id)
              }
              profile={profile}
              user={user}
              isReply
              isSubmitting={Boolean(commentSubmitting[draftKey])}
            />
          )}
          {comment.replies?.length > 0 && areRepliesOpen && (
            <div
              className="announcement-comment-replies"
              id={`comment-replies-${comment.id}`}
            >
              {comment.replies.map((reply) =>
                renderComment(item, reply, depth + 1),
              )}
            </div>
          )}
        </div>
      </article>
    );
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
          const type = String(item.type || "TEXT").toUpperCase();
          const priority = normalizeAnnouncementPriority(item.priority);
          const canManage = item.isOwner || (canPublishOfficial && item.isShared);
          return (
            <article
              className={`panel announcement-card ${priority === "URGENT" ? "is-urgent" : ""}`}
              id={`announcement-${item.id}`}
              key={item.id}
            >
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
                {item.isShared && (
                  <span className="shared-content-badge">
                    {t("announcements.official")}
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
                    {item.isRead ? <EyeOff size={16} /> : <CheckCheck size={16} />}
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
                  {canManage && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
              <h2 className={!item.isRead ? "announcement-unread" : ""}>
                {item.title}
              </h2>
              <div className="announcement-badges">
                {!item.isRead && (
                  <UnreadBadge>{t("announcements.unread")}</UnreadBadge>
                )}
                {type !== "TEXT" && (
                  <span
                    className={`announcement-type-badge announcement-type-${type.toLowerCase()}`}
                  >
                    {t(`announcements.types.${type.toLowerCase()}`)}
                  </span>
                )}
                <PriorityBadge
                  level={
                    priority === "LOW"
                      ? "low"
                      : priority === "URGENT"
                        ? "high"
                        : "medium"
                  }
                  label={t(`announcements.priorities.${priority.toLowerCase()}`)}
                />
              </div>
              <p className="announcement-content">{item.content}</p>
              <AnnouncementMedia item={{ ...item, type }} />
              <div className="announcement-social-toolbar">
                <button
                  type="button"
                  className={`announcement-social-action ${item.isLiked ? "is-liked" : ""}`}
                  aria-label={t(
                    item.isLiked ? "announcements.unlike" : "announcements.like",
                    { title: item.title },
                  )}
                  aria-pressed={Boolean(item.isLiked)}
                  disabled={Boolean(likesPending[item.id])}
                  onClick={() => toggleLike(item)}
                >
                  <Heart
                    size={16}
                    fill={item.isLiked ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                  <span>
                    {t(
                      item.isLiked
                        ? "announcements.liked"
                        : "announcements.like",
                    )}
                  </span>
                  <span className="announcement-social-count">
                    {item.likeCount || 0}
                  </span>
                </button>
                <button
                  type="button"
                  className="announcement-social-action"
                  aria-label={t("announcements.toggleComments", {
                    title: item.title,
                  })}
                  aria-expanded={Boolean(openComments[item.id])}
                  onClick={() => toggleComments(item)}
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  <span>{t("announcements.comments")}</span>
                  <span className="announcement-social-count">
                    {item.commentCount || 0}
                  </span>
                </button>
                <button
                  type="button"
                  className="announcement-social-action"
                  aria-label={t("announcements.share", { title: item.title })}
                  onClick={() => shareAnnouncement(item)}
                >
                  <Share2 size={16} aria-hidden="true" />
                  <span>{t("announcements.share")}</span>
                </button>
              </div>
              {openComments[item.id] && (
                <section
                  className="announcement-comments"
                  aria-label={t("announcements.commentsFor", {
                    title: item.title,
                  })}
                >
                  {commentsLoading[item.id] ? (
                    <p className="announcement-comments-empty">
                      {t("announcements.loadingComments")}
                    </p>
                  ) : commentsError[item.id] ? (
                    <p className="announcement-comments-empty">
                      {t("announcements.commentsLoadError")}{" "}
                      <button
                        type="button"
                        className="announcement-comments-toggle"
                        onClick={() => loadComments(item)}
                      >
                        {t("announcements.retryComments")}
                      </button>
                    </p>
                  ) : commentsByAnnouncement[item.id]?.length ? (
                    <div className="announcement-comment-list">
                      {commentsByAnnouncement[item.id].length > 1 && (
                        <button
                          type="button"
                          className="announcement-comments-toggle"
                          aria-expanded={Boolean(allCommentsVisible[item.id])}
                          onClick={() =>
                            setAllCommentsVisible((visible) => ({
                              ...visible,
                              [item.id]: !visible[item.id],
                            }))
                          }
                        >
                          {t(
                            allCommentsVisible[item.id]
                              ? "announcements.hideOlderComments"
                              : "announcements.viewAllComments",
                          )}
                        </button>
                      )}
                      {(allCommentsVisible[item.id]
                        ? commentsByAnnouncement[item.id]
                        : commentsByAnnouncement[item.id].slice(-1)
                      ).map((comment) => renderComment(item, comment))}
                    </div>
                  ) : Number(item.commentCount) > 0 ? (
                    <p className="announcement-comments-empty">
                      {t("announcements.commentsOutOfSync")}{" "}
                      <button
                        type="button"
                        className="announcement-comments-toggle"
                        onClick={() => loadComments(item)}
                      >
                        {t("announcements.refreshComments")}
                      </button>
                    </p>
                  ) : (
                    <p className="announcement-comments-empty">
                      {t("announcements.noComments")}
                    </p>
                  )}
                  <CommentComposer
                    id={`comment-${item.id}`}
                    value={commentDrafts[item.id] || ""}
                    onChange={(value) =>
                      setCommentDrafts((drafts) => ({
                        ...drafts,
                        [item.id]: value,
                      }))
                    }
                    onSubmit={(event) => submitComment(event, item)}
                    profile={profile}
                    user={user}
                    isSubmitting={Boolean(commentSubmitting[item.id])}
                  />
                </section>
              )}
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
                id="announcement-type"
                label={t("announcements.type")}
                value={form.type}
                onChange={(type) =>
                  setForm({
                    ...form,
                    type,
                    mediaUrl: ["IMAGE", "VIDEO"].includes(type)
                      ? form.mediaUrl
                      : "",
                  })
                }
                options={announcementTypes.map((value) => ({
                  value,
                  label: t(`announcements.types.${value.toLowerCase()}`),
                }))}
              />
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
                value={normalizeAnnouncementPriority(form.priority)}
                onChange={(priority) => setForm({ ...form, priority })}
                options={announcementPriorities.map((value) => ({
                  value,
                  label: t(`announcements.priorities.${value.toLowerCase()}`),
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
            {["IMAGE", "VIDEO"].includes(form.type) && (
              <label>
                {t("announcements.mediaUrl")}
                <input
                  type="url"
                  required
                  maxLength="2048"
                  value={form.mediaUrl}
                  onChange={(event) =>
                    setForm({ ...form, mediaUrl: event.target.value })
                  }
                  placeholder={t(
                    form.type === "IMAGE"
                      ? "announcements.imageUrlPlaceholder"
                      : "announcements.videoUrlPlaceholder",
                  )}
                />
                <span className="form-help-text">
                  {t("announcements.mediaUrlHelp")}
                </span>
              </label>
            )}
            <div className="announcement-content-field">
              <label htmlFor="announcement-content">
                {t("announcements.content")}
              </label>
              <div className="announcement-content-compose">
                <textarea
                  ref={announcementContentRef}
                  id="announcement-content"
                  rows="5"
                  maxLength="2000"
                  value={form.content}
                  onBlur={(event) =>
                    saveSelection(event, announcementSelection)
                  }
                  onClick={(event) =>
                    saveSelection(event, announcementSelection)
                  }
                  onSelect={(event) =>
                    saveSelection(event, announcementSelection)
                  }
                  onChange={(event) => {
                    saveSelection(event, announcementSelection);
                    const content = event.currentTarget.value;
                    setForm((current) => ({
                      ...current,
                      content,
                    }));
                  }}
                  placeholder={t("announcements.contentPlaceholder")}
                />
                <EmojiPicker
                  className="announcement-modal-emoji-picker"
                  label={t("announcements.chooseEmoji")}
                  onSelect={insertAnnouncementEmoji}
                />
              </div>
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
                <span>{t("announcements.publishOfficial")}</span>
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
              {viewingType !== "TEXT" && (
                <span
                  className={`announcement-type-badge announcement-type-${viewingType.toLowerCase()}`}
                >
                  {t(`announcements.types.${viewingType.toLowerCase()}`)}
                </span>
              )}
              <PriorityBadge
                level={
                  viewingPriority === "LOW"
                    ? "low"
                    : viewingPriority === "URGENT"
                      ? "high"
                      : "medium"
                }
                label={t(
                  `announcements.priorities.${viewingPriority.toLowerCase()}`,
                )}
              />
            </div>
            <p>{viewing.content}</p>
            <AnnouncementMedia item={{ ...viewing, type: viewingType }} />
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
