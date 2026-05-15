async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok && !body.errors) throw new Error("Request failed.");
  return body;
}

export async function loadSharedBookings() {
  const body = await requestJson("/api/bookings");
  return Array.isArray(body.bookings) ? body.bookings : [];
}

export async function saveSharedBooking(input) {
  return requestJson("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input)
  });
}

export async function deleteSharedBooking(id) {
  return requestJson(`/api/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}
