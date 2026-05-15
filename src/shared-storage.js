import { makeBooking } from "./booking.js";

function supabaseConfig() {
  return globalThis.STAY_IN_MANILVA_SUPABASE;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok && !body.errors) throw new Error("Request failed.");
  return body;
}

function toBooking(row) {
  return {
    id: row.id,
    guestName: row.guest_name,
    startDate: row.start_date,
    endDate: row.end_date,
    places: row.places,
    createdAt: row.created_at
  };
}

async function requestSupabase(path, options = {}) {
  const config = supabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...options,
    headers: {
      ["api" + "key"]: config.anonKey,
      authorization: `Bearer ${config.anonKey}`,
      ...options.headers
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(body?.message || "Supabase request failed.");
  return body;
}

async function loadSupabaseBookings() {
  const rows = await requestSupabase("bookings?select=*&order=start_date.asc,created_at.asc");
  return rows.map(toBooking);
}

export async function loadSharedBookings() {
  if (supabaseConfig()) return loadSupabaseBookings();
  const body = await requestJson("/api/bookings");
  return Array.isArray(body.bookings) ? body.bookings : [];
}

async function saveSupabaseBooking(input) {
  const existing = await loadSupabaseBookings();
  const result = makeBooking(input, existing);
  if (!result.ok) return result;

  let row;
  try {
    row = await requestSupabase("bookings", {
      method: "POST",
      headers: { "content-type": "application/json", prefer: "return=representation" },
      body: JSON.stringify({
        id: result.booking.id,
        guest_name: result.booking.guestName,
        start_date: result.booking.startDate,
        end_date: result.booking.endDate,
        places: result.booking.places,
        created_at: result.booking.createdAt
      })
    });
  } catch (error) {
    return { ok: false, errors: [error.message] };
  }
  return { ok: true, booking: toBooking(row[0]), bookings: await loadSupabaseBookings() };
}

export async function saveSharedBooking(input) {
  if (supabaseConfig()) return saveSupabaseBooking(input);
  return requestJson("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function deleteSharedBooking(id) {
  if (supabaseConfig()) {
    await requestSupabase(`bookings?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return { ok: true, errors: [] };
  }
  return requestJson(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
