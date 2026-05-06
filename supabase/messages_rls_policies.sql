-- IMPORTANTE: Ejecutar este SQL en Supabase para permitir inserciones en la tabla messages
-- Este script configura las políticas RLS (Row-Level Security) para que los mensajes se puedan insertar.

-- 1. PRIMERO: Desactiva RLS temporalmente si aún no funciona (opción más simple)
-- Descomenta la línea siguiente si quieres deshabilitar RLS completamente:
-- alter table public.messages disable row level security;

-- 2. OPCIÓN: Si quieres mantener RLS activa, crea políticas permisivas:

-- Permitir SELECT para todos
create policy "Allow SELECT messages for all" 
on public.messages 
for select 
using (true);

-- Permitir INSERT para todos
create policy "Allow INSERT messages for all"
on public.messages
for insert
with check (true);

-- Permitir UPDATE para todos (para que puedan editar)
create policy "Allow UPDATE messages for all"
on public.messages
for update
using (true)
with check (true);

-- Permitir DELETE para el propietario o admin
-- Por ahora permitir DELETE a todos para simplificar
create policy "Allow DELETE messages for all"
on public.messages
for delete
using (true);

-- 3. Activa RLS en la tabla si no está ya activado
alter table public.messages enable row level security;
