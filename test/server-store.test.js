import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createStoredBooking, readBookings, writeBookings } from "../src/server-store.js";

const now = new Date("2026-05-15T10:00:00.000Z");

async function tempFile() {
  const dir = await mkdtemp(join(tmpdir(), "manilva-"));
  await mkdir(dir, { recursive: true });
  return { dir, file: join(dir, "bookings.json") };
}

test("reads empty booking file when missing", async () => {
  const { dir, file } = await tempFile();
  try {
    assert.deepEqual(await readBookings(file), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("writes and reads bookings", async () => {
  const { dir, file } = await tempFile();
  try {
    await writeBookings(file, [{ id: "1", places: [1] }]);
    assert.deepEqual(await readBookings(file), [{ id: "1", places: [1] }]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("creates stored bookings and blocks conflicts", async () => {
  const { dir, file } = await tempFile();
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
