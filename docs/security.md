# Security Notes

## Current Implementation

- Runs as a static browser app backed by Supabase Free.
- Uses the public Supabase anon key; no private service key is stored.
- Guest names are trimmed and length-limited before saving.
- Booking dates and bed IDs are validated before writes.
- Double-booking prevention runs in browser code and in a Supabase trigger.
- Row Level Security allows public read, insert, and delete for bookings.

## Risks Before Public Launch

- Anyone with the public URL can create and delete bookings.
- Admin views must be authenticated before exposing all guest details.
- Guest names are personal data and should not be shown unnecessarily.
- Public writes may need rate limiting or a simple shared access code.

## Required Before Public URL

- Run `supabase/schema.sql` before sharing the public URL.
- Fill `config.public.js` with the Supabase URL and anon public key.
- Protect admin routes with authentication.
- Run dependency and static checks for the chosen stack.
- Run browser automation against the deployed URL.
