import { ArrowRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function EmptyState({
  title,
  message,
  action,
  to,
  icon: Icon = Inbox,
}) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <span className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 120 96" fill="none">
          <path
            d="M17 25.5A8.5 8.5 0 0 1 25.5 17h69a8.5 8.5 0 0 1 8.5 8.5v49a8.5 8.5 0 0 1-8.5 8.5h-69a8.5 8.5 0 0 1-8.5-8.5v-49Z"
            className="empty-art-paper"
          />
          <path d="M17 57h22l7 10h28l7-10h22" className="empty-art-line" />
          <circle cx="87" cy="27" r="13" className="empty-art-spark" />
          <path d="m83.5 27 2.5 2.5 5-5" className="empty-art-check" />
        </svg>
        <Icon size={23} />
      </span>
      <strong>{title || t("common.emptyTitle")}</strong>
      <p>{message || t("common.emptyMessage")}</p>
      {action && to && (
        <Link className="button button-primary empty-action" to={to}>
          {action} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
