import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const palette = Array.from({ length: 8 }, (_, index) =>
  `--course-color-${index + 1}`,
);

function normalizeHex(value) {
  const candidate = value.startsWith("#") ? value : `#${value}`;
  return /^#[\da-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : null;
}

function toHexColor(rgb) {
  const channels = rgb.match(/\d+/g);
  if (!channels || channels.length < 3) {
    throw new Error(`Unexpected color value from the palette: ${rgb}`);
  }
  return `#${channels
    .slice(0, 3)
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

export default function ColorField({ label, value, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [selectedPaletteColor, setSelectedPaletteColor] = useState(null);
  const pickerRef = useRef(null);
  const id = useId();
  const panelId = `${id}-palette`;
  const errorId = `${id}-error`;
  const isValid = Boolean(normalizeHex(draft));

  useEffect(() => {
    if (open) pickerRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div className="form-color-field">
      <div className="form-color-heading">
        <span>{label}</span>
        <span className="form-color-value">{value.toUpperCase()}</span>
      </div>
      <div className="form-color-current">
        <span
          className="form-color-preview"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <button
          type="button"
          className="form-color-toggle"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          {t(open ? "timetable.hideColorOptions" : "timetable.chooseColor")}
        </button>
      </div>
      {open && (
        <div className="form-color-picker" id={panelId} ref={pickerRef}>
          <div
            className="form-color-palette"
            role="group"
            aria-label={t("timetable.presetColors")}
          >
            {palette.map((token, index) => (
              <button
                type="button"
                key={token}
                className="form-color-swatch"
                style={{ backgroundColor: `var(${token})` }}
                aria-label={t("timetable.colorOption", {
                  number: index + 1,
                })}
                aria-pressed={selectedPaletteColor === token}
                onClick={(event) => {
                  const color = toHexColor(
                    getComputedStyle(event.currentTarget).backgroundColor,
                  );
                  setDraft(color);
                  setSelectedPaletteColor(token);
                  onChange(color);
                }}
              />
            ))}
          </div>
          <label className="form-color-hex-field">
            {t("timetable.customHexColor")}
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck="false"
              maxLength={7}
              placeholder="RRGGBB"
              value={draft}
              aria-invalid={!isValid}
              aria-describedby={!isValid ? errorId : undefined}
              onChange={(event) => {
                const nextValue = event.target.value.trim();
                const color = normalizeHex(nextValue);
                setDraft(nextValue);
                setSelectedPaletteColor(null);
                if (color) onChange(color);
              }}
            />
            {!isValid && (
              <span className="form-color-error" id={errorId} role="status">
                {t("timetable.invalidHexColor")}
              </span>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
