import { PLACE_IDS } from "./config.js";
import { compareDates, dateRange, rangesOverlap } from "./dates.js";

export function activeBookings(bookings, today) {
  return bookings.filter((booking) => compareDates(booking.endDate, today) >= 0);
}

export function bookingsForRange(bookings, startDate, endDate) {
  return bookings.filter((booking) =>
    rangesOverlap(startDate, endDate, booking.startDate, booking.endDate)
  );
}

export function unavailablePlaces(bookings, startDate, endDate) {
  const places = new Set();

  for (const booking of bookingsForRange(bookings, startDate, endDate)) {
    for (const place of booking.places) places.add(place);
  }

  return [...places].sort((a, b) => a - b);
}

export function availablePlaces(bookings, startDate, endDate) {
  const unavailable = new Set(unavailablePlaces(bookings, startDate, endDate));
  return PLACE_IDS.filter((place) => !unavailable.has(place));
}

export function hasConflict(bookings, startDate, endDate, places) {
  const unavailable = new Set(unavailablePlaces(bookings, startDate, endDate));
  return places.some((place) => unavailable.has(place));
}

export function availabilityByDate(bookings, startDate, endDate) {
  return Object.fromEntries(dateRange(startDate, endDate).map((date) => {
    const available = availablePlaces(bookings, date, date);
    return [date, { available, remaining: available.length }];
  }));
}
