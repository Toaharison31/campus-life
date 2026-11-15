// Affiche une fenêtre modale et gère son ouverture, sa fermeture et le focus.
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children, wide = false }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeTimerRef = useRef(null);
  const isClosingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const previouslyFocusedRef = useRef(
    typeof document === "undefined" ? null : document.activeElement,
  );
  const requestClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    const reduceMotion =
      document.documentElement.dataset.reduceMotion === "true" ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      onCloseRef.current();
      return;
    }
    setClosing(true);
    closeTimerRef.current = window.setTimeout(
      () => onCloseRef.current(),
      160,
    );
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    const previouslyFocused = previouslyFocusedRef.current;
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusInitial = () => {
      const initial =
        panel?.querySelector("[autofocus]") ||
        panel?.querySelector(
          "input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
        ) ||
        panel?.querySelector(focusableSelector);
      (initial || panel)?.focus();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (event.defaultPrevented) return;
        requestClose();
        return;
      }
      if (event.key !== "Tab" || !panel) return;

      const focusable = [...panel.querySelectorAll(focusableSelector)].filter(
        (element) => element.getClientRects().length > 0,
      );
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    focusInitial();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, [requestClose]);

  return createPortal(
    <div
      className={`modal-backdrop ${closing ? "is-closing" : ""}`}
      onMouseDown={(event) =>
        event.target === event.currentTarget && requestClose()
      }
    >
      <section
        ref={panelRef}
        className={`modal-panel animate-pop-in ${wide ? "modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label={t("common.closeDialog")}
            onClick={requestClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
