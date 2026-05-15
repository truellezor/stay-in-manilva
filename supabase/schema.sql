create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null check (char_length(guest_name) between 1 and 80),
  start_date date not null,
  end_date date not null,
  places integer[] not null check (
    cardinality(places) between 1 and 5
    and places <@ array[1, 2, 3, 4, 5]
  ),
  created_at timestamptz not null default now(),
  check (start_date <= end_date),
  check (start_date >= date '2026-05-15' and end_date <= date '2026-06-30')
);

create or replace function public.reject_booking_conflicts()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.bookings existing
    where existing.id <> new.id
      and existing.start_date <= new.end_date
      and new.start_date <= existing.end_date
      and existing.places && new.places
  ) then
    raise exception 'One or more selected beds are already booked.';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_booking_conflicts on public.bookings;
create trigger reject_booking_conflicts
before insert or update on public.bookings
for each row execute function public.reject_booking_conflicts();

alter table public.bookings enable row level security;

drop policy if exists "Public can read bookings" on public.bookings;
create policy "Public can read bookings"
on public.bookings for select
to anon
using (true);

drop policy if exists "Public can create bookings" on public.bookings;
create policy "Public can create bookings"
on public.bookings for insert
to anon
with check (true);

drop policy if exists "Public can delete bookings" on public.bookings;
create policy "Public can delete bookings"
on public.bookings for delete
to anon
using (true);
