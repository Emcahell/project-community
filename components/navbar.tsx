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
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground text-xs font-bold leading-none">C</span>
          </div>
          <span className="font-bold text-base tracking-tight">Community</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <div className="flex items-center gap-1 mr-1">
                <Link
                  href="/dashboard/profile"
                  className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-primary/20 hover:opacity-80 transition-opacity"
                  title="Editar perfil"
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={fullName ?? "Avatar"} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-semibold select-none">
                      {getInitials(fullName)}
                    </div>
                  )}
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-sm">
                    {role === "institution" ? "Mi panel" : "Mis solicitudes"}
                  </Button>
                </Link>
              </div>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit">
                  Salir
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Registrarse</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
