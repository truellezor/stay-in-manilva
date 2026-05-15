import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { makeBooking } from "./booking.js";

export async function readBookings(file) {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function writeBookings(file, bookings) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${Date.now()}.tmp`;
  await writeFile(temp, `${JSON.stringify(bookings, null, 2)}\n`);
  await rename(temp, file);
}

export async function createStoredBooking(input, file, now = new Date()) {
  const bookings = await readBookings(file);
  const result = makeBooking(input, bookings, now);

  if (!result.ok) return result;

  const nextBookings = [...bookings, result.booking];
  await writeBookings(file, nextBookings);
  return { ok: true, booking: result.booking, bookings: nextBookings };
}
