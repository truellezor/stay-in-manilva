import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_MAX_LINES = 200;
const TEST_MAX_LINES = 300;
const MARKUP_MAX_LINES = 400;
const ROOTS = [
  "src",
  "test",
  "e2e",
  "scripts",
  "supabase",
  "server.js",
  "index.html",
  "styles.css",
  "playwright.config.js"
];
const EXTENSIONS = new Set([".js", ".ts", ".css", ".html", ".md", ".sql"]);
const failures = [];

function extension(path) {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot);
}

function maxLinesFor(path) {
  const ext = extension(path);
  if (/^(test|e2e)[\\/]/.test(path)) return TEST_MAX_LINES;
  if ([".css", ".html", ".md", ".sql"].includes(ext)) return MARKUP_MAX_LINES;
  return DEFAULT_MAX_LINES;
}

function visit(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const child of readdirSync(path)) visit(join(path, child));
    return;
  }
  if (!EXTENSIONS.has(extension(path))) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/).length;
  const maxLines = maxLinesFor(path);
  if (lines > maxLines) failures.push(`${path}: ${lines}/${maxLines} lines`);
}

for (const root of ROOTS) visit(root);

if (failures.length > 0) {
  console.error(`Files exceed their line limits:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("All checked files are within their line limits.");
