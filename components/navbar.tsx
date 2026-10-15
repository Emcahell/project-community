import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";

export async function Navbar() {
  const { user, profile } = await getSession();
  const role = profile?.role;
  const avatarUrl = profile?.avatar_url ?? null;
  const fullName = profile ? getDisplayName(profile, "") || undefined : undefined;
  const homeHref = !user ? "/" : role === "admin" ? "/admin" : "/dashboard";

  return (
    <>
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-3 group" aria-label="Comunidad, ir al inicio">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <span className="text-white text-sm font-bold leading-none">
                C
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-tight">
                Comunidad
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] font-medium">
                UPTYAB
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                {role && role !== "admin" && <NotificationBell userId={user.id} />}
                <UserMenu avatarUrl={avatarUrl} fullName={fullName} role={role} />
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Iniciar sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="font-semibold shadow-sm shadow-primary/20"
                  >
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
