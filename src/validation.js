import {
  BOOKING_END,
  BOOKING_START,
  MAX_NAME_LENGTH,
  PLACE_IDS
} from "./config.js";
import { compareDates, isIsoDate, isWithinWindow } from "./dates.js";

export function cleanName(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ");
}

export function validateGuestName(name) {
  const cleaned = cleanName(name);
  if (!cleaned) return "Enter your name.";
  if (cleaned.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  return "";
}

export function normalizePlaces(places) {
  return [...new Set((places ?? []).map(Number))]
    .filter((place) => PLACE_IDS.includes(place))
    .sort((a, b) => a - b);
}

export function validateDates(startDate, endDate) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    return "Select a valid start and end date.";
  }
  if (compareDates(startDate, endDate) > 0) {
    return "End date must be on or after the start date.";
  }
  if (!isWithinWindow(startDate, BOOKING_START, BOOKING_END) ||
    !isWithinWindow(endDate, BOOKING_START, BOOKING_END)) {
    return `Dates must be between ${BOOKING_START} and ${BOOKING_END}.`;
  }
  return "";
}

export function validatePlaces(places) {
  const normalized = normalizePlaces(places);
  if (normalized.length === 0) return "Select at least one place.";
  if (normalized.length > PLACE_IDS.length) {
    return `Select no more than ${PLACE_IDS.length} places.`;
  }
  return "";
}
