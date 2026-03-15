import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getInitials } from "@/lib/utils";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  const fullName = user?.user_metadata?.full_name as string | undefined;

  let avatarUrl: string | null = null;
  if (user) {
    const supabaseData = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
    avatarUrl = supabaseData.data?.avatar_url ?? null;
  }

  return (
    <header className="border-b border-border/60 bg-background/85 backdrop-blur-xl sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <span className="text-white text-sm font-bold leading-none">C</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-[15px] tracking-tight">Community</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] font-medium">UPTYAB</span>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <div className="flex items-center gap-1.5 mr-1">
                <Link
                  href="/dashboard/profile"
                  className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-border hover:ring-primary/40 transition-all"
                  title="Editar perfil"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={fullName ?? "Avatar"} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-violet-500/20 text-primary flex items-center justify-center text-[11px] font-bold select-none">
                      {getInitials(fullName)}
                    </div>
                  )}
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-sm font-medium">
                    {role === "institution" ? "Mi panel" : "Mis solicitudes"}
                  </Button>
                </Link>
              </div>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit" className="font-medium">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-medium">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold shadow-sm shadow-primary/20">
                  Registrarse
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
