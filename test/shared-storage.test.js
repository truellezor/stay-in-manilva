import test from "node:test";
import assert from "node:assert/strict";
import { deleteSharedBooking, loadSharedBookings, saveSharedBooking } from "../src/shared-storage.js";

test("loads bookings from the shared API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ bookings: [{ id: "1" }] })
  });

  try {
    assert.deepEqual(await loadSharedBookings(), [{ id: "1" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not fall back to local storage when API is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };

  try {
    await assert.rejects(() => loadSharedBookings(), /offline/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("saves bookings through the shared API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => ({
    ok: true,
    json: async () => ({ ok: true, url, method: options.method })
  });

  try {
    const result = await saveSharedBooking({ guestName: "Ana" });
    assert.equal(result.ok, true);
    assert.equal(result.url, "/api/bookings");
    assert.equal(result.method, "POST");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("deletes bookings through the shared API", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => ({
    ok: true,
    json: async () => ({ ok: true, url, method: options.method })
  });

  try {
    const result = await deleteSharedBooking("booking 1");
    assert.equal(result.ok, true);
    assert.equal(result.url, "/api/bookings/booking%201");
    assert.equal(result.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
