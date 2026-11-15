// Permet de sélectionner une option parmi plusieurs segments.
import { useRef } from "react";

export default function SegmentedControl({
  value,
  options,
  onChange,
  label,
  className = "",
}) {
  const refs = useRef([]);
  const onKeyDown = (event, index) => {
    const direction =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (!direction) return;
    event.preventDefault();
    const next = (index + direction + options.length) % options.length;
    refs.current[next]?.focus();
    onChange(options[next].value);
  };
  return (
    <div
      className={`segmented-control ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? "selected" : ""}
            key={option.value}
            ref={(node) => (refs.current[index] = node)}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
