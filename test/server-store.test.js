import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createStoredBooking, readBookings } from "../src/server-store.js";

const now = new Date("2026-05-15T10:00:00.000Z");

async function tempDb() {
  const dir = await mkdtemp(join(tmpdir(), "manilva-"));
  return { dir, file: join(dir, "bookings.sqlite") };
}

test("reads empty bookings from a new SQLite database", async () => {
  const { dir, file } = await tempDb();
  try {
    assert.deepEqual(await readBookings(file), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("creates and reads a stored booking", async () => {
  const { dir, file } = await tempDb();
  try {
    await createStoredBooking({
      guestName: "Ana",
      startDate: "2026-05-20",
      endDate: "2026-05-22",
      places: [1, 2]
    }, file, now);

    const bookings = await readBookings(file);
    assert.equal(bookings.length, 1);
    assert.equal(bookings[0].guestName, "Ana");
    assert.deepEqual(bookings[0].places, [1, 2]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("blocks conflicting bookings without saving failed attempts", async () => {
  const { dir, file } = await tempDb();
  try {
    const first = await createStoredBooking({
      guestName: "Ana",
      startDate: "2026-05-20",
      endDate: "2026-05-22",
      places: [1]
    }, file, now);
    const second = await createStoredBooking({
      guestName: "Mira",
      startDate: "2026-05-21",
      endDate: "2026-05-23",
      places: [1]
    }, file, now);

    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
    assert.equal((await readBookings(file)).length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
