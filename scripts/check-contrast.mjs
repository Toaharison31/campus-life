// Vérifie le contraste des couleurs définies pour les thèmes de l'application.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const tokenSource = await readFile(
  resolve("src/styles/tokens.css"),
  "utf8",
);
const themes = ["light", "dark", "campus", "sunset"];
const requiredTokens = [
  "bg-app",
  "bg-surface",
  "bg-surface-raised",
  "bg-subtle",
  "bg-sidebar",
  "bg-sidebar-hover",
  "bg-sidebar-selected",
  "bg-overlay",
  "bg-input",
  "bg-hover",
  "bg-active",
  "bg-selected",
  "text-primary",
  "text-secondary",
  "text-muted",
  "text-disabled",
  "text-inverse",
  "text-link",
  "text-on-primary",
  "text-on-sidebar",
  "text-on-sidebar-muted",
  "text-on-sidebar-active",
  "border-subtle",
  "border-default",
  "border-strong",
  "border-focus",
  "border-error",
  "primary",
  "primary-hover",
  "primary-active",
  "primary-subtle",
  "secondary",
  "accent",
  "shadow-sm",
  "shadow-md",
  "shadow-lg",
  "ring",
  "ring-inverse",
  "text-placeholder",
  ...["success", "warning", "danger", "info", "neutral"].flatMap((status) =>
    ["bg", "text", "border", "solid"].map((part) => `${status}-${part}`),
  ),
  ...Array.from({ length: 8 }, (_, index) =>
    ["bg", "text", "border"].map((part) => `course-${index + 1}-${part}`),
  ).flat(),
  ...[
    "priority-high",
    "priority-medium",
    "priority-low",
    "task-pending",
    "task-completed",
    "task-overdue",
    "announcement-unread",
    "announcement-read",
  ].flatMap((prefix) => ["bg", "text", "border"].map((part) => `${prefix}-${part}`)),
];

function declarations(source) {
  return Object.fromEntries(
    [...source.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.trim(),
    ]),
  );
}

const shared = declarations(
  tokenSource.match(/:root\s*\{([^}]+)\}\s*$/)?.[1] || "",
);
const palette = Object.fromEntries(
  themes.map((theme) => {
    const block = tokenSource.match(
      new RegExp(`:root\\[data-theme="${theme}"\\][^{]*\\{([^}]+)\\}`),
    )?.[1];
    if (!block) throw new Error(`Missing palette for theme "${theme}".`);
    return [theme, { ...shared, ...declarations(block) }];
  }),
);

