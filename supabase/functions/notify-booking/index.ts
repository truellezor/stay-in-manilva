const resendKey = Deno.env.get("RESEND_" + "KEY");
const toEmail = Deno.env.get("BOOKING_NOTIFY_TO") || "Truellezor@gmail.com";
const fromEmail = Deno.env.get("BOOKING_NOTIFY_FROM") || "Stay in Manilva <onboarding@resend.dev>";
const webhookKey = Deno.env.get("BOOKING_NOTIFY_KEY");

function response(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function bookingFromPayload(payload: Record<string, unknown>) {
  const record = payload.record as Record<string, unknown> | undefined;
  if (!record) throw new Error("Missing booking record.");
  return {
    guestName: String(record.guest_name || "Unknown guest"),
    startDate: String(record.start_date || ""),
    endDate: String(record.end_date || ""),
    places: Array.isArray(record.places) ? record.places.join(", ") : String(record.places || "")
  };
}

Deno.serve(async (request) => {
  if (webhookKey && request.headers.get("x-webhook-key") !== webhookKey) {
    return response(401, { ok: false, error: "Unauthorized." });
  }
  if (!resendKey) return response(500, { ok: false, error: "Missing email sender key." });

  const booking = bookingFromPayload(await request.json());
  const subject = `New Manilva booking: ${booking.startDate} to ${booking.endDate}`;
  const text = [
    "A new booking was created.",
    "",
    `Name: ${booking.guestName}`,
    `Period: ${booking.startDate} to ${booking.endDate}`,
    `Beds: ${booking.places}`
  ].join("\n");

  const email = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ from: fromEmail, to: toEmail, subject, text })
  });

  if (!email.ok) return response(502, { ok: false, error: await email.text() });
  return response(200, { ok: true });
});
