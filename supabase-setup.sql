-- Run this in Supabase SQL Editor
-- Drop and recreate all tables cleanly

drop table if exists quiz_attempts;
drop table if exists completions;
drop table if exists users;

create table users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  name text not null,
  company text,
  allowed_courses text[] default '{}',
  created_at timestamptz default now()
);

create table completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  course_id text not null,
  completed_at timestamptz default now(),
  unique(user_id, course_id)
);

create table quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  course_id text not null,
  score int not null,
  total int not null,
  passed boolean not null,
  attempted_at timestamptz default now()
);

alter table users disable row level security;
alter table completions disable row level security;
alter table quiz_attempts disable row level security;