function token(theme, name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Circular token reference: --${name}`);
  const raw = palette[theme][name];
  if (!raw) return null;
  const alias = raw.match(/^var\(--([\w-]+)\)$/);
  return alias ? token(theme, alias[1], new Set([...seen, name])) : raw;
}

function rgb(value) {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1];
  if (!hex) return null;
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  return [0, 2, 4].map((index) =>
    Number.parseInt(full.slice(index, index + 2), 16) / 255,
  );
}

function luminance(value) {
  const channels = rgb(value);
  if (!channels) return null;
  const linear = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(foreground, background) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  if (fg === null || bg === null) return null;
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

const results = [];
for (const theme of themes) {
  const pairs = [
    ["text-primary / app", "text-primary", "bg-app", 4.5],
    ["text-primary / surface", "text-primary", "bg-surface", 4.5],
    ["text-primary / raised", "text-primary", "bg-surface-raised", 4.5],
    ["text-primary / subtle", "text-primary", "bg-subtle", 4.5],
    ["text-primary / hover", "text-primary", "bg-hover", 4.5],
    ["text-primary / selected", "text-primary", "bg-selected", 4.5],
    ["text-primary / input", "text-primary", "bg-input", 4.5],
    ["text-secondary / app", "text-secondary", "bg-app", 4.5],
    ["text-muted / surface", "text-muted", "bg-surface", 4.5],
    ["text-disabled / surface", "text-disabled", "bg-surface", 4.5],
    ["text-disabled / subtle", "text-disabled", "bg-subtle", 4.5],
    ["placeholder / input", "text-placeholder", "bg-input", 4.5],
    ["link / app", "text-link", "bg-app", 4.5],
    ["link / surface", "text-link", "bg-surface", 4.5],
    ["sidebar text / sidebar", "text-on-sidebar", "bg-sidebar", 4.5],
    ["sidebar muted / sidebar", "text-on-sidebar-muted", "bg-sidebar", 4.5],
    ["sidebar text / hover", "text-on-sidebar", "bg-sidebar-hover", 4.5],
    ["sidebar active / selected", "text-on-sidebar-active", "bg-sidebar-selected", 4.5],
    ["ring / surface", "ring", "bg-surface", 3],
    ["ring / app", "ring", "bg-app", 3],
    ["ring inverse / sidebar", "ring-inverse", "bg-sidebar", 3],
    ["ring inverse / sidebar hover", "ring-inverse", "bg-sidebar-hover", 3],
    ["ring inverse / sidebar selected", "ring-inverse", "bg-sidebar-selected", 3],
    ["primary / surface icon", "primary", "bg-surface", 3],
    ["secondary / surface icon", "secondary", "bg-surface", 3],
    ["accent / surface icon", "accent", "bg-surface", 3],
    ["on primary / base", "text-on-primary", "primary", 4.5],
    ["on primary / hover", "text-on-primary", "primary-hover", 4.5],
    ["on primary / active", "text-on-primary", "primary-active", 4.5],
    ["gradient leading text", "text-on-primary", "primary-active", 4.5],
    ["gradient trailing text", "text-on-primary", "secondary", 4.5],
    ["hero text / gradient start", "text-inverse", "primary-active", 4.5],
    ["hero text / gradient end", "text-inverse", "secondary", 4.5],
    ["border subtle / input", "border-subtle", "bg-input", 3],
    ["border default / input", "border-default", "bg-input", 3],
    ["border strong / surface", "border-strong", "bg-surface", 3],
    ["focus border / input", "border-focus", "bg-input", 3],
    ["error border / input", "border-error", "bg-input", 3],
  ];
  for (const status of ["success", "warning", "danger", "info", "neutral"]) {
    pairs.push(
      [`${status} text / badge`, `${status}-text`, `${status}-bg`, 4.5],
      [`${status} border / badge`, `${status}-border`, `${status}-bg`, 3],
      [`${status} solid / surface`, "text-on-primary", `${status}-solid`, 4.5],
    );
  }
  for (let index = 1; index <= 8; index += 1) {
    pairs.push(
      [`course ${index} text / bg`, `course-${index}-text`, `course-${index}-bg`, 4.5],
      [`course ${index} border / bg`, `course-${index}-border`, `course-${index}-bg`, 3],
    );
  }

  const missing = requiredTokens.filter((name) => token(theme, name) === null);
  if (missing.length) {
    throw new Error(`${theme} is missing tokens: ${missing.join(", ")}`);
  }
  for (const [label, foregroundKey, backgroundKey, required] of pairs) {
    const foreground = token(theme, foregroundKey);
    const background = token(theme, backgroundKey);
    const value = ratio(foreground, background);
    results.push({
      theme,
      pair: label,
      foreground,
      background,
      value,
      required,
      pass: value !== null && value >= required,
    });
  }
}

const pad = (value, size) => String(value).padEnd(size);
console.log(
  `${pad("theme", 8)} | ${pad("pair", 31)} | ${pad("foreground", 10)} | ${pad("background", 10)} | ratio | required | result`,
);
for (const item of results) {
  console.log(
    `${pad(item.theme, 8)} | ${pad(item.pair, 31)} | ${pad(item.foreground, 10)} | ${pad(item.background, 10)} | ${item.value?.toFixed(2) ?? "N/A"}  | ${item.required.toFixed(1)}:1     | ${item.pass ? "PASS" : "FAIL"}`,
  );
}

console.log("\nLowest contrast passing pair per theme:");
for (const theme of themes) {
  const lowest = results
    .filter((item) => item.theme === theme)
    .sort((a, b) => a.value - b.value)[0];
  console.log(
    `${theme}: ${lowest.pair} — ${lowest.value.toFixed(2)}:1 (minimum ${lowest.required.toFixed(1)}:1)`,
  );
}

const failures = results.filter((item) => !item.pass);
if (failures.length) {
  console.error(`\n${failures.length} contrast pair(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`\nAll ${results.length} contrast pairs passed.`);
}
