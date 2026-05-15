import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SEARCH_ROOTS = ["src", "scripts", "server.js", "index.html"];
const SECRET_PATTERNS = [/api[_-]?key/i, /secret/i, /password/i, /token/i];
const findings = [];
const EXCLUDED = new Set(["scripts\\security-check.js", "scripts/security-check.js"]);

function visit(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const child of readdirSync(path)) visit(join(path, child));
    return;
  }
  if (EXCLUDED.has(path)) return;

  const content = readFileSync(path, "utf8");
  SECRET_PATTERNS.forEach((pattern) => {
    if (pattern.test(content)) findings.push(`${path}: matched ${pattern}`);
  });
}

SEARCH_ROOTS.forEach(visit);

if (findings.length > 0) {
  console.error(`Potential secret exposure:\n${findings.join("\n")}`);
  process.exit(1);
}

console.log("No obvious secret markers found.");
