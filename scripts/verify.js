import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const testFiles = readdirSync("test")
  .filter((file) => file.endsWith(".test.js"))
  .map((file) => join("test", file));

const steps = [
  ["node", ["scripts/check-lines.js"]],
  ["node", ["scripts/security-check.js"]],
  ["node", [
    "--test",
    "--experimental-test-coverage",
    "--test-coverage-lines=90",
    "--test-coverage-branches=90",
    "--test-coverage-functions=90",
    ...testFiles
  ]]
];

for (const [command, args] of steps) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
