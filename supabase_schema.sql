-- ==============================================================================
-- SCHEMA MAP - MYSTIC ETHER PVP
-- ==============================================================================
-- 1. profiles: Stores public user data (linked to auth.users).
-- 2. rooms: Stores matchmaking game sessions (waiting, playing, finished).
-- 3. Security (RLS): Policies to ensure users can only modify their own data/games.
-- ==============================================================================

-- 1. PROFILES TABLE
-- Automatically created via triggers when a user signs up (if using Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  rating integer default 1000,
  wins integer default 0,
  losses integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. ROOMS TABLE (Matchmaking)
create type room_status as enum ('waiting', 'playing', 'finished');

create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  name text not null, -- Room Name e.g. "Arena 1"
  status room_status default 'waiting',
  
  -- Players
  player1_id uuid references auth.users, -- can be null if we allow anon for now, but usually auth
  player2_id uuid references auth.users,
  
  -- Game State (Optional Persistence)
  current_turn integer default 0,
  winner_id uuid references auth.users
);

alter table public.rooms enable row level security;

-- Policies for Rooms

-- Anyone can read rooms (to see the lobby list)
create policy "Rooms are viewable by everyone."
  on rooms for select
  using ( true );

-- Authenticated users can create rooms
create policy "Authenticated users can create rooms."
  on rooms for insert
  with check ( auth.role() = 'authenticated' );

-- Players can update the room if they are in it (e.g., joining, updating status)
create policy "Players can update their own rooms."
  on rooms for update
  using ( 
    auth.uid() = player1_id or 
    auth.uid() = player2_id or
    (player2_id is null and status = 'waiting') -- Allowed to join if empty slot
  );

-- 3. REALTIME CONFIGURATION
-- Enable realtime for the rooms table so the Lobby updates automatically
alter publication supabase_realtime add table rooms;

-- 4. STORAGE (Optional - for custom avatars/card art later)
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
on conflict do nothing;

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
