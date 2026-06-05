-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- This creates the two tables your portal needs

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  name text not null,
  company text,
  allowed_courses text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  course_id text not null,
  completed_at timestamptz default now(),
  unique(user_id, course_id)
);

-- Disable row level security so the service role key can access tables freely
alter table users disable row level security;
alter table completions disable row level security;
