# Stay in Manilva with Sandu

Private booking app for friends staying in the Manilva apartment from
2026-05-15 through 2026-06-30.

Repository: https://github.com/truellezor/stay-in-manilva

## Rules

- Guests must enter a name.
- Guests select a start date, end date, and one or more beds.
- A booking can reserve at most 5 beds.
- A bed cannot be double-booked for overlapping dates.
- Shared bookings are saved in Supabase Free.
- Source files should stay focused: app code uses a 200-line guard, while tests, HTML, CSS, docs, and SQL have roomier limits.
- Unit coverage must stay at or above 90%.

## Commands

Requires Node.js 20 or newer for local checks.

```bash
node --test test/*.test.js
node --test --experimental-test-coverage --test-coverage-lines=90 --test-coverage-branches=90 --test-coverage-functions=90 test/*.test.js
node scripts/check-lines.js
node scripts/verify.js
node server.js
npm run test:e2e
npm run verify:release
```

Open `http://localhost:4173` after `node server.js`. Local booking writes need
`config.public.js` to contain Supabase credentials.

Install browser automation once before running E2E tests:

```bash
npm install
npm run test:e2e:install
```

`npm run test:e2e` runs desktop and mobile booking flows against localhost.
Set `E2E_BASE_URL=https://your-public-url` to run the same suite against a
public deployment. Supabase calls are mocked in the browser so E2E runs do not
create real bookings or send email notifications.

## Public deployment

The production path is Supabase Free plus any static host. The browser uses
Supabase directly when `config.public.js` contains a project URL and anon key.

### Supabase Free setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Go to Project Settings, API.
4. Copy Project URL and anon public key.
5. Update `config.public.js`:

```js
window.STAY_IN_MANILVA_SUPABASE = {
  url: "https://your-project.supabase.co",
  anonKey: "your-public-anon-key"
};
```

The anon key is designed to be public. Access is controlled by the Row Level
Security policies in `supabase/schema.sql`. Because this app is public and has
no login, anyone with the link can create and delete bookings.

### Email notifications

New bookings can send an email through the `notify-booking` Supabase Edge
Function. It sends the guest name, booking period, and beds to
`Truellezor@gmail.com`.

1. Create a Resend API key.
2. Deploy `supabase/functions/notify-booking`.
3. Set these Supabase Edge Function secrets:

```bash
RESEND_KEY=your-resend-api-key
BOOKING_NOTIFY_TO=Truellezor@gmail.com
BOOKING_NOTIFY_FROM=Stay in Manilva <onboarding@resend.dev>
BOOKING_NOTIFY_KEY=choose-a-long-random-value
```

4. Replace `replace-with-your-webhook-key` in
   `supabase/booking-email-webhook.sql` with the same random value.
5. Run `supabase/booking-email-webhook.sql` in Supabase SQL Editor.

## Architecture

- `src/config.js`: booking window and capacity constants.
- `src/dates.js`: ISO date parsing, ranges, and overlap logic.
- `src/validation.js`: guest and booking input validation.
- `src/availability.js`: capacity and available-place calculation.
- `src/booking.js`: booking creation and conflict checks.
- `src/shared-storage.js`: browser adapter for Supabase REST.
- `src/ui.js`: browser interaction layer.
