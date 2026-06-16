-- BYMA Awards 2026 — schema base
-- Correr este archivo en el SQL editor de Supabase (Project → SQL Editor → New query).
-- Idempotente: se puede correr varias veces sin romper datos.

-- =========================================================================
-- 1. ALLOWLIST DE EMAILS
--    Solo los emails listados aquí pueden iniciar sesión. Lo administra
--    el comité directamente desde la tabla.
-- =========================================================================
create table if not exists public.allowed_emails (
  email       text primary key,
  role        text not null default 'voter' check (role in ('voter', 'admin')),
  full_name   text,
  created_at  timestamptz not null default now()
);

-- =========================================================================
-- 2. CATEGORÍAS
-- =========================================================================
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  description  text not null,
  color_key    text not null check (color_key in ('AZUL','CREMA','NARANJA','NEGRO','ROJO')),
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);

-- =========================================================================
-- 3. CANDIDATOS PROPUESTOS
--    Cada usuario puede proponer hasta 5 candidatos por categoría:
--    los slots 1-3 son obligatorios, 4-5 opcionales.
--    Constraint UNIQUE (user_id, category_id, slot) garantiza el upsert limpio.
-- =========================================================================
create table if not exists public.candidates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category_id   uuid not null references public.categories(id) on delete cascade,
  slot          int  not null check (slot between 1 and 5),
  name          text not null,
  justification text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, category_id, slot)
);

create index if not exists candidates_category_idx on public.candidates(category_id);
create index if not exists candidates_user_idx     on public.candidates(user_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists candidates_touch_updated on public.candidates;
create trigger candidates_touch_updated
  before update on public.candidates
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- 4. HELPERS DE AUTORIZACIÓN
-- =========================================================================
-- Devuelve el role del email autenticado (voter | admin | null).
create or replace function public.current_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select a.role
  from public.allowed_emails a
  where lower(a.email) = lower((auth.jwt() ->> 'email'))
$$;

-- Para que el cliente sepa rápidamente si es admin.
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

-- True si el usuario autenticado está en el allowlist (voter o admin).
create or replace function public.is_allowed()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.current_role() is not null
$$;

-- RPC público para el formulario de login: confirma si un email está autorizado
-- ANTES de mandar el magic link. SECURITY DEFINER + grant a anon.
create or replace function public.email_is_allowed(p_email text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(p_email)
  )
$$;

revoke all on function public.email_is_allowed(text) from public;
grant execute on function public.email_is_allowed(text) to anon, authenticated;

-- =========================================================================
-- 5. ROW LEVEL SECURITY
-- =========================================================================
alter table public.allowed_emails enable row level security;
alter table public.categories     enable row level security;
alter table public.candidates     enable row level security;

-- allowed_emails: solo admin lee; nadie escribe vía API (se administra desde
-- Supabase Studio o vía service role en server actions de admin).
drop policy if exists allowed_emails_select_admin on public.allowed_emails;
create policy allowed_emails_select_admin
  on public.allowed_emails for select
  using (public.is_admin());

-- categories: solo usuarios del allowlist las leen.
drop policy if exists categories_select_auth on public.categories;
create policy categories_select_auth
  on public.categories for select
  to authenticated
  using (public.is_allowed());

-- candidates:
--   - El usuario solo ve y modifica sus propios candidatos.
--   - El admin ve todo.
drop policy if exists candidates_select_own_or_admin on public.candidates;
create policy candidates_select_own_or_admin
  on public.candidates for select
  to authenticated
  using ((user_id = auth.uid() and public.is_allowed()) or public.is_admin());

drop policy if exists candidates_insert_own on public.candidates;
create policy candidates_insert_own
  on public.candidates for insert
  to authenticated
  with check (user_id = auth.uid() and public.is_allowed());

drop policy if exists candidates_update_own on public.candidates;
create policy candidates_update_own
  on public.candidates for update
  to authenticated
  using (user_id = auth.uid() and public.is_allowed())
  with check (user_id = auth.uid() and public.is_allowed());

drop policy if exists candidates_delete_own on public.candidates;
create policy candidates_delete_own
  on public.candidates for delete
  to authenticated
  using (user_id = auth.uid() and public.is_allowed());

-- =========================================================================
-- 6. SEED DE CATEGORÍAS PLACEHOLDER (editables después)
-- =========================================================================
insert into public.categories (slug, name, description, color_key, sort_order) values
  ('album-del-ano',        'Álbum del Año',                'Reconoce al álbum que mejor sintetiza visión artística, producción y resonancia cultural durante 2025. Se evalúa la obra como conjunto, no canciones individuales.',                                  'ROJO',    1),
  ('cancion-del-ano',      'Canción del Año',              'Premia la canción que marcó el año por su composición, letra e impacto. Considera autoría sobre interpretación.',                                                                                  'AZUL',    2),
  ('artista-revelacion',   'Artista Revelación',           'Para artistas que lanzaron su primer trabajo de impacto en 2025 o que cruzaron por primera vez la barrera de notoriedad amplia.',                                                                  'NARANJA', 3),
  ('mejor-produccion',     'Mejor Producción',             'Reconoce la labor de productor(a) en un proyecto: dirección sonora, arreglos, mezcla creativa y coherencia de obra.',                                                                              'CREMA',   4),
  ('mejor-album-rock',     'Mejor Álbum de Rock',          'Mejor álbum dentro del espectro rock (incluye indie, post-punk, alternativo, shoegaze, math, etc.) lanzado en 2025.',                                                                              'NEGRO',   5),
  ('mejor-album-urbano',   'Mejor Álbum Urbano',           'Mejor álbum del espectro urbano (hip-hop, R&B, trap, dembow, drill, neoperreo) lanzado en 2025.',                                                                                                  'ROJO',    6),
  ('mejor-album-electronica','Mejor Álbum de Electrónica', 'Mejor álbum del espectro electrónico (house, techno, ambient, DnB, club, experimental) lanzado en 2025.',                                                                                          'AZUL',    7),
  ('mejor-album-regional', 'Mejor Álbum Regional Mexicano','Mejor álbum del espectro regional mexicano: corridos, banda, mariachi, sierreño, tumbado, fusión.',                                                                                                'NARANJA', 8),
  ('mejor-video',          'Mejor Video Musical',          'Premia la pieza audiovisual asociada a una canción de 2025: dirección, fotografía, narrativa y diálogo con la música.',                                                                            'CREMA',   9),
  ('mejor-directo',        'Mejor Acto en Vivo',           'Reconoce al artista o banda con la propuesta escénica más memorable del año: gira, residencia o show puntual.',                                                                                    'NEGRO',  10),
  ('aporte-trayectoria',   'Aporte a la Trayectoria',      'Reconocimiento del comité a una carrera o proyecto que ha dejado huella sostenida en la música latinoamericana. Sin restricción temporal.',                                                       'ROJO',   11),
  ('comunidad-escena',     'Comunidad y Escena',           'Para colectivos, sellos, espacios o medios que sostienen y dinamizan la escena: bookers, foros, podcasts, fanzines, festivales independientes.',                                                  'AZUL',   12)
on conflict (slug) do nothing;
