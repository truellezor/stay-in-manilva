import test from "node:test";
import assert from "node:assert/strict";
import { dateRange, isIsoDate, isWithinWindow, rangesOverlap } from "../src/dates.js";

test("validates ISO dates strictly", () => {
  assert.equal(isIsoDate("2026-05-15"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("15-05-2026"), false);
});

test("builds inclusive date ranges", () => {
  assert.deepEqual(dateRange("2026-05-15", "2026-05-17"), [
    "2026-05-15",
    "2026-05-16",
    "2026-05-17"
  ]);
  assert.deepEqual(dateRange("bad", "2026-05-17"), []);
});

test("detects booking window inclusion", () => {
  assert.equal(isWithinWindow("2026-05-15", "2026-05-15", "2026-06-30"), true);
  assert.equal(isWithinWindow("2026-07-01", "2026-05-15", "2026-06-30"), false);
});

test("detects overlapping date ranges", () => {
  assert.equal(rangesOverlap("2026-05-15", "2026-05-20", "2026-05-20", "2026-05-21"), true);
  assert.equal(rangesOverlap("2026-05-15", "2026-05-19", "2026-05-20", "2026-05-21"), false);
});
