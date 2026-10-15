import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type Role = "student" | "institution" | "admin";

// Rutas exclusivas para instituciones
const INSTITUTION_ONLY_ROUTES = [
  "/dashboard/institution",
  "/dashboard/needs",
  "/dashboard/departments",
];

// Rutas exclusivas para estudiantes
const STUDENT_ONLY_ROUTES = ["/dashboard/team"];

// Rutas que una institución no puede abrir (vista pública de estudiante)
const INSTITUTION_BLOCKED_ROUTES = ["/needs"];

const AUTH_ROUTES = ["/login", "/register"];

function matches(pathname: string, routes: string[]) {
  return routes.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Las redirecciones deben conservar las cookies de sesión refrescadas.
  function redirect(pathname: string, search = "") {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = search;
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      response.cookies.set(cookie),
    );
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isDashboardRoute = matches(pathname, ["/dashboard"]);
  const isAdminRoute = matches(pathname, ["/admin"]);
  const isOnboardingRoute = pathname === "/onboarding";
  const isRoot = pathname === "/";

  if (!user) {
    if (isDashboardRoute || isAdminRoute || isOnboardingRoute) {
      return redirect("/login");
    }
    return supabaseResponse;
  }

  // Una sola consulta: rol (desde la base, NO desde user_metadata, que el
  // usuario puede editar), onboarding y estado de inhabilitación.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed, is_disabled, institutions(is_disabled)")
    .eq("id", user.id)
    .maybeSingle();

  // Sin perfil: dejar pasar; el dashboard muestra el mensaje correspondiente.
  if (!profile) return supabaseResponse;

  const role = profile.role as Role;
  const institutions = profile.institutions as
    | { is_disabled: boolean | null }[]
    | { is_disabled: boolean | null }
    | null;
  const institutionDisabled = Array.isArray(institutions)
    ? institutions.some((i) => i.is_disabled)
    : Boolean(institutions?.is_disabled);

  // Cuenta inhabilitada por el administrador → cerrar sesión
  if (role !== "admin" && (profile.is_disabled || institutionDisabled)) {
    await supabase.auth.signOut();
    return redirect("/login", "?disabled=true");
  }

  const home = role === "admin" ? "/admin" : "/dashboard";

  if (role !== "admin") {
    const isPasswordReset = pathname === "/reset-password";
    if (!profile.onboarding_completed && !isOnboardingRoute && !isPasswordReset) {
      return redirect("/onboarding");
    }
    if (profile.onboarding_completed && isOnboardingRoute) {
      return redirect("/dashboard");
    }
  } else if (isOnboardingRoute) {
    return redirect("/admin");
  }

  if (isAuthRoute || isRoot) return redirect(home);
  if (role === "admin" && isDashboardRoute) return redirect("/admin");
  if (role !== "admin" && isAdminRoute) return redirect("/dashboard");

  if (role === "student" && matches(pathname, INSTITUTION_ONLY_ROUTES)) {
    return redirect("/dashboard");
  }
  if (
    role === "institution" &&
    (matches(pathname, STUDENT_ONLY_ROUTES) ||
      matches(pathname, INSTITUTION_BLOCKED_ROUTES))
  ) {
    return redirect("/dashboard");
  }

  return supabaseResponse;
}
