import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EmptyState({ title, message }) {
  const { t } = useTranslation();
  return (
    <div className="empty-state">
      <span>
        <Inbox size={23} />
      </span>
      <strong>{title || t("common.emptyTitle")}</strong>
      <p>{message || t("common.emptyMessage")}</p>
    </div>
  );
}
