import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX_LINES = 200;
const ROOTS = ["src", "test", "scripts", "supabase", "server.js", "index.html", "styles.css"];
const EXTENSIONS = new Set([".js", ".ts", ".css", ".html", ".md", ".sql"]);
const failures = [];

function extension(path) {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot);
}

function visit(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const child of readdirSync(path)) visit(join(path, child));
    return;
  }
  if (!EXTENSIONS.has(extension(path))) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/).length;
  if (lines > MAX_LINES) failures.push(`${path}: ${lines} lines`);
}

for (const root of ROOTS) visit(root);

if (failures.length > 0) {
  console.error(`Files exceed ${MAX_LINES} lines:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`All checked files are ${MAX_LINES} lines or fewer.`);
