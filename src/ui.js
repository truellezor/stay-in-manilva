import { PLACE_IDS, BOOKING_END, BOOKING_START } from "./config.js";
import { availabilityByDate, availablePlaces } from "./availability.js";
import { makeBooking } from "./booking.js";
import { appendBooking, loadBookings } from "./storage.js";

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
    return `<label><input type="checkbox" name="places" value="${place}" ${disabled}> Place ${place}</label>`;
  }).join("");
}

function renderAvailability(bookings) {
  const start = $("#startDate").value || BOOKING_START;
  const end = $("#endDate").value || start;
  const days = availabilityByDate(bookings, start, end);
  $("#availability").innerHTML = Object.entries(days).map(([date, state]) =>
    `<li><strong>${date}</strong><span>${state.remaining} places left</span></li>`
  ).join("");
}

function renderBookings(bookings) {
  $("#bookings").innerHTML = bookings.length === 0
    ? "<li>No bookings yet.</li>"
    : bookings.map((booking) =>
      `<li><strong>${booking.startDate} to ${booking.endDate}</strong><span>${booking.places.length} places booked</span></li>`
    ).join("");
}

function setMessage(message, type = "info") {
  $("#message").textContent = message;
  $("#message").dataset.type = type;
}

function refresh() {
  const bookings = loadBookings();
  renderPlaces(bookings);
  renderAvailability(bookings);
  renderBookings(bookings);
}

function submitBooking(event) {
  event.preventDefault();
  const bookings = loadBookings();
  const result = makeBooking({
    guestName: $("#guestName").value,
    startDate: $("#startDate").value,
    endDate: $("#endDate").value,
    places: placesFromForm()
  }, bookings);

  if (!result.ok) {
    setMessage(result.errors.join(" "), "error");
    return;
  }

  appendBooking(result.booking);
  setMessage(`Booked ${result.booking.places.length} place(s) for ${result.booking.guestName}.`, "success");
  event.target.reset();
  $("#startDate").value = BOOKING_START;
  $("#endDate").value = BOOKING_START;
  refresh();
}

export function initBookingApp() {
  $("#startDate").min = BOOKING_START;
  $("#startDate").max = BOOKING_END;
  $("#endDate").min = BOOKING_START;
  $("#endDate").max = BOOKING_END;
  $("#startDate").value = BOOKING_START;
  $("#endDate").value = BOOKING_START;
  $("#bookingForm").addEventListener("submit", submitBooking);
  $("#startDate").addEventListener("change", refresh);
  $("#endDate").addEventListener("change", refresh);
  refresh();
}

if (typeof document !== "undefined") initBookingApp();
