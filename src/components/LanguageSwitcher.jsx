// Permet de changer la langue utilisée dans l'interface.
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

const languages = ["fr", "en"];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const buttonRef = useRef(null);
  const currentLanguage = i18n.resolvedLanguage === "fr" ? "fr" : "en";

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return (
    <div className="language-picker" ref={pickerRef}>
      <button
        ref={buttonRef}
        className="language-trigger"
        type="button"
        aria-label={t("header.selectLanguage")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="language-trigger-name">
          {currentLanguage.toUpperCase()}
        </span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="language-dismiss"
            aria-label={t("common.dismiss")}
            onClick={() => setOpen(false)}
          />
          <div
            className="language-menu language-menu-open"
            role="menu"
            aria-label={t("header.selectLanguage")}
          >
            {languages.map((language) => (
              <button
                key={language}
                className={`language-option ${currentLanguage === language ? "language-option-selected" : ""}`}
                type="button"
                role="menuitemradio"
                aria-checked={currentLanguage === language}
                onClick={() => {
                  i18n.changeLanguage(language);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                <span>{t(`languageNames.${language}`)}</span>
                {currentLanguage === language && <Check size={15} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
