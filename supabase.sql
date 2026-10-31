-- Rodar uma vez no Supabase: SQL Editor → New query → colar → Run
create table if not exists public.planner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.planner enable row level security;
create policy "ver o próprio planner" on public.planner for select using (auth.uid() = user_id);
create policy "criar o próprio planner" on public.planner for insert with check (auth.uid() = user_id);
create policy "editar o próprio planner" on public.planner for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.planner to authenticated;
