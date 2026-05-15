# Stay in Manilva with Sandu

Private booking app for friends staying in the Manilva apartment from
2026-05-15 through 2026-06-30.

Repository: https://github.com/truellezor/stay-in-manilva

## Rules

- Guests must enter a name.
- Guests select a start date, end date, and one or more beds.
- A booking can reserve at most 5 beds.
- A bed cannot be double-booked for overlapping dates.
- Shared bookings are saved through `POST /api/bookings` when the Node server is used.
- Source files must stay at or below 200 lines.
- Unit coverage must stay at or above 90%.

## Commands

```bash
node --test test/*.test.js
node --test --experimental-test-coverage --test-coverage-lines=90 --test-coverage-branches=90 --test-coverage-functions=90 test/*.test.js
node scripts/check-lines.js
node scripts/verify.js
node server.js
```

Open `http://localhost:4173` after `node server.js`.

The server stores bookings in `data/bookings.json` by default. Override this
with `BOOKINGS_FILE=/path/to/bookings.json` for production.

## Architecture

- `src/config.js`: booking window and capacity constants.
- `src/dates.js`: ISO date parsing, ranges, and overlap logic.
- `src/validation.js`: guest and booking input validation.
- `src/availability.js`: capacity and available-place calculation.
- `src/booking.js`: booking creation and conflict checks.
- `src/storage.js`: browser local storage adapter for the first version.
- `src/shared-storage.js`: browser adapter for server API with local fallback.
- `src/server-store.js`: server-side JSON persistence.
- `src/server-api.js`: HTTP API for shared bookings.
- `src/ui.js`: browser interaction layer.

Public deployment still needs a Node-capable host. GitHub Pages can serve the
static UI but cannot run the booking API.
