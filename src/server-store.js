import { mkdir } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { dirname } from "node:path";
import { makeBooking } from "./booking.js";

function openDatabase(file) {
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      guestName TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS booking_places (
      bookingId TEXT NOT NULL,
      place INTEGER NOT NULL,
      PRIMARY KEY (bookingId, place),
      FOREIGN KEY (bookingId) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `);
  return db;
}

function rowToBooking(row) {
  return {
    id: row.id,
    guestName: row.guestName,
    startDate: row.startDate,
    endDate: row.endDate,
    places: JSON.parse(row.places),
    createdAt: row.createdAt
  };
}

export async function readBookings(file) {
  await mkdir(dirname(file), { recursive: true });
  const db = openDatabase(file);
  try {
    const rows = db.prepare(`
      SELECT b.*, json_group_array(bp.place) AS places
      FROM bookings b
      JOIN booking_places bp ON bp.bookingId = b.id
      GROUP BY b.id
      ORDER BY b.startDate, b.createdAt
    `).all();
    return rows.map(rowToBooking);
  } finally {
    db.close();
  }
}

function insertBooking(db, booking) {
  db.prepare(`
    INSERT INTO bookings (id, guestName, startDate, endDate, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(booking.id, booking.guestName, booking.startDate, booking.endDate, booking.createdAt);

  const insertPlace = db.prepare("INSERT INTO booking_places (bookingId, place) VALUES (?, ?)");
  for (const place of booking.places) insertPlace.run(booking.id, place);
}

export async function createStoredBooking(input, file, now = new Date()) {
  await mkdir(dirname(file), { recursive: true });
  const db = openDatabase(file);
  try {
    db.exec("BEGIN IMMEDIATE");
    const existing = db.prepare(`
      SELECT b.*, json_group_array(bp.place) AS places
      FROM bookings b
      JOIN booking_places bp ON bp.bookingId = b.id
      GROUP BY b.id
    `).all().map(rowToBooking);
    const result = makeBooking(input, existing, now);

    if (!result.ok) {
      db.exec("ROLLBACK");
      return result;
    }

    insertBooking(db, result.booking);
    db.exec("COMMIT");
    return { ok: true, booking: result.booking, bookings: await readBookings(file) };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  } finally {
    db.close();
  }
}

export async function deleteStoredBooking(id, file) {
  await mkdir(dirname(file), { recursive: true });
  const db = openDatabase(file);
  try {
    db.exec("BEGIN IMMEDIATE");
    db.prepare("DELETE FROM booking_places WHERE bookingId = ?").run(id);
    const result = db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
    db.exec("COMMIT");
    return { ok: result.changes > 0 };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  } finally {
    db.close();
  }
}
