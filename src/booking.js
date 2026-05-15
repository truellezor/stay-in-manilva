import { hasConflict } from "./availability.js";
import { validateDates, validateGuestName, validatePlaces } from "./validation.js";
import { cleanName, normalizePlaces } from "./validation.js";

export function makeBooking(input, existingBookings, now = new Date()) {
  const places = normalizePlaces(input.places);
  const errors = [
    validateGuestName(input.guestName),
    validateDates(input.startDate, input.endDate),
    validatePlaces(places)
  ].filter(Boolean);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (hasConflict(existingBookings, input.startDate, input.endDate, places)) {
    return {
      ok: false,
      errors: ["One or more selected places are already booked."]
    };
  }

  return {
    ok: true,
    booking: {
      id: crypto.randomUUID(),
      guestName: cleanName(input.guestName),
      startDate: input.startDate,
      endDate: input.endDate,
      places,
      createdAt: now.toISOString()
    }
  };
}
