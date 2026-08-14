import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { formatRelativeDate, getInitials } from "@/lib/utils";
import { NeedCard } from "@/components/need-card";
import { APPLICATION_STATUS } from "@/lib/constants";
import { InstitutionNeedsList } from "./institution-needs-list";
import { InstitutionSetupForm } from "./institution/setup/institution-setup-form";
import { Plus, Settings, FileText, CheckCircle2, Clock, TrendingUp, ArrowRight } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-destructive font-bold">!</span>
        </div>
        <h1 className="text-xl font-bold mb-2">Perfil no encontrado</h1>
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
          No encontramos tu perfil en la plataforma. Esto suele pasar cuando
          la cuenta se eliminó. Cierra sesión y contacta al administrador.
        </p>
        <form action={logout}>
          <Button type="submit" variant="outline" className="font-medium">
            Cerrar sesión
          </Button>
        </form>
      </div>
    );
  }

  if (profile.role === "institution") {
    return (
      <InstitutionDashboard
        userId={user.id}
        initialName={profile.full_name ?? ""}
        initialEmail={user.email ?? ""}
      />
    );
  }

  return <StudentDashboard userId={user.id} profile={profile} />;
}

async function InstitutionDashboard({
  userId,
  initialName,
  initialEmail,
}: {
  userId: string;
  initialName: string;
  initialEmail: string;
}) {
  const supabase = await createClient();

  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("profile_id", userId)
    .single();

  if (!institution) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Falta poco, solo termina de configurar la institución
          </h1>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
            Completa la información de tu institución para que los estudiantes
            la conozcan y puedas publicar necesidades.
          </p>
        </div>
        <InstitutionSetupForm
          initialName={initialName}
          initialEmail={initialEmail}
        />
      </div>
    );
  }

  const { data: needs } = await supabase
    .from("needs")
    .select(`*, applications(id, status)`)
    .eq("institution_id", institution.id)
    .order("created_at", { ascending: false });

  const totalNeeds = needs?.length ?? 0;
  const totalPending =
    needs?.reduce((acc, n) => {
      const apps = n.applications as { status: string }[];
      return acc + apps.filter((a) => a.status === "pending").length;
    }, 0) ?? 0;
  const openNeeds = needs?.filter((n) => n.status === "open").length ?? 0;

  return (
    <div>
      {/* Header banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-8 mb-8 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, oklch(0.488 0.243 264.376) 0%, oklch(0.4 0.22 285) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5">
            Panel de institución
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{institution.name}</h1>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <Link href="/dashboard/profile">
            <Button
              size="sm"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard/needs/new">
            <Button
              size="sm"
              className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg shadow-black/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Publicar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      {totalNeeds > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-5">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-primary/30 via-primary to-primary/30" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{totalNeeds}</p>
            <p className="text-xs text-muted-foreground mt-0.5">necesidades</p>
          </div>
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-5">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-emerald-500/30 via-emerald-500 to-emerald-500/30" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">Abiertas</p>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600">{openNeeds}</p>
            <p className="text-xs text-muted-foreground mt-0.5">activas</p>
          </div>
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-5">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-amber-500/30 via-amber-500 to-amber-500/30" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">Pendientes</p>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-600">{totalPending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">solicitudes</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Mis necesidades
        </h2>
        {totalNeeds > 0 && (
          <Link href="/dashboard/needs/new">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 font-medium">
              <Plus className="w-3 h-3" /> Nueva
            </Button>
          </Link>
        )}
      </div>

      <InstitutionNeedsList
        needs={(needs ?? []).map((n) => ({
          ...n,
          applications: n.applications as { id: string; status: string }[],
        }))}
      />
    </div>
  );
}

async function StudentDashboard({
  userId,
  profile,
}: {
  userId: string;
  profile: { full_name: string | null };
}) {
  const supabase = await createClient();

  const [{ data: applications }, { data: openNeeds }] = await Promise.all([
    supabase
      .from("applications")
      .select(`*, needs (id, title, status, institutions (id, name, address))`)
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("needs")
      .select(`*, institutions (id, name, address, verified)`)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  const appliedNeedIds = new Set(
    applications
      ?.map((a) => (a.needs as { id: string } | null)?.id)
      .filter(Boolean)
  );

  const pending =
    applications?.filter((a) => a.status === "pending").length ?? 0;
  const accepted =
    applications?.filter((a) => a.status === "accepted").length ?? 0;

  return (
    <div>
      {/* Header banner */}
      <div
        className="relative rounded-2xl overflow-hidden px-6 py-8 mb-8 flex items-center justify-between gap-4"
        style={{
          background: "linear-gradient(135deg, oklch(0.488 0.243 264.376) 0%, oklch(0.4 0.22 285) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5">
            Panel de estudiante
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Hola, {profile.full_name?.split(" ")[0] ?? "estudiante"} 👋
          </h1>
          <p className="text-white/60 text-sm mt-1.5">
            {applications?.length
              ? `${applications.length} solicitud${applications.length !== 1 ? "es" : ""} enviada${applications.length !== 1 ? "s" : ""}`
              : "Explora necesidades y aplica al que más te interese"}
          </p>
        </div>
        <Link href="/dashboard/profile" className="relative z-10 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {applications && applications.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-5">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-amber-500/30 via-amber-500 to-amber-500/30" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">Pendientes</p>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">en revisión</p>
          </div>
          <div className="relative rounded-2xl border border-border bg-card overflow-hidden p-5">
            <div className="absolute top-0 inset-x-0 h-0.5 bg-linear-to-r from-emerald-500/30 via-emerald-500 to-emerald-500/30" />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">Aceptadas</p>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600">{accepted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">aprobadas</p>
          </div>
        </div>
      )}

      {/* Applications list */}
      {applications && applications.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            Mis solicitudes
          </h2>
          <div className="space-y-2 mb-10">
            {applications.map((app) => {
              const need = app.needs as {
                id: string;
                title: string;
                status: string;
                institutions: { id: string; name: string; address: string | null } | null;
              } | null;
              const appStatus =
                APPLICATION_STATUS[app.status] ?? APPLICATION_STATUS.pending;

              return (
                <Link
                  key={app.id}
                  href={`/needs/${need?.id}`}
                  className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-px transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/15 to-violet-500/10 border border-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 select-none">
                    {getInitials(need?.institutions?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {need?.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {need?.institutions?.name}
                      {app.created_at && (
                        <> · {formatRelativeDate(app.created_at)}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${appStatus.className}`}
                    >
                      {appStatus.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Available needs */}
      {openNeeds && openNeeds.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            Necesidades disponibles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {openNeeds
              .filter((n) => !appliedNeedIds.has(n.id))
              .map((need) => (
                <NeedCard key={need.id} need={need} />
              ))}
          </div>
          {openNeeds.every((n) => appliedNeedIds.has(n.id)) && (
            <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">¡Todo al día!</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Ya aplicaste a todas las necesidades disponibles.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
