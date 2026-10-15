import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { NeedCard, type NeedCardData } from "@/components/need-card";
import { Pagination } from "@/components/pagination";
import { StatGrid } from "@/components/stat-grid";
import { NeedSearch } from "@/components/need-search";
import { getSession, type CurrentProfile } from "@/lib/auth";
import { getTeamMemberIds, getProfilesByIds } from "@/lib/team";
import { getDisplayName } from "@/lib/utils";
import { sanitizeSearch } from "@/lib/search";
import {
  InstitutionNeedsList,
  INSTITUTION_NEEDS_PAGE_SIZE,
} from "./institution-needs-list";
import { InstitutionSetupForm } from "./institution/setup/institution-setup-form";
import {
  StudentApplicationsList,
  type StudentApplication,
} from "./student-applications-list";

export const metadata: Metadata = { title: "Panel" };

const STUDENT_NEEDS_PAGE_SIZE = 10;

type SearchParams = { [key: string]: string | string[] | undefined };

function pageNumber(value: string | string[] | undefined): number {
  const n = Number(typeof value === "string" ? value : undefined);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { user, profile } = await getSession();

  if (!user) redirect("/login");

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

  if (profile.role === "admin") redirect("/admin");

  if (profile.role === "institution") {
    return (
      <InstitutionDashboard
        userId={user.id}
        initialName={profile.full_name ?? ""}
        initialEmail={user.email ?? ""}
        status={param(params.status) || "all"}
        page={pageNumber(params.page)}
      />
    );
  }

  return (
    <StudentDashboard
      userId={user.id}
      profile={profile}
      needsPage={pageNumber(params.np)}
      query={param(params.q)}
    />
  );
}

async function InstitutionDashboard({
  userId,
  initialName,
  initialEmail,
  status,
  page,
}: {
  userId: string;
  initialName: string;
  initialEmail: string;
  status: string;
  page: number;
}) {
  const { supabase } = await getSession();

  const { data: institution } = await supabase
    .from("institutions")
    .select("id, name")
    .eq("profile_id", userId)
    .maybeSingle();

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
        <InstitutionSetupForm initialName={initialName} initialEmail={initialEmail} />
      </div>
    );
  }

  const validStatus = status === "open" || status === "approved" ? status : "all";

  // Conteos con `head: true`: la base cuenta sin devolver filas
  const countApplications = (appStatus: string) =>
    supabase
      .from("applications")
      .select("id, needs!inner(institution_id)", { count: "exact", head: true })
      .eq("needs.institution_id", institution.id)
      .eq("status", appStatus);

  let filteredQuery = supabase
    .from("needs")
    .select("id", { count: "exact", head: true })
    .eq("institution_id", institution.id);
  if (validStatus !== "all") filteredQuery = filteredQuery.eq("status", validStatus);

  const [totalNeedsRes, pendingRes, acceptedRes, filteredRes] = await Promise.all([
    supabase
      .from("needs")
      .select("id", { count: "exact", head: true })
      .eq("institution_id", institution.id),
    countApplications("pending"),
    countApplications("accepted"),
    filteredQuery,
  ]);

  const filteredTotal = filteredRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / INSTITUTION_NEEDS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Página actual de necesidades (solo se trae lo que se muestra)
  let needsQuery = supabase
    .from("needs")
    .select(`id, title, status, created_at, applications(id, status), departments(name)`)
    .eq("institution_id", institution.id);
  if (validStatus !== "all") needsQuery = needsQuery.eq("status", validStatus);
  const { data: needs } = await needsQuery
    .order("created_at", { ascending: false })
    .range(
      (safePage - 1) * INSTITUTION_NEEDS_PAGE_SIZE,
      safePage * INSTITUTION_NEEDS_PAGE_SIZE - 1,
    );

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card px-6 py-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">
            Panel de institución
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{institution.name}</h1>
        </div>
        <StatGrid
          stats={[
            { label: "Necesidades", value: totalNeedsRes.count ?? 0 },
            { label: "Pendientes", value: pendingRes.count ?? 0, tone: "warning" },
            { label: "Aprobadas", value: acceptedRes.count ?? 0, tone: "success" },
          ]}
        />
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
          department:
            (n.departments as unknown as { name: string } | null)?.name ?? null,
        }))}
        status={validStatus}
        page={safePage}
        total={filteredTotal}
        baseHref="/dashboard"
      />
    </div>
  );
}

const APPLICATION_SELECT = `id, status, created_at, student_id, needs (id, title, status, institutions (id, name, address))`;

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string | null;
  student_id: string;
  needs: unknown;
};

