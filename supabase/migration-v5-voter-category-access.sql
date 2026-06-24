-- ============================================================================
-- BYMA 2026 — Migration v5: acceso por categoría por votante
-- ============================================================================
-- Por defecto cada votante ve TODAS las categorías. Si el comité le asigna
-- una lista específica, ve SOLO esas. Admins siempre ven todo.
--
-- Mecánica: tabla `allowed_email_categories` por (email, category_id).
--   - Sin filas para un email  →  acceso total (default actual, no breaking)
--   - Con filas                →  acceso solo a esas categorías
--
-- Pegar TODO esto en Supabase SQL Editor → Run. Idempotente.
-- ============================================================================

-- ─── 1. Tabla de asignaciones ────────────────────────────────────────────────
create table if not exists public.allowed_email_categories (
  email       text not null references public.allowed_emails(email) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (email, category_id)
);

create index if not exists aec_email_idx       on public.allowed_email_categories(email);
create index if not exists aec_category_idx    on public.allowed_email_categories(category_id);

alter table public.allowed_email_categories enable row level security;

drop policy if exists aec_select_admin on public.allowed_email_categories;
create policy aec_select_admin
  on public.allowed_email_categories for select
  using (public.is_admin());

-- ─── 2. Helpers de visibilidad ───────────────────────────────────────────────
-- ¿El usuario actual tiene la lista restringida?
create or replace function public.has_category_restrictions()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.allowed_email_categories
    where email = lower((auth.jwt() ->> 'email'))
  )
$$;

-- ¿Puede el usuario actual ver/proponer en esta categoría?
create or replace function public.voter_can_access_category(p_category_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    public.is_admin()
    or (
      public.is_allowed()
      and (
        not public.has_category_restrictions()
        or exists (
          select 1
          from public.allowed_email_categories
          where email = lower((auth.jwt() ->> 'email'))
            and category_id = p_category_id
        )
      )
    )
$$;

grant execute on function public.has_category_restrictions()              to authenticated;
grant execute on function public.voter_can_access_category(uuid)          to authenticated;

-- ─── 3. RLS actualizada: categories visibles + candidates con check ─────────
drop policy if exists categories_select_auth      on public.categories;
drop policy if exists categories_select_visible   on public.categories;
create policy categories_select_visible
  on public.categories for select
  to authenticated
  using (public.voter_can_access_category(id));

drop policy if exists candidates_insert_own on public.candidates;
create policy candidates_insert_own
  on public.candidates for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_allowed()
    and public.voter_can_access_category(category_id)
  );

drop policy if exists candidates_update_own on public.candidates;
create policy candidates_update_own
  on public.candidates for update
  to authenticated
  using (user_id = auth.uid() and public.is_allowed())
  with check (
    user_id = auth.uid()
    and public.is_allowed()
    and public.voter_can_access_category(category_id)
  );

-- ─── 4. RPCs de admin para gestionar la asignación ──────────────────────────
-- Listar los category_ids asignados a un email (vacío = sin restricción).
create or replace function public.admin_voter_categories(p_email text)
returns table (category_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select aec.category_id
  from public.allowed_email_categories aec
  where aec.email = lower(trim(p_email));
end;
$$;

grant execute on function public.admin_voter_categories(text) to authenticated;

-- Reemplaza completamente la lista para un email.
--   - Array vacío  →  borra todo (votante vuelve a ver TODAS)
--   - Array con N  →  votante solo verá esas N
create or replace function public.admin_set_voter_categories(
  p_email text,
  p_category_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  clean_email := lower(trim(p_email));

  if not exists (select 1 from public.allowed_emails where email = clean_email) then
    raise exception 'email not in allowlist';
  end if;

  delete from public.allowed_email_categories
  where email = clean_email;

  if p_category_ids is not null and array_length(p_category_ids, 1) > 0 then
    insert into public.allowed_email_categories (email, category_id)
    select clean_email, c.id
    from public.categories c
    where c.id = any(p_category_ids);
  end if;
end;
$$;

grant execute on function public.admin_set_voter_categories(text, uuid[]) to authenticated;

-- ─── 5. Actualiza admin_list_users con conteo de categorías asignadas ───────
-- assigned_categories: NULL = ve todas; número = cuántas le asignaron.
-- Necesario DROP porque cambia el return type.
drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (
  email text,
  full_name text,
  role text,
  user_id uuid,
  proposal_count bigint,
  categories_covered bigint,
  assigned_categories int,
  last_active timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    ae.email,
    ae.full_name,
    ae.role,
    u.id as user_id,
    coalesce(count(distinct c.id), 0)::bigint as proposal_count,
    coalesce(count(distinct c.category_id), 0)::bigint as categories_covered,
    (
      select case when count(*) = 0 then null else count(*)::int end
      from public.allowed_email_categories aec
      where aec.email = ae.email
    ) as assigned_categories,
    max(c.created_at) as last_active
  from public.allowed_emails ae
  left join auth.users u on lower(u.email) = lower(ae.email)
  left join public.candidates c on c.user_id = u.id
  group by ae.email, ae.full_name, ae.role, u.id
  order by
    case when ae.role = 'admin' then 0 else 1 end,
    ae.email;
end;
$$;

grant execute on function public.admin_list_users() to authenticated;
