import test from "node:test";
import assert from "node:assert/strict";
import { appendBooking, clearBookings, loadBookings, saveBookings } from "../src/storage.js";

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
}

test("loads empty bookings when storage is empty or broken", () => {
  const storage = memoryStorage();
  assert.deepEqual(loadBookings(storage), []);
  storage.setItem("stay-in-manilva-bookings", "{");
  assert.deepEqual(loadBookings(storage), []);
});

test("saves, appends, and clears bookings", () => {
  const storage = memoryStorage();
  const booking = { id: "1", guestName: "Ana", places: [1] };
  saveBookings([booking], storage);
  assert.deepEqual(loadBookings(storage), [booking]);
  appendBooking({ id: "2", guestName: "Mira", places: [2] }, storage);
  assert.equal(loadBookings(storage).length, 2);
  clearBookings(storage);
  assert.deepEqual(loadBookings(storage), []);
});
