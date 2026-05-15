# Security Notes

## Current Implementation

- Runs as a static browser app with local storage for the first local version.
- No secrets are required or stored.
- Guest names are trimmed and length-limited before saving.
- Booking dates and place IDs are validated before writes.
- Double-booking prevention runs before each save.

## Risks Before Public Launch

- Local storage is per browser and does not work as shared production storage.
- A public app needs server-side conflict checks, not only client-side checks.
- Admin views must be authenticated before exposing all guest details.
- Guest names are personal data and should not be shown unnecessarily.
- Public write endpoints need rate limiting or abuse protection.

## Required Before Public URL

- Choose production storage with atomic writes.
- Move booking validation and conflict checks server-side.
- Protect admin routes with authentication.
- Run dependency and static checks for the chosen stack.
- Run browser automation against the deployed URL.
