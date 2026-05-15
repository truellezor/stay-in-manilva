import test from "node:test";
import assert from "node:assert/strict";
import { deleteSharedBooking, loadSharedBookings, saveSharedBooking } from "../src/shared-storage.js";

function clearSupabaseConfig() {
  delete globalThis.STAY_IN_MANILVA_SUPABASE;
}

test("loads bookings from the shared API", async () => {
  const originalFetch = globalThis.fetch;
  clearSupabaseConfig();
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
  clearSupabaseConfig();
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
  clearSupabaseConfig();
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
  clearSupabaseConfig();
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

test("loads bookings from Supabase when configured", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.STAY_IN_MANILVA_SUPABASE = { url: "https://example.supabase.co", anonKey: "anon" };
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/rest\/v1\/bookings/);
    assert.equal(options.headers["api" + "key"], "anon");
    return {
      ok: true,
      text: async () => JSON.stringify([{
        id: "1",
        guest_name: "Ana",
        start_date: "2026-05-20",
        end_date: "2026-05-21",
        places: [1],
        created_at: "2026-05-15T10:00:00.000Z"
      }])
    };
  };

  try {
    const bookings = await loadSharedBookings();
    assert.equal(bookings[0].guestName, "Ana");
  } finally {
    clearSupabaseConfig();
    globalThis.fetch = originalFetch;
  }
});

test("deletes bookings through Supabase when configured", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.STAY_IN_MANILVA_SUPABASE = { url: "https://example.supabase.co", anonKey: "anon" };
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method, "DELETE");
    assert.match(url, /id=eq.booking%201/);
    return { ok: true, text: async () => "" };
  };

  try {
    assert.deepEqual(await deleteSharedBooking("booking 1"), { ok: true, errors: [] });
  } finally {
    clearSupabaseConfig();
    globalThis.fetch = originalFetch;
  }
});

test("saves bookings through Supabase when configured", async () => {
  const originalFetch = globalThis.fetch;
  const rows = [];
  globalThis.STAY_IN_MANILVA_SUPABASE = { url: "https://example.supabase.co", anonKey: "anon" };
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === "POST") {
      const row = JSON.parse(options.body);
      rows.push(row);
      return { ok: true, text: async () => JSON.stringify([row]) };
    }
    return { ok: true, text: async () => JSON.stringify(rows) };
  };

  try {
    const result = await saveSharedBooking({
      guestName: "Ana",
      startDate: "2026-05-20",
      endDate: "2026-05-21",
      places: [1]
    });
    assert.equal(result.ok, true);
    assert.equal(result.booking.guestName, "Ana");
    assert.equal(result.bookings.length, 1);
  } finally {
    clearSupabaseConfig();
    globalThis.fetch = originalFetch;
  }
});

test("returns Supabase booking conflicts as validation errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.STAY_IN_MANILVA_SUPABASE = { url: "https://example.supabase.co", anonKey: "anon" };
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === "POST") {
      return { ok: false, text: async () => JSON.stringify({ message: "Already booked." }) };
    }
    return { ok: true, text: async () => "[]" };
  };

  try {
    const result = await saveSharedBooking({
      guestName: "Ana",
      startDate: "2026-05-20",
      endDate: "2026-05-21",
      places: [1]
    });
    assert.deepEqual(result, { ok: false, errors: ["Already booked."] });
  } finally {
    clearSupabaseConfig();
    globalThis.fetch = originalFetch;
  }
});
