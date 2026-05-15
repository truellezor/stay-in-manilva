import { makeBooking } from "./booking.js";

function supabaseConfig() {
  const config = globalThis.STAY_IN_MANILVA_SUPABASE;
  if (!config?.url || !config?.anonKey) throw new Error("Supabase is not configured.");
  return config;
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
  return loadSupabaseBookings();
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
  return saveSupabaseBooking(input);
}

export async function deleteSharedBooking(id) {
  await requestSupabase(`bookings?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  return { ok: true, errors: [] };
}
