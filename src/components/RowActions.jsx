import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import IconButton from "./IconButton";

export default function RowActions({ actions, label }) {
  const { t } = useTranslation();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const moveFocus = (event) => {
    const items = [...(menuRef.current?.querySelectorAll("button") || [])];
    if (!items.length) return;
    const current = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(current + step + items.length) % items.length]?.focus();
    }
  };

  return (
    <div className="row-actions-menu">
      <IconButton
        icon={MoreHorizontal}
        label={label || t("common.moreActions")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
      />
      {open && (
        <div
          id={menuId}
          className="row-actions-popover"
          role="menu"
          ref={menuRef}
          onKeyDown={moveFocus}
        >
          {actions.map(({ label: actionLabel, icon: Icon, onClick, disabled }) => (
            <button
              type="button"
              role="menuitem"
              key={actionLabel}
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                onClick?.();
              }}
            >
              {Icon && <Icon size={18} strokeWidth={1.75} aria-hidden="true" />}
              <span>{actionLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
