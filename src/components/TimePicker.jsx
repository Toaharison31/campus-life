// Fournit un sélecteur d'heure basé sur les heures et minutes de la journée.
import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const hours = Array.from({ length: 24 }, (_, index) => index);
const minutes = Array.from({ length: 60 }, (_, index) => index);
const pad = (value) => String(value).padStart(2, "0");

function parseTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");
  return match
    ? { hour: Number(match[1]), minute: Number(match[2]) }
    : null;
}

export default function TimePicker({ id, label, value, onChange, required }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState({
    side: "bottom",
    align: "left",
    maxHeight: 260,
  });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const hourOptionRefs = useRef({});
  const minuteOptionRefs = useRef({});
  const selected = parseTime(value);
  const activeHour = selected?.hour ?? 8;
  const activeMinute = selected?.minute ?? 0;

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
    if (!open) return;
    const scrollToSelected = (list, options, index) => {
      const container = list.current;
      const option = options.current[index];
      if (container && option) {
        container.scrollTop =
          option.offsetTop - (container.clientHeight - option.offsetHeight) / 2;
      }
    };
    scrollToSelected(hoursRef, hourOptionRefs, activeHour);
    scrollToSelected(minutesRef, minuteOptionRefs, activeMinute);
  }, [activeHour, activeMinute, open]);

  useEffect(() => {
    if (open) hourOptionRefs.current[activeHour]?.focus();
  }, [activeHour, open]);

  const openPicker = () => {
    const bounds = rootRef.current?.getBoundingClientRect();
    const panel = rootRef.current?.closest(".modal-panel");
    const panelBounds = panel?.getBoundingClientRect();
    if (bounds) {
      const topLimit = Math.max(8, (panelBounds?.top ?? 0) + 8);
      const bottomLimit = Math.min(
        window.innerHeight - 8,
        (panelBounds?.bottom ?? window.innerHeight) - 8,
      );
      const spaceAbove = bounds.top - topLimit - 6;
      const spaceBelow = bottomLimit - bounds.bottom - 6;
      const side =
        spaceBelow < 260 && spaceAbove > spaceBelow ? "top" : "bottom";
      const availableSpace = side === "top" ? spaceAbove : spaceBelow;
      const rightLimit = Math.min(
        window.innerWidth - 8,
        (panelBounds?.right ?? window.innerWidth) - 8,
      );
      setPlacement({
        side,
        align: bounds.left + 260 > rightLimit ? "right" : "left",
        maxHeight: Math.max(140, Math.min(280, availableSpace)),
      });
    }
    setOpen(true);
  };

  const updateTime = (hour, minute) => onChange(`${pad(hour)}:${pad(minute)}`);

  const moveOption = (event, values, active, list, options, update) => {
    let next;
    if (event.key === "ArrowDown") next = (active + 1) % values.length;
    else if (event.key === "ArrowUp")
      next = (active - 1 + values.length) % values.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = values.length - 1;
    else return;
    event.preventDefault();
    update(next);
    options.current[next]?.focus();
    const container = list.current;
    const option = options.current[next];
    if (container && option) {
      const optionTop = option.offsetTop;
      if (optionTop < container.scrollTop) container.scrollTop = optionTop;
      else if (optionTop + option.offsetHeight > container.scrollTop + container.clientHeight) {
        container.scrollTop = optionTop + option.offsetHeight - container.clientHeight;
      }
    }
  };

  const selectHour = (hour) => updateTime(hour, activeMinute);
  const selectMinute = (minute) => updateTime(activeHour, minute);

  return (
    <div
      ref={rootRef}
      className="time-picker"
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
        className="time-picker-trigger"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span id={`${id}-value`} className={value ? "" : "placeholder"}>
          {value || t("timetable.timePicker.placeholder")}
        </span>
        <Clock3 size={16} aria-hidden="true" />
      </button>
      {open && (
        <div
          className="time-picker-menu"
          data-placement={placement.side}
          data-align={placement.align}
          role="dialog"
          aria-label={t("timetable.timePicker.selectTime")}
          style={{ "--time-picker-max-height": `${placement.maxHeight}px` }}
        >
          <div className="time-picker-columns">
            <section aria-label={t("timetable.timePicker.hours")}>
              <h3>{t("timetable.timePicker.hours")}</h3>
              <div className="time-picker-options" ref={hoursRef}>
                {hours.map((hour) => (
                  <button
                    key={hour}
                    ref={(node) => {
                      hourOptionRefs.current[hour] = node;
                    }}
                    type="button"
                    className="time-picker-option"
                    aria-pressed={activeHour === hour}
                    tabIndex={activeHour === hour ? 0 : -1}
                    onClick={() => selectHour(hour)}
                    onKeyDown={(event) =>
                      moveOption(
                        event,
                        hours,
                        activeHour,
                        hoursRef,
                        hourOptionRefs,
                        selectHour,
                      )
                    }
                  >
                    {pad(hour)}
                  </button>
                ))}
              </div>
            </section>
            <section aria-label={t("timetable.timePicker.minutes")}>
              <h3>{t("timetable.timePicker.minutes")}</h3>
              <div className="time-picker-options" ref={minutesRef}>
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    ref={(node) => {
                      minuteOptionRefs.current[minute] = node;
                    }}
                    type="button"
                    className="time-picker-option"
                    aria-pressed={activeMinute === minute}
                    tabIndex={activeMinute === minute ? 0 : -1}
                    onClick={() => selectMinute(minute)}
                    onKeyDown={(event) =>
                      moveOption(
                        event,
                        minutes,
                        activeMinute,
                        minutesRef,
                        minuteOptionRefs,
                        selectMinute,
                      )
                    }
                  >
                    {pad(minute)}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
