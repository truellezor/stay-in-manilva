# Release Checklist

Run this checklist before publishing a public URL.

- `node scripts/verify.js` passes.
- `node scripts/security-check.js` passes.
- Unit coverage is at least 90% for lines, branches, and functions.
- Checked files stay within their type-specific line limits.
- Browser booking flow passes locally on desktop and mobile.
- Browser booking flow passes against the public deployment URL.
- `npm run verify:release` passes before sharing the URL.
- `supabase/schema.sql` has been run in the Supabase project.
- `supabase/booking-email-webhook.sql` has been run with the real webhook key.
- `notify-booking` Edge Function is deployed with Resend secrets.
- `config.public.js` contains the production Supabase URL and anon key.
- Production storage performs conflict checks in the Supabase trigger.
- Admin or owner views are authenticated before launch.
- Public views avoid exposing unnecessary guest details.
- Public URL opens from a normal browser session.
