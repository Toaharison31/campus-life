import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, wide = false }) {
  const { t } = useTranslation();
  useEffect(() => {
    const onKeyDown = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`modal-panel ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label={t("common.closeDialog")}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
