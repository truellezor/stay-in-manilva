import { PLACE_IDS, BOOKING_END, BOOKING_START } from "./config.js";
import { availabilityByDate, availablePlaces } from "./availability.js";
import { compareDates } from "./dates.js";
import { deleteSharedBooking, loadSharedBookings, saveSharedBooking } from "./shared-storage.js";

const $ = (selector) => document.querySelector(selector);

function placesFromForm() {
  return [...document.querySelectorAll("[name='places']:checked")]
    .map((input) => Number(input.value));
}

function renderPlaces(bookings) {
  const start = $("#startDate").value || BOOKING_START;
  const end = $("#endDate").value || start;
  const available = new Set(availablePlaces(bookings, start, end));
  $("#places").innerHTML = PLACE_IDS.map((place) => {
    const disabled = available.has(place) ? "" : "disabled";
    return `<label><input type="checkbox" name="places" value="${place}" ${disabled}> Bed ${place}</label>`;
  }).join("");
}

function renderAvailability(bookings) {
  const start = $("#startDate").value || BOOKING_START;
  const end = $("#endDate").value || start;
  const days = availabilityByDate(bookings, start, end);
  $("#availability").innerHTML = Object.entries(days).map(([date, state]) =>
    `<li><strong>${date}</strong><span>${state.remaining} beds left</span></li>`
  ).join("");
}

function bookingItem(booking) {
  return `
    <li>
      <strong>${booking.startDate} to ${booking.endDate}</strong>
      <span>${booking.places.length} beds booked</span>
      <button class="delete-booking" type="button" data-booking-id="${booking.id}">Delete</button>
    </li>
  `;
}

function renderBookings(bookings) {
  $("#bookings").innerHTML = bookings.length === 0
    ? "<li>No bookings yet.</li>"
    : bookings.map(bookingItem).join("");
}

function setMessage(message, type = "info") {
  $("#message").textContent = message;
  $("#message").dataset.type = type;
}

function syncDateBounds() {
  const start = $("#startDate").value || BOOKING_START;
  $("#endDate").min = start;
  if (compareDates($("#endDate").value, start) < 0) $("#endDate").value = start;
}

async function refresh() {
  syncDateBounds();
  try {
    const bookings = await loadSharedBookings();
    renderPlaces(bookings);
    renderAvailability(bookings);
    renderBookings(bookings);
  } catch {
    renderPlaces([]);
    renderAvailability([]);
    renderBookings([]);
    setMessage("Supabase storage is not configured yet.", "error");
  }
}

async function submitBooking(event) {
  event.preventDefault();
  let result;
  try {
    result = await saveSharedBooking({
      guestName: $("#guestName").value,
      startDate: $("#startDate").value,
      endDate: $("#endDate").value,
      places: placesFromForm()
    });
  } catch {
    setMessage("Could not save because Supabase is unavailable.", "error");
    return;
  }

  if (!result.ok) {
    setMessage(result.errors.join(" "), "error");
    return;
  }

  setMessage(`Booked ${result.booking.places.length} bed(s) for ${result.booking.guestName}.`, "success");
  event.target.reset();
  $("#startDate").value = BOOKING_START;
  $("#endDate").value = BOOKING_START;
  syncDateBounds();
  await refresh();
}

async function deleteBooking(event) {
  const button = event.target.closest(".delete-booking");
  if (!button) return;

  try {
    const result = await deleteSharedBooking(button.dataset.bookingId);
    setMessage(result.ok ? "Booking deleted." : result.errors.join(" "), result.ok ? "success" : "error");
    await refresh();
  } catch {
    setMessage("Could not delete because Supabase is unavailable.", "error");
  }
}

export function initBookingApp() {
  $("#startDate").min = BOOKING_START;
  $("#startDate").max = BOOKING_END;
  $("#endDate").max = BOOKING_END;
  $("#startDate").value = BOOKING_START;
  $("#endDate").value = BOOKING_START;
  syncDateBounds();
  $("#bookingForm").addEventListener("submit", submitBooking);
  $("#bookings").addEventListener("click", deleteBooking);
  $("#startDate").addEventListener("change", refresh);
  $("#endDate").addEventListener("change", refresh);
  refresh();
}

if (typeof document !== "undefined") initBookingApp();
