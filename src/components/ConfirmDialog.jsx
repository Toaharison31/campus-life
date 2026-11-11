import Modal from "./Modal";
import { useTranslation } from "react-i18next";

export default function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  const { t } = useTranslation();
  return (
    <Modal title={title || t("common.confirmDeleteTitle")} onClose={onCancel}>
      <div className="confirm-body">
        <p>{message || t("common.deleteWarning")}</p>
        <div className="form-actions">
          <button className="button button-secondary" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button className="button button-danger" onClick={onConfirm}>
            {t("common.delete")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
