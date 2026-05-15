import { PLACE_IDS, BOOKING_END, BOOKING_START } from "./config.js";
import { activeBookings, availabilityByDate, availablePlaces } from "./availability.js";
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
  $("#availability").innerHTML = Object.entries(days).map(([date, state]) => {
    const tone = state.remaining === 0 ? "full" : state.remaining === PLACE_IDS.length ? "open" : "partial";
    const label = state.remaining === 0 ? "Full" : `${state.remaining} beds left`;
    return `<li data-availability="${tone}"><strong>${date}</strong><span>${label}</span></li>`;
  }).join("");
}

function bookingItem(booking, today) {
  const expired = compareDates(booking.endDate, today) < 0;
  return `
    <li${expired ? ` data-booking-state="expired"` : ""}>
      <strong>${booking.startDate} to ${booking.endDate}</strong>
      <span>${expired ? "Expired" : `${booking.places.length} beds booked`}</span>
      <button class="delete-booking" type="button" data-booking-id="${booking.id}">Delete</button>
    </li>
  `;
}

function renderBookings(bookings, today) {
  const visible = $("#showExpired").checked ? bookings : activeBookings(bookings, today);
  $("#bookings").innerHTML = bookings.length === 0
    ? "<li>No bookings yet.</li>"
    : visible.map((booking) => bookingItem(booking, today)).join("") || "<li>No active bookings.</li>";
}

function setMessage(message, type = "info") {
  $("#message").textContent = message;
  $("#message").dataset.type = type;
}

function renderConfirmation(booking) {
  $("#confirmation").hidden = false;
  $("#confirmation").innerHTML = `
    <strong>Booking confirmed</strong>
    <dl>
      <div><dt>Name</dt><dd>${booking.guestName}</dd></div>
      <div><dt>Period</dt><dd>${booking.startDate} to ${booking.endDate}</dd></div>
      <div><dt>Beds</dt><dd>${booking.places.join(", ")}</dd></div>
    </dl>
  `;
}

function syncDateBounds() {
  const start = $("#startDate").value || BOOKING_START;
  $("#endDate").min = start;
  if (compareDates($("#endDate").value, start) < 0) $("#endDate").value = start;
}

function todayIso() {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

async function refresh() {
  syncDateBounds();
  try {
    const today = todayIso();
    const bookings = await loadSharedBookings();
    const active = activeBookings(bookings, today);
    renderPlaces(active);
    renderAvailability(active);
    renderBookings(bookings, today);
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

  setMessage("Booking confirmed.", "success");
  renderConfirmation(result.booking);
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
  $("#showExpired").addEventListener("change", refresh);
  $("#startDate").addEventListener("change", refresh);
  $("#endDate").addEventListener("change", refresh);
  refresh();
}

if (typeof document !== "undefined") initBookingApp();
