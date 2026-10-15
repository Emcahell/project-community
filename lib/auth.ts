import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export type CurrentProfile = {
  id: string;
  role: UserRole;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  semester: number | null;
  career: string | null;
  is_disabled: boolean | null;
  onboarding_completed: boolean | null;
};

const PROFILE_COLUMNS =
  "id, role, full_name, first_name, last_name, avatar_url, semester, career, is_disabled, onboarding_completed";

/**
 * Usuario y perfil de la petición actual. Se memoriza por petición con
 * `cache()`, así navbar, layout y página comparten una sola consulta.
 * El rol SIEMPRE sale de `profiles` (nunca de `user_metadata`, que el
 * propio usuario puede modificar).
 */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();

  return { supabase, user, profile: (data as CurrentProfile | null) ?? null };
});

/** Para páginas: redirige a /login si no hay sesión. */
export async function requireUser() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  return { ...session, user: session.user };
}

/** Para páginas: exige un rol concreto o redirige al panel. */
export async function requireRole(...roles: UserRole[]) {
  const session = await requireUser();
  if (!session.profile || !roles.includes(session.profile.role)) {
    redirect(session.profile?.role === "admin" ? "/admin" : "/dashboard");
  }
  return { ...session, profile: session.profile };
}

type AuthorizedSession = Awaited<ReturnType<typeof requireRole>>;

/**
 * Para server actions: devuelve la sesión si el usuario tiene uno de los
 * roles y no está inhabilitado; en caso contrario, un error presentable.
 */
export async function authorize(
  ...roles: UserRole[]
): Promise<{ error: string } | { error?: undefined; session: AuthorizedSession }> {
  const session = await getSession();
  if (!session.user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };
  if (!session.profile || !roles.includes(session.profile.role)) {
    return { error: "No tienes permisos para realizar esta acción." };
  }
  if (session.profile.is_disabled) {
    return { error: "Tu cuenta está inhabilitada. Contacta al administrador." };
  }
  return {
    session: { ...session, user: session.user, profile: session.profile },
  };
}
