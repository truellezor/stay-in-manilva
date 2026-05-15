# Release Checklist

Run this checklist before publishing a public URL.

- `node scripts/verify.js` passes.
- `node scripts/security-check.js` passes.
- Unit coverage is at least 90% for lines, branches, and functions.
- No checked source file is over 200 lines.
- Browser booking flow passes locally on desktop and mobile.
- Browser booking flow passes against the public deployment URL.
- `supabase/schema.sql` has been run in the Supabase project.
- `supabase/booking-email-webhook.sql` has been run with the real webhook key.
- `notify-booking` Edge Function is deployed with Resend secrets.
- `config.public.js` contains the production Supabase URL and anon key.
- Production storage performs conflict checks in the Supabase trigger.
- Admin or owner views are authenticated before launch.
- Public views avoid exposing unnecessary guest details.
- Public URL opens from a normal browser session.
