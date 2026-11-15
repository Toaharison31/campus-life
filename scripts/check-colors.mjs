// Repère les couleurs codées en dur à la place des jetons de thème.
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const sourceRoots = [resolve("src")];
const configFile = resolve("tailwind.config.js");
const tokenFile = resolve("src/styles/tokens.css");
const extensions = new Set([".css", ".js", ".jsx", ".ts", ".tsx"]);
const paletteClass =
  /\b(?:text|bg|border|ring|fill|stroke)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?\b/g;
const hardcodedColor =
  /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(|(?:^|[;{]\s*)(?:color|background(?:-color)?|border(?:-[\w-]+)?|outline(?:-[\w-]+)?|fill|stroke)\s*:\s*(?:white|black|red|blue|green|gray|grey)\b/gim;

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return extensions.has(entry.name.slice(entry.name.lastIndexOf(".")))
        ? [path]
        : [];
    }),
  );
  return nested.flat();
}

const violations = [];
const files = [
  ...(await Promise.all(sourceRoots.map(sourceFiles))).flat(),
  configFile,
];
for (const file of files) {
  if (file === tokenFile) continue;
  const source = await readFile(file, "utf8");
  for (const [pattern, type] of [
    [hardcodedColor, "literal color"],
    [paletteClass, "raw palette utility"],
  ]) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split("\n").length;
      violations.push({
        file: relative(process.cwd(), file).split(sep).join("/"),
        line,
        type,
        value: match[0].trim(),
      });
    }
  }
}

if (violations.length) {
  console.error("Color tokens are required outside src/styles/tokens.css:");
  for (const item of violations) {
    console.error(`${item.file}:${item.line} ${item.type}: ${item.value}`);
  }
  process.exitCode = 1;
} else {
  console.log("Color check passed: no literal colors or raw palette classes.");
}
