// Affiche un message temporaire avec une indication de résultat.
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function Toast({
  message,
  tone = "info",
  onClose,
  onUndo,
  undoLabel,
  className = "",
}) {
  const { t } = useTranslation();
  const Icon = icons[tone] || Info;

  if (!message) return null;

  return (
    <div
      className={`toast toast-${tone} ${className}`.trim()}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      <Icon size={19} aria-hidden="true" />
      <span>{message}</span>
      {onUndo && (
        <button type="button" className="toast-undo" onClick={onUndo}>
          {undoLabel || t("common.undo")}
        </button>
      )}
      {onClose && (
        <button
          type="button"
          className="icon-button"
          aria-label={t("common.dismiss")}
          onClick={onClose}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
