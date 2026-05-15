# Security Notes

## Current Implementation

- Runs with a Node booking API when deployed on a server.
- Falls back to local storage only when the API is unavailable.
- No secrets are required or stored.
- Guest names are trimmed and length-limited before saving.
- Booking dates and place IDs are validated before server writes.
- Double-booking prevention runs before each server save.

## Risks Before Public Launch

- SQLite storage is simple and durable for a single Node server.
- High traffic or multiple server instances need a database with atomic writes.
- The deployed host must keep the SQLite file on persistent disk.
- Admin views must be authenticated before exposing all guest details.
- Guest names are personal data and should not be shown unnecessarily.
- Public write endpoints need rate limiting or abuse protection.

## Required Before Public URL

- Move from SQLite to a managed database before multi-instance scaling.
- Protect admin routes with authentication.
- Run dependency and static checks for the chosen stack.
- Run browser automation against the deployed URL.
