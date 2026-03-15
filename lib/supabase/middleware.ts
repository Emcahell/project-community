import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas exclusivas para instituciones
const INSTITUTION_ONLY_ROUTES = ["/dashboard/institution", "/dashboard/needs"];

// Rutas exclusivas para estudiantes
const STUDENT_ONLY_ROUTES = ["/needs"];

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const role = user?.user_metadata?.role as
    | "student"
    | "institution"
    | "admin"
    | undefined;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isRoot = pathname === "/";

  // Usuario no autenticado intentando acceder a rutas protegidas
  if (!user && (isRoot || isDashboardRoute || isAdminRoute)) {
    return redirect(request, "/login");
  }

  // Usuario autenticado intentando acceder a login/register
  if (user && isAuthRoute) {
    return redirect(request, role === "admin" ? "/admin" : "/dashboard");
  }

  // Usuario autenticado en "/" → redirigir según rol
  if (user && isRoot) {
    return redirect(request, role === "admin" ? "/admin" : "/dashboard");
  }

  // Admin intentando acceder a /dashboard → redirigir a /admin
  if (user && role === "admin" && isDashboardRoute) {
    return redirect(request, "/admin");
  }

  // No-admin intentando acceder a /admin → redirigir a /dashboard
  if (user && role !== "admin" && isAdminRoute) {
    return redirect(request, "/dashboard");
  }

  // Estudiante intentando acceder a rutas de institución
  if (user && role === "student") {
    const isInstitutionRoute = INSTITUTION_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route),
    );
    if (isInstitutionRoute) {
      return redirect(request, "/dashboard");
    }
  }

  // Institución intentando acceder a rutas de estudiante
  if (user && role === "institution") {
    const isStudentRoute = STUDENT_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route),
    );
    if (isStudentRoute) {
      return redirect(request, "/dashboard");
    }
  }

  return supabaseResponse;
}
