import test from "node:test";
import assert from "node:assert/strict";
import { cleanName, normalizePlaces, validateDates, validateGuestName, validatePlaces } from "../src/validation.js";

test("cleans and validates guest names", () => {
  assert.equal(cleanName("  Ana   Maria  "), "Ana Maria");
  assert.equal(validateGuestName("Ana"), "");
  assert.equal(validateGuestName(""), "Enter your name.");
  assert.match(validateGuestName("x".repeat(81)), /80 characters/);
});

test("normalizes and validates places", () => {
  assert.deepEqual(normalizePlaces([2, "1", 2, 8]), [1, 2]);
  assert.equal(validatePlaces([1]), "");
  assert.equal(validatePlaces([]), "Select at least one place.");
});

test("validates date selections", () => {
  assert.equal(validateDates("2026-05-15", "2026-06-30"), "");
  assert.match(validateDates("2026-06-30", "2026-05-15"), /End date/);
  assert.match(validateDates("2026-05-14", "2026-05-15"), /between/);
  assert.match(validateDates("bad", "2026-05-15"), /valid/);
});
