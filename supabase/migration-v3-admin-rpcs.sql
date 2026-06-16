-- ============================================================================
-- BYMA 2026 — Migration v3: RPCs para gestión de usuarios desde el admin UI
-- ============================================================================
-- Solo admins (is_admin()) pueden ejecutarlas. Como `auth.users` no es leíble
-- vía RLS desde el cliente, usamos SECURITY DEFINER para hacer el JOIN entre
-- `allowed_emails` y `auth.users` por email, y agregar conteos de `candidates`.
--
-- Pegar TODO esto en Supabase SQL Editor → Run.
-- ============================================================================

-- ─── 1. Listar usuarios con conteos ──────────────────────────────────────────
create or replace function public.admin_list_users()
returns table (
  email text,
  full_name text,
  role text,
  user_id uuid,
  proposal_count bigint,
  categories_covered bigint,
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
    coalesce(count(c.id), 0)::bigint as proposal_count,
    coalesce(count(distinct c.category_id), 0)::bigint as categories_covered,
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

-- ─── 2. Añadir o actualizar un usuario ───────────────────────────────────────
create or replace function public.admin_upsert_user(
  p_email text,
  p_full_name text,
  p_role text
)
returns public.allowed_emails
language plpgsql
security definer
set search_path = public
as $$
declare
  new_row public.allowed_emails;
  clean_email text;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_role not in ('voter', 'admin') then
    raise exception 'role must be voter or admin';
  end if;

  clean_email := lower(trim(p_email));
  if clean_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid email format';
  end if;

  insert into public.allowed_emails (email, full_name, role)
  values (
    clean_email,
    nullif(trim(coalesce(p_full_name, '')), ''),
    p_role
  )
  on conflict (email) do update
    set full_name = excluded.full_name,
        role = excluded.role
  returning * into new_row;

  return new_row;
end;
$$;

grant execute on function public.admin_upsert_user(text, text, text) to authenticated;

-- ─── 3. Quitar un usuario del allowlist ──────────────────────────────────────
create or replace function public.admin_remove_user(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.allowed_emails where email = lower(trim(p_email));
end;
$$;

grant execute on function public.admin_remove_user(text) to authenticated;

-- ─── 4. Propuestas de un votante específico ──────────────────────────────────
create or replace function public.admin_voter_proposals(p_user_id uuid)
returns table (
  candidate_id uuid,
  category_id uuid,
  category_slug text,
  category_name text,
  category_bucket text,
  category_sort_order int,
  slot int,
  name text,
  justification text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    c.id as candidate_id,
    cat.id as category_id,
    cat.slug as category_slug,
    cat.name as category_name,
    cat.bucket as category_bucket,
    cat.sort_order as category_sort_order,
    c.slot,
    c.name,
    c.justification,
    c.created_at
  from public.candidates c
  join public.categories cat on cat.id = c.category_id
  where c.user_id = p_user_id
  order by cat.sort_order, c.slot;
end;
$$;

grant execute on function public.admin_voter_proposals(uuid) to authenticated;

-- ─── 5. Info básica de un votante (email + nombre + role) ───────────────────
create or replace function public.admin_voter_info(p_user_id uuid)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role text
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
    u.id as user_id,
    u.email::text,
    ae.full_name,
    ae.role
  from auth.users u
  left join public.allowed_emails ae on lower(ae.email) = lower(u.email)
  where u.id = p_user_id;
end;
$$;

grant execute on function public.admin_voter_info(uuid) to authenticated;
