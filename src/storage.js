const KEY = "stay-in-manilva-bookings";

export function loadBookings(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookings(bookings, storage = window.localStorage) {
  storage.setItem(KEY, JSON.stringify(bookings));
}

export function appendBooking(booking, storage = window.localStorage) {
  const bookings = [...loadBookings(storage), booking];
  saveBookings(bookings, storage);
  return bookings;
}

export function clearBookings(storage = window.localStorage) {
  storage.removeItem(KEY);
}
