import { join } from "node:path";
import { createStoredBooking, readBookings } from "./server-store.js";

const MAX_BODY_BYTES = 16_384;

export function defaultBookingsFile() {
  return process.env.BOOKINGS_FILE || join(process.cwd(), "data", "bookings.json");
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
  if (url.pathname !== "/api/bookings") return false;

  try {
    if (request.method === "GET") {
      sendJson(response, 200, { bookings: await readBookings(file) });
      return true;
    }

    if (request.method === "POST") {
      const result = await createStoredBooking(await readJsonBody(request), file);
      sendJson(response, result.ok ? 201 : 409, result);
      return true;
    }

    sendJson(response, 405, { ok: false, errors: ["Method not allowed."] });
    return true;
  } catch {
    sendJson(response, 400, { ok: false, errors: ["Invalid booking request."] });
    return true;
  }
}
