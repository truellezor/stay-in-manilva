import { join } from "node:path";
import { createStoredBooking, deleteStoredBooking, readBookings } from "./server-store.js";

const MAX_BODY_BYTES = 16_384;

export function defaultBookingsFile() {
  return process.env.BOOKINGS_DB || join(process.cwd(), "data", "bookings.sqlite");
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json",
    "x-content-type-options": "nosniff"
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

export async function handleApiRequest(request, response, file = defaultBookingsFile()) {
  const url = new URL(request.url, "http://localhost");
  if (!url.pathname.startsWith("/api/bookings")) return false;

  try {
    if (request.method === "GET" && url.pathname === "/api/bookings") {
      sendJson(response, 200, { bookings: await readBookings(file) });
      return true;
    }

    if (request.method === "POST" && url.pathname === "/api/bookings") {
      const result = await createStoredBooking(await readJsonBody(request), file);
      sendJson(response, result.ok ? 201 : 409, result);
      return true;
    }

    if (request.method === "DELETE") {
      const id = decodeURIComponent(url.pathname.replace("/api/bookings/", ""));
      const result = await deleteStoredBooking(id, file);
      sendJson(response, result.ok ? 200 : 404, {
        ...result,
        errors: result.ok ? [] : ["Booking not found."]
      });
      return true;
    }

    sendJson(response, 405, { ok: false, errors: ["Method not allowed."] });
    return true;
  } catch {
    sendJson(response, 400, { ok: false, errors: ["Invalid booking request."] });
    return true;
  }
}