async function StudentDashboard({
  userId,
  profile,
  needsPage,
  query,
}: {
  userId: string;
  profile: CurrentProfile;
  needsPage: number;
  query: string;
}) {
  const { supabase } = await getSession();

  const teamMemberIds = await getTeamMemberIds(supabase, userId);

  // Solicitudes propias + del equipo y nombres del equipo, en paralelo
  const [{ data: ownApps }, { data: teamApps }, teamProfiles] = await Promise.all([
    supabase
      .from("applications")
      .select(APPLICATION_SELECT)
      .eq("student_id", userId)
      .order("created_at", { ascending: false }),
    teamMemberIds.length > 0
      ? supabase
          .from("applications")
          .select(APPLICATION_SELECT)
          .in("student_id", teamMemberIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as ApplicationRow[] }),
    getProfilesByIds(supabase, teamMemberIds),
  ]);

  const own = (ownApps ?? []) as ApplicationRow[];
  const ownAppIds = new Set(own.map((a) => a.id));
  const applications = [
    ...own.map((a) => ({ ...a, student_name: null as string | null })),
    ...((teamApps ?? []) as ApplicationRow[])
      .filter((a) => !ownAppIds.has(a.id))
      .map((a) => ({
        ...a,
        student_name: getDisplayName(teamProfiles.get(a.student_id), "Compañero"),
      })),
  ].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const appliedNeedIds = [
    ...new Set(
      applications
        .map((a) => (a.needs as unknown as { id: string } | null)?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const pending = applications.filter((a) => a.status === "pending").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const totalApplications = applications.length;

  // Necesidades abiertas de instituciones habilitadas, sin las ya solicitadas
  const search = sanitizeSearch(query);
  const buildNeedsQuery = (select: string, head = false) => {
    let q = supabase
      .from("needs")
      .select(select, head ? { count: "exact", head: true } : { count: "exact" })
      .eq("status", "open")
      .not("institutions.is_disabled", "is", true);
    if (appliedNeedIds.length > 0) {
      q = q.not("id", "in", `(${appliedNeedIds.join(",")})`);
    }
    if (search) {
      q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    return q;
  };

  const { count: availableCount } = await buildNeedsQuery("id, institutions!inner(is_disabled)", true);
  const availableTotal = availableCount ?? 0;
  const safeNeedsPage = Math.min(
    needsPage,
    Math.max(1, Math.ceil(availableTotal / STUDENT_NEEDS_PAGE_SIZE)),
  );

  const { data: openNeeds } = await buildNeedsQuery(
    `id, title, description, status, created_at, institutions!inner (id, name, address, verified, is_disabled, profiles (avatar_url))`,
  )
    .order("created_at", { ascending: false })
    .range(
      (safeNeedsPage - 1) * STUDENT_NEEDS_PAGE_SIZE,
      safeNeedsPage * STUDENT_NEEDS_PAGE_SIZE - 1,
    );

  const firstName = profile.first_name ?? profile.full_name?.split(" ")[0] ?? "estudiante";
  const needsHref = search ? `/dashboard?q=${encodeURIComponent(search)}` : "/dashboard";

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card px-6 py-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">
            Panel de estudiante
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Hola, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {totalApplications
              ? `${totalApplications} solicitud${totalApplications !== 1 ? "es" : ""} enviada${totalApplications !== 1 ? "s" : ""}`
              : "Explora necesidades y aplica a la que más te interese"}
          </p>
        </div>
        <StatGrid
          stats={[
            { label: "Total", value: totalApplications },
            { label: "Pendientes", value: pending, tone: "warning" },
            { label: "Aceptadas", value: accepted, tone: "success" },
          ]}
        />
      </div>

      {applications.length > 0 && (
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Necesidades disponibles
        </h2>
        <NeedSearch defaultValue={search} />
      </div>

      {availableTotal === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/20">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium">
            {search ? "Sin resultados" : "¡Todo al día!"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {search
              ? "No hay necesidades que coincidan con tu búsqueda."
              : "No hay necesidades nuevas disponibles por ahora."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {((openNeeds ?? []) as unknown as NeedCardData[]).map((need) => (
              <NeedCard key={need.id} need={need} />
            ))}
          </div>
          {availableTotal > STUDENT_NEEDS_PAGE_SIZE && (
            <div className="mt-5">
              <Pagination
                href={needsHref}
                paramName="np"
                page={safeNeedsPage}
                pageSize={STUDENT_NEEDS_PAGE_SIZE}
                total={availableTotal}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
