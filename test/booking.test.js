import test from "node:test";
import assert from "node:assert/strict";
import { activeBookings, availablePlaces, availabilityByDate, hasConflict } from "../src/availability.js";
import { makeBooking } from "../src/booking.js";

const now = new Date("2026-05-15T10:00:00.000Z");
const existing = [{
  id: "a",
  guestName: "Ana",
  startDate: "2026-05-20",
  endDate: "2026-05-22",
  places: [1, 2],
  createdAt: now.toISOString()
}];

test("creates a normalized booking", () => {
  const result = makeBooking({
    guestName: "  Alex   Pop ",
    startDate: "2026-05-23",
    endDate: "2026-05-24",
    places: [3, "3", 4]
  }, existing, now);

  assert.equal(result.ok, true);
  assert.equal(result.booking.guestName, "Alex Pop");
  assert.deepEqual(result.booking.places, [3, 4]);
  assert.equal(result.booking.createdAt, now.toISOString());
});

test("rejects invalid input", () => {
  const result = makeBooking({
    guestName: "",
    startDate: "2026-05-24",
    endDate: "2026-05-20",
    places: []
  }, [], now);

  assert.equal(result.ok, false);
  assert.equal(result.errors.length, 3);
});

test("blocks overlapping double bookings", () => {
  const result = makeBooking({
    guestName: "Mira",
    startDate: "2026-05-21",
    endDate: "2026-05-23",
    places: [2]
  }, existing, now);

  assert.equal(result.ok, false);
  assert.match(result.errors[0], /already booked/);
});

test("calculates available places for ranges", () => {
  assert.deepEqual(availablePlaces(existing, "2026-05-21", "2026-05-23"), [3, 4, 5]);
  assert.deepEqual(availablePlaces(existing, "2026-05-23", "2026-05-24"), [1, 2, 3, 4, 5]);
  assert.equal(hasConflict(existing, "2026-05-21", "2026-05-21", [1]), true);
});

test("summarizes availability by date", () => {
  const summary = availabilityByDate(existing, "2026-05-20", "2026-05-23");
  assert.equal(summary["2026-05-20"].remaining, 3);
  assert.equal(summary["2026-05-23"].remaining, 5);
});

test("filters bookings that ended before today", () => {
  const bookings = [
    { ...existing[0], id: "past", endDate: "2026-05-19" },
    { ...existing[0], id: "today", endDate: "2026-05-20" },
    { ...existing[0], id: "future", endDate: "2026-05-21" }
  ];

  assert.deepEqual(activeBookings(bookings, "2026-05-20").map((booking) => booking.id), [
    "today",
    "future"
  ]);
});
