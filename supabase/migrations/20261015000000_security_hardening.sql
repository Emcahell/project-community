-- =====================================================================
-- Endurecimiento de seguridad e integridad de datos
-- ---------------------------------------------------------------------
-- ⚠️  REVISAR ANTES DE APLICAR.
-- Esta migración se escribió sin acceso al esquema real. Antes de
-- aplicarla:
--   1. `supabase db pull` para versionar el esquema actual como base.
--   2. Revisar que los nombres de tablas/columnas coinciden.
--   3. Probarla en un proyecto de staging (`supabase db push`).
-- Todas las sentencias son aditivas: no borran datos ni políticas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Helper: ¿el usuario actual es administrador?
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Proteger columnas privilegiadas de `profiles`
--    - Nadie puede registrarse como 'admin' (el rol llega desde
--      user_metadata, que controla el propio usuario).
--    - Un usuario no puede cambiar su rol ni des-inhabilitarse.
--    Los administradores se crean desde el SQL editor (session_user
--    postgres/supabase_admin), que queda exento.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if session_user in ('postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is null or new.role not in ('student', 'institution') then
      raise exception 'Rol no permitido: %', new.role using errcode = '42501';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'No se puede cambiar el rol' using errcode = '42501';
  end if;

  if new.is_disabled is distinct from old.is_disabled and not public.is_admin() then
    raise exception 'Solo un administrador puede (in)habilitar cuentas' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- Lo mismo para la verificación/inhabilitación de instituciones
create or replace function public.protect_institution_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if session_user in ('postgres', 'supabase_admin') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified := false;
    new.is_disabled := false;
    return new;
  end if;

  if new.verified is distinct from old.verified
     or new.is_disabled is distinct from old.is_disabled then
    raise exception 'Solo un administrador puede verificar o inhabilitar instituciones'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_institution_privileged_columns on public.institutions;
create trigger protect_institution_privileged_columns
  before insert or update on public.institutions
  for each row execute function public.protect_institution_privileged_columns();

-- ---------------------------------------------------------------------
-- 3. Integridad de solicitudes
-- ---------------------------------------------------------------------
-- Una sola solicitud aceptada por necesidad
create unique index if not exists applications_one_accepted_per_need
  on public.applications (need_id)
  where status = 'accepted';

-- Un estudiante no puede tener dos solicitudes activas para la misma necesidad
create unique index if not exists applications_one_active_per_student
  on public.applications (need_id, student_id)
  where status in ('pending', 'accepted');

-- Valores de estado válidos (NOT VALID: no revisa filas antiguas)
alter table public.applications
  drop constraint if exists applications_status_check,
  add constraint applications_status_check
    check (status in ('pending', 'accepted', 'rejected')) not valid;

alter table public.needs
  drop constraint if exists needs_status_check,
  add constraint needs_status_check
    check (status in ('open', 'approved')) not valid;

-- Índices para las consultas más frecuentes
create index if not exists applications_need_id_idx on public.applications (need_id);
create index if not exists applications_student_id_idx on public.applications (student_id);
create index if not exists needs_institution_status_idx on public.needs (institution_id, status, created_at desc);
create index if not exists notifications_recipient_read_idx on public.notifications (recipient_id, read);

-- ---------------------------------------------------------------------
-- 4. Políticas RESTRICTIVAS (se suman con AND a las existentes)
-- ---------------------------------------------------------------------
-- Cuentas inhabilitadas no pueden aplicar
drop policy if exists "restrict_disabled_students_apply" on public.applications;
create policy "restrict_disabled_students_apply" on public.applications
  as restrictive for insert to authenticated
  with check (
    student_id = auth.uid()
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and coalesce(p.is_disabled, false)
    )
  );

-- Solo la institución dueña de la necesidad cambia el estado de una solicitud
drop policy if exists "restrict_application_updates_to_owner" on public.applications;
create policy "restrict_application_updates_to_owner" on public.applications
  as restrictive for update to authenticated
  using (
    public.is_admin() or exists (
      select 1
      from public.needs n
      join public.institutions i on i.id = n.institution_id
      where n.id = applications.need_id and i.profile_id = auth.uid()
    )
  );

-- Instituciones inhabilitadas no pueden publicar necesidades
drop policy if exists "restrict_disabled_institutions_publish" on public.needs;
create policy "restrict_disabled_institutions_publish" on public.needs
  as restrictive for insert to authenticated
  with check (
    exists (
      select 1 from public.institutions i
      where i.id = needs.institution_id
        and i.profile_id = auth.uid()
        and not coalesce(i.is_disabled, false)
    )
  );

-- Cada usuario solo marca como leídas sus propias notificaciones
drop policy if exists "restrict_notifications_to_recipient" on public.notifications;
create policy "restrict_notifications_to_recipient" on public.notifications
  as restrictive for update to authenticated
  using (recipient_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Realtime para la campana de notificaciones
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
