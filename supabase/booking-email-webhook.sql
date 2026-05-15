create extension if not exists pg_net with schema extensions;

drop trigger if exists notify_booking_email on public.bookings;

create trigger notify_booking_email
after insert on public.bookings
for each row
execute function supabase_functions.http_request(
  'https://pmozhxfnhbsitwkqtyzt.supabase.co/functions/v1/notify-booking',
  'POST',
  '{"Content-Type":"application/json","x-webhook-key":"manilva-email-9Kq7vPz4nR2sL8wX"}',
  '{}',
  '1000'
);
