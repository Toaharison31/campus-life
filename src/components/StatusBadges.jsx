import { AlertCircle, CheckCircle2, Circle, Flag } from "lucide-react";
import { getCourseColorClass } from "../services/courseColors";
import Badge from "./Badge";

const priorityLevels = new Set(["high", "medium", "low"]);
const taskStatuses = new Set(["pending", "completed", "overdue"]);

export function PriorityBadge({ level, label }) {
  const normalized = String(level || "medium").toLowerCase();
  const safeLevel = priorityLevels.has(normalized) ? normalized : "medium";
  return (
    <Badge tone={`priority-${safeLevel}`}>
      <Flag size={13} aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function TaskStatusBadge({ status, label }) {
  const normalized = String(status || "pending").toLowerCase();
  const safeStatus = taskStatuses.has(normalized) ? normalized : "pending";
  const Icon =
    safeStatus === "completed"
      ? CheckCircle2
      : safeStatus === "overdue"
        ? AlertCircle
        : Circle;
  return (
    <Badge tone={`status-${safeStatus}`}>
      <Icon size={13} aria-hidden="true" />
      {label}
    </Badge>
  );
}

export function UnreadBadge({ children }) {
  return (
    <Badge tone="announcement-unread">
      <span className="unread-indicator" aria-hidden="true" />
      {children}
    </Badge>
  );
}

export function CountBadge({ count, className = "", ariaLabel }) {
  if (!Number.isFinite(Number(count)) || Number(count) <= 0) return null;
  const displayCount = Number(count) > 99 ? "99+" : Number(count);
  return (
    <span
      className={`count-badge ${className}`.trim()}
      aria-label={ariaLabel}
    >
      {displayCount}
    </span>
  );
}

export function CourseChip({ course, children }) {
  if (!course) return null;
  return (
    <Badge
      tone="neutral"
      className={`course-chip ${getCourseColorClass(course)}`}
    >
      {children || course.name}
    </Badge>
  );
}
