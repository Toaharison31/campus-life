import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  formatLongDate,
  getLocalDateString,
  isValidDateString,
} from "../services/dates";

const localeFor = (language) => (language === "fr" ? "fr-FR" : "en-US");
const toDateString = (year, month, day) =>
  `${String(year).padStart(4, "0")}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

function getDateParts(value) {
  if (!isValidDateString(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return { year, month: month - 1, day };
}

function formatNumericDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

function getMonthDate(year, month) {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month, 1);
  return date;
}

export default function DatePicker({
  id,
  label,
  value,
  onChange,
  language = "en",
  required = false,
  error,
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const initialDate = getDateParts(value) || getDateParts(getLocalDateString());
  const [month, setMonth] = useState(() =>
    getMonthDate(initialDate.year, initialDate.month),
  );
  const [focusDate, setFocusDate] = useState(value || getLocalDateString());
  const [placement, setPlacement] = useState({
    side: "bottom",
    align: "left",
    width: 300,
    maxHeight: 340,
  });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const dayRefs = useRef({});
  const locale = localeFor(language);
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const today = getLocalDateString();
  const monthLabel = month.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(Date.UTC(2024, 0, index + 1)),
  );
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const firstWeekday =
    (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) dayRefs.current[focusDate]?.focus();
  }, [focusDate, month, open]);

  const moveMonth = (amount) => {
    const nextMonth = getMonthDate(year, monthIndex + amount);
    setMonth(nextMonth);
    setFocusDate(
      toDateString(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), 1),
    );
  };

  const focusRelativeDate = (date, offset) => {
    const candidate = new Date(`${date}T12:00:00Z`);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    const nextValue = toDateString(
      candidate.getUTCFullYear(),
      candidate.getUTCMonth(),
      candidate.getUTCDate(),
    );
    setFocusDate(nextValue);
    setMonth(getMonthDate(candidate.getUTCFullYear(), candidate.getUTCMonth()));
  };

  const openPicker = () => {
    const nextDate = getDateParts(value) || getDateParts(today);
    setMonth(getMonthDate(nextDate.year, nextDate.month));
    setFocusDate(value || today);
    const bounds = rootRef.current?.getBoundingClientRect();
    const panel = rootRef.current?.closest(".modal-panel");
    const panelBounds = panel?.getBoundingClientRect();
    if (bounds) {
      const width = Math.max(
        220,
        Math.min(
          320,
          window.innerWidth - 24,
          (panel?.clientWidth || window.innerWidth) - 24,
        ),
      );
      const topLimit = Math.max(8, (panelBounds?.top ?? 0) + 8);
      const bottomLimit = Math.min(
        window.innerHeight - 8,
        (panelBounds?.bottom ?? window.innerHeight) - 8,
      );
      const spaceAbove = bounds.top - topLimit - 6;
      const spaceBelow = bottomLimit - bounds.bottom - 6;
      const side =
        spaceBelow < 340 && spaceAbove > spaceBelow ? "top" : "bottom";
      const availableSpace = side === "top" ? spaceAbove : spaceBelow;
      const horizontalLimit =
        (panelBounds?.right ?? window.innerWidth) - 8;
      setPlacement({
        side,
        align: bounds.left + width > horizontalLimit ? "right" : "left",
        width,
        maxHeight: Math.max(180, Math.min(340, availableSpace)),
      });
    }
    setOpen(true);
  };

  const chooseDate = (date) => {
    onChange(date);
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      ref={rootRef}
      className={`date-picker ${error ? "has-error" : ""}`}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="date-picker-trigger"
        aria-labelledby={`${id}-label`}
        aria-label={`${label}: ${
          value && isValidDateString(value)
            ? formatLongDate(value, language)
            : t("datePicker.placeholder")
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span
          className={value && isValidDateString(value) ? "" : "placeholder"}
        >
          {value && isValidDateString(value)
            ? formatNumericDate(value)
            : t("datePicker.placeholder")}
        </span>
        <CalendarDays size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="date-picker-calendar"
          data-placement={placement.side}
          data-align={placement.align}
          style={{
            width: `${placement.width}px`,
            maxHeight: `${placement.maxHeight}px`,
          }}
          role="dialog"
          aria-label={t("datePicker.selectDate")}
        >
          <div className="date-picker-heading">
            <button
              type="button"
              className="icon-button"
              aria-label={t("datePicker.previousMonth")}
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <strong aria-live="polite">{monthLabel}</strong>
            <button
              type="button"
              className="icon-button"
              aria-label={t("datePicker.nextMonth")}
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div
            className="date-picker-grid"
            role="group"
            aria-label={monthLabel}
          >
            {weekdays.map((weekday, index) => (
              <span
                className="date-picker-weekday"
                aria-hidden="true"
                key={`${weekday}-${index}`}
              >
                {weekday}
              </span>
            ))}
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span
                className="date-picker-empty"
                aria-hidden="true"
                key={`empty-${index}`}
              />
            ))}
            {Array.from({ length: dayCount }, (_, index) => {
              const day = index + 1;
              const date = toDateString(year, monthIndex, day);
              const dateValue = new Date(
                Date.UTC(year, monthIndex, day, 12),
              );
              const spokenDate = dateValue.toLocaleDateString(locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              });
              return (
                <button
                  ref={(node) => {
                    dayRefs.current[date] = node;
                  }}
                  type="button"
                  className="date-picker-day"
                  aria-label={spokenDate}
                  aria-pressed={value === date}
                  aria-current={date === today ? "date" : undefined}
                  tabIndex={focusDate === date ? 0 : -1}
                  key={date}
                  onClick={() => chooseDate(date)}
                  onKeyDown={(event) => {
                    const offsets = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    };
                    if (offsets[event.key]) {
                      event.preventDefault();
                      focusRelativeDate(date, offsets[event.key]);
                    } else if (event.key === "Home" || event.key === "End") {
                      event.preventDefault();
                      focusRelativeDate(
                        date,
                        event.key === "Home"
                          ? -((dateValue.getUTCDay() + 6) % 7)
                          : 6 - ((dateValue.getUTCDay() + 6) % 7),
                      );
                    } else if (event.key === "PageUp") {
                      event.preventDefault();
                      moveMonth(event.shiftKey ? -12 : -1);
                    } else if (event.key === "PageDown") {
                      event.preventDefault();
                      moveMonth(event.shiftKey ? 12 : 1);
                    } else if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      chooseDate(date);
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-text-button"
              onClick={() => chooseDate(today)}
            >
              {t("datePicker.today")}
            </button>
            {value && (
              <button
                type="button"
                className="date-picker-text-button"
                onClick={() => chooseDate("")}
              >
                {t("datePicker.clear")}
              </button>
            )}
          </div>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="form-error" role="alert">
          {t(error)}
        </p>
      )}
    </div>
  );
}
