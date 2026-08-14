import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/mobile-nav";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fullName = user?.user_metadata?.full_name as string | undefined;

  let avatarUrl: string | null = null;
  if (user) {
    const supabaseData = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = supabaseData.data?.avatar_url ?? null;
  }

  return (
    <>
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <span className="text-white text-sm font-bold leading-none">
                C
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-tight">
                Community
              </span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em] font-medium">
                UPTYAB
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {user ? (
              <div className="hidden md:flex">
                <UserMenu avatarUrl={avatarUrl} fullName={fullName} />
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

      {user && <MobileNav avatarUrl={avatarUrl} fullName={fullName} />}
    </>
  );
}
