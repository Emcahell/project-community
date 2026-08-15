import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { NeedCard } from "@/components/need-card";
import { InstitutionNeedsList } from "./institution-needs-list";
import { InstitutionSetupForm } from "./institution/setup/institution-setup-form";
import {
  StudentApplicationsList,
  type StudentApplication,
} from "./student-applications-list";
import { CheckCircle2 } from "lucide-react";

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
    .select(`*, applications(id, status), departments(name)`)
    .eq("institution_id", institution.id)
    .order("created_at", { ascending: false });

  const totalNeeds = needs?.length ?? 0;
  const countApps = (status: string) =>
    needs?.reduce((acc, n) => {
      const apps = n.applications as { status: string }[];
      return acc + apps.filter((a) => a.status === status).length;
    }, 0) ?? 0;
  const totalPending = countApps("pending");
  const totalApproved = countApps("accepted");

  return (
    <div>
      {/* Header banner */}
      <div className="rounded-2xl border border-border bg-card px-6 py-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">
            Panel de institución
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {institution.name}
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-2 shrink-0 w-full sm:w-auto">
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg font-bold tracking-tight">{totalNeeds}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg font-bold tracking-tight text-amber-600">
              {totalPending}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Pendientes</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg font-bold tracking-tight text-emerald-600">
              {totalApproved}
            </p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Aprobadas</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Mis necesidades
        </h2>
      </div>

      <InstitutionNeedsList
        needs={(needs ?? []).map((n) => ({
          ...n,
          applications: n.applications as { id: string; status: string }[],
          department: (n.departments as { name: string } | null)?.name ?? null,
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
      .select(`*, institutions (id, name, address, verified, profiles (avatar_url))`)
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

  const totalApplications = applications?.length ?? 0;

  return (
    <div>
      {/* Header banner */}
      <div className="rounded-2xl border border-border bg-card px-6 py-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">
            Panel de estudiante
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Hola, {profile.full_name?.split(" ")[0] ?? "estudiante"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {totalApplications
              ? `${totalApplications} solicitud${totalApplications !== 1 ? "es" : ""} enviada${totalApplications !== 1 ? "s" : ""}`
              : "Explora necesidades y aplica al que más te interese"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 shrink-0 w-full sm:w-auto">
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg font-bold tracking-tight">{totalApplications}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg font-bold tracking-tight text-amber-600">{pending}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Pendientes</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg font-bold tracking-tight text-emerald-600">{accepted}</p>
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Aceptadas</p>
          </div>
        </div>
      </div>

      {/* Applications list */}
      {applications && applications.length > 0 && (
        <>
          <h2 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest">
            Mis solicitudes
          </h2>
          <div className="mb-10">
            <StudentApplicationsList
              applications={applications as unknown as StudentApplication[]}
            />
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
