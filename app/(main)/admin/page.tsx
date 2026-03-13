import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VerifyButton } from "./verify-button";
import { BadgeCheck, Building2 } from "lucide-react";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: institutions } = await supabase
    .from("institutions")
    .select("*, profiles (full_name)")
    .order("created_at", { ascending: false });

  const total = institutions?.length ?? 0;
  const verified = institutions?.filter((i) => i.verified).length ?? 0;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verifica instituciones para mostrar el badge de confianza.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Instituciones registradas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-sky-600">{verified}</p>
          <p className="text-xs text-muted-foreground mt-1">Verificadas</p>
        </div>
      </div>

      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
        Instituciones
      </h2>

      {institutions && institutions.length > 0 ? (
        <div className="space-y-2.5">
          {institutions.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-sm truncate">{inst.name}</p>
                  {inst.verified && (
                    <BadgeCheck className="w-4 h-4 text-sky-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(inst.profiles as { full_name: string | null } | null)?.full_name ?? "Sin nombre"}
                  {inst.address && <> · {inst.address}</>}
                </p>
              </div>
              <VerifyButton
                institutionId={inst.id}
                verified={inst.verified}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">
          No hay instituciones registradas.
        </p>
      )}
    </div>
  );
}
