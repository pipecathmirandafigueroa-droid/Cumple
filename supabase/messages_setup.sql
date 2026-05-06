-- Ejecutar en Supabase SQL Editor
-- Este script crea/actualiza la tabla de mensajes para ownership por invitado.

create extension if not exists "pgcrypto";

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null,
  autor text not null,
  texto text not null,
  privado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilidad si la tabla ya existe pero le faltan columnas
alter table public.messages
  add column if not exists guest_id uuid,
  add column if not exists autor text,
  add column if not exists texto text,
  add column if not exists privado boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Marca columnas clave como requeridas cuando ya hay datos consistentes
alter table public.messages
  alter column autor set not null,
  alter column texto set not null,
  alter column guest_id set not null;

-- Opcional: integridad referencial con guests (descomenta si guests.id es uuid)
-- alter table public.messages
--   add constraint messages_guest_id_fkey
--   foreign key (guest_id)
--   references public.guests(id)
--   on delete cascade;

create index if not exists idx_messages_guest_id on public.messages(guest_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);

create or replace function public.set_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_messages_updated_at on public.messages;
create trigger trg_messages_updated_at
before update on public.messages
for each row
execute function public.set_messages_updated_at();
