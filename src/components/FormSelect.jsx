// Propose une liste déroulante personnalisée avec navigation au clavier.
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function FormSelect({
  id,
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  className = "",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState({
    side: "bottom",
    maxHeight: 240,
  });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    optionRefs.current[activeIndex]?.focus();
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [activeIndex, open]);

  const openMenu = (index = selectedIndex) => {
    const triggerBounds = triggerRef.current?.getBoundingClientRect();
    if (triggerBounds) {
      const panelBounds = rootRef.current
        ?.closest(".modal-panel")
        ?.getBoundingClientRect();
      const topLimit = Math.max(12, (panelBounds?.top ?? 0) + 8);
      const bottomLimit = Math.min(
        window.innerHeight - 12,
        (panelBounds?.bottom ?? window.innerHeight) - 8,
      );
      const spaceAbove = triggerBounds.top - topLimit - 6;
      const spaceBelow = bottomLimit - triggerBounds.bottom - 6;
      const menuHeight = Math.min(
        options.length * 40 + 10,
        280,
        window.innerHeight * 0.45,
      );
      const side =
        spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
      const availableSpace = side === "top" ? spaceAbove : spaceBelow;
      setPlacement({
        side,
        maxHeight: Math.max(80, Math.min(menuHeight, availableSpace)),
      });
    }
    setActiveIndex(index);
    setOpen(true);
  };

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const selectOption = (index) => {
    onChange(options[index].value);
    closeMenu(true);
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(selectedIndex);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) closeMenu();
      else openMenu(selectedIndex);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    }
  };

  const handleOptionKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === "ArrowDown")
      nextIndex = (index + 1) % options.length;
    else if (event.key === "ArrowUp")
      nextIndex = (index - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      selectOption(index);
      return;
    } else {
      return;
    }
    event.preventDefault();
    setActiveIndex(nextIndex);
  };

  return (
    <div
      ref={rootRef}
      className={`form-select-field ${className} ${error ? "has-error" : ""}`}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) {
          setOpen(false);
          onBlur?.(event);
        }
      }}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="form-select-trigger"
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>{selectedOption?.label ?? ""}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && options.length > 0 && (
        <div
          id={`${id}-options`}
          className="form-select-options"
          data-placement={placement.side}
          role="listbox"
          aria-labelledby={`${id}-label`}
          style={{ maxHeight: `${placement.maxHeight}px` }}
        >
          {options.map((option, index) => (
            <button
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={value === option.value}
              className="form-select-option"
              id={`${id}-option-${index}`}
              key={option.value}
              onClick={() => selectOption(index)}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              {option.label}
            </button>
          ))}
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
