-- Safe migration: extend public.user_settings with complete developer profile fields
alter table public.user_settings
  add column if not exists full_name text,
  add column if not exists age int check (age is null or (age >= 10 and age <= 120)),
  add column if not exists college text,
  add column if not exists degree text,
  add column if not exists branch text,
  add column if not exists semester text,
  add column if not exists career_goal text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text;
