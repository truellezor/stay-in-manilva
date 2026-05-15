import { makeBooking } from "./booking.js";
import { appendBooking, loadBookings } from "./storage.js";

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok && !body.errors) throw new Error("Request failed.");
  return body;
}

export async function loadSharedBookings() {
  try {
    const body = await requestJson("/api/bookings");
    return Array.isArray(body.bookings) ? body.bookings : [];
  } catch {
    return loadBookings();
  }
}

export async function saveSharedBooking(input, now = new Date()) {
  try {
    return await requestJson("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input)
    });
  } catch {
    const result = makeBooking(input, loadBookings(), now);
    if (result.ok) appendBooking(result.booking);
    return result;
  }
}
