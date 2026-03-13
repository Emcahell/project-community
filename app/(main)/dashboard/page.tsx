import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRelativeDate, getInitials } from "@/lib/utils";
import { NeedCard } from "@/components/need-card";
import { APPLICATION_STATUS } from "@/lib/constants";
import { InstitutionNeedsList } from "./institution-needs-list";
import { Plus, Settings } from "lucide-react";

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

  if (!profile) redirect("/login");

  if (profile.role === "institution") {
    return <InstitutionDashboard userId={user.id} />;
  }

  return <StudentDashboard userId={user.id} profile={profile} />;
}

async function InstitutionDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("profile_id", userId)
    .single();

  if (!institution) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Building2Icon className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">Configura tu institución</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Antes de publicar necesidades, completa el perfil de tu institución.
        </p>
        <Link href="/dashboard/institution/setup">
          <Button>Configurar institución</Button>
        </Link>
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
      <div className="relative rounded-2xl overflow-hidden bg-primary px-6 py-7 mb-8 flex items-center justify-between gap-4">
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
            Panel de institución
          </p>
          <h1 className="text-2xl font-bold text-white">{institution.name}</h1>
        </div>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
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
              className="bg-white text-primary hover:bg-white/90 font-semibold"
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
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold">{totalNeeds}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-emerald-600">{openNeeds}</p>
            <p className="text-xs text-muted-foreground mt-1">Abiertas</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-amber-600">{totalPending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Mis necesidades
        </h2>
        {totalNeeds > 0 && (
          <Link href="/dashboard/needs/new">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
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

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
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
      <div className="relative rounded-2xl overflow-hidden bg-primary px-6 py-7 mb-8 flex items-center justify-between gap-4">
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-medium uppercase tracking-widest mb-1">
            Panel de estudiante
          </p>
          <h1 className="text-2xl font-bold text-white">
            Hola, {profile.full_name?.split(" ")[0] ?? "estudiante"}
          </h1>
          <p className="text-white/65 text-sm mt-1">
            {applications?.length
              ? `${applications.length} solicitud${applications.length !== 1 ? "es" : ""} enviada${applications.length !== 1 ? "s" : ""}`
              : "Explora necesidades y aplica"}
          </p>
        </div>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
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
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-emerald-600">{accepted}</p>
            <p className="text-xs text-muted-foreground mt-1">Aceptadas</p>
          </div>
        </div>
      )}

      {/* Applications list */}
      {applications && applications.length > 0 && (
        <>
          <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-widest">
            Mis solicitudes
          </h2>
          <div className="space-y-2.5 mb-10">
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
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/25 hover:shadow-sm transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 select-none">
                    {getInitials(need?.institutions?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {need?.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {need?.institutions?.name}
                      {app.created_at && (
                        <> · {formatRelativeDate(app.created_at)}</>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${appStatus.className}`}
                  >
                    {appStatus.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Available needs */}
      {openNeeds && openNeeds.length > 0 && (
        <>
          <h2 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-widest">
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
            <p className="text-sm text-muted-foreground text-center py-8">
              Ya aplicaste a todas las necesidades disponibles.
            </p>
          )}
        </>
      )}
    </div>
  );
}
