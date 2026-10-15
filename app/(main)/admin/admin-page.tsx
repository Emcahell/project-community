import Link from "next/link";
import Image from "next/image";
import { Building2, BadgeCheck, Search, GraduationCap } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { getDisplayName } from "@/lib/utils";
import { AdminActions } from "./admin-actions";

export const ADMIN_PAGE_SIZE = 10;

type InstitutionProfile = { full_name: string | null; avatar_url: string | null };

export type AdminInstitution = {
  id: string;
  name: string;
  address: string | null;
  verified: boolean;
  is_disabled: boolean | null;
  profiles: InstitutionProfile[] | InstitutionProfile | null;
};

export type AdminStudent = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  semester: number | null;
  is_disabled: boolean | null;
};

export type AdminTab = "institutions" | "students";
export type AdminFilter = "all" | "verified" | "unverified" | "disabled";

const FILTERS: Record<AdminTab, { value: AdminFilter; label: string }[]> = {
  institutions: [
    { value: "all", label: "Todos" },
    { value: "verified", label: "Verificados" },
    { value: "unverified", label: "Sin verificar" },
    { value: "disabled", label: "Inhabilitados" },
  ],
  students: [
    { value: "all", label: "Todos" },
    { value: "disabled", label: "Inhabilitados" },
  ],
};

function buildHref(params: Record<string, string>) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value && value !== "all"),
  ).toString();
  return search ? `/admin?${search}` : "/admin";
}

function getProfile(inst: AdminInstitution): InstitutionProfile | null {
  if (!inst.profiles) return null;
  return Array.isArray(inst.profiles) ? (inst.profiles[0] ?? null) : inst.profiles;
}

export function AdminPanel({
  tab,
  filter,
  search,
  page,
  total,
  institutionCount,
  studentCount,
  institutions,
  students,
}: {
  tab: AdminTab;
  filter: AdminFilter;
  search: string;
  page: number;
  total: number;
  institutionCount: number;
  studentCount: number;
  institutions: AdminInstitution[];
  students: AdminStudent[];
}) {
  const tabParam = tab === "students" ? "students" : "";
  const items = tab === "institutions" ? institutions : students;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona instituciones y estudiantes de la plataforma.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{institutionCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Instituciones</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{studentCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Estudiantes</p>
        </div>
      </div>

      <nav aria-label="Secciones" className="flex rounded-lg border border-border bg-muted p-1 mb-4">
        {(
          [
            { value: "institutions", label: "Instituciones", icon: Building2 },
            { value: "students", label: "Estudiantes", icon: GraduationCap },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <Link
            key={value}
            href={buildHref({ tab: value === "students" ? "students" : "" })}
            aria-current={tab === value ? "page" : undefined}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1.5 flex-1 flex-wrap">
          {FILTERS[tab].map((f) => (
            <Link
              key={f.value}
              href={buildHref({ tab: tabParam, filter: f.value, q: search })}
              aria-current={filter === f.value ? "true" : undefined}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                filter === f.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <form action="/admin" role="search" className="relative">
          {tabParam && <input type="hidden" name="tab" value={tabParam} />}
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Buscar..."
            aria-label="Buscar"
            className="pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </form>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No hay {tab === "institutions" ? "instituciones" : "estudiantes"} con estos filtros.
            </p>
          </div>
        ) : tab === "institutions" ? (
          institutions.map((inst) => <InstitutionRow key={inst.id} institution={inst} />)
        ) : (
          students.map((student) => <StudentRow key={student.id} student={student} />)
        )}
      </div>

      {total > ADMIN_PAGE_SIZE && (
        <div className="mt-6 pt-4 border-t border-border">
          <Pagination
            href={buildHref({ tab: tabParam, filter, q: search })}
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
          />
        </div>
      )}
    </div>
  );
}

function InstitutionRow({ institution }: { institution: AdminInstitution }) {
  const profile = getProfile(institution);
  const disabled = Boolean(institution.is_disabled);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${disabled ? "opacity-60" : ""}`}
    >
      <Link
        href={`/admin/institutions/${institution.id}`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={institution.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm truncate">{institution.name}</p>
            {institution.verified && (
              <BadgeCheck
                className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0"
                aria-label="Verificada"
              />
            )}
            {disabled && (
              <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">
                Inhabilitada
              </span>
            )}
          </div>
          {institution.address && (
            <p className="text-xs text-muted-foreground truncate">{institution.address}</p>
          )}
        </div>
      </Link>
      <AdminActions
        kind="institution"
        id={institution.id}
        verified={institution.verified}
        disabled={disabled}
      />
    </div>
  );
}

function StudentRow({ student }: { student: AdminStudent }) {
  const disabled = Boolean(student.is_disabled);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${disabled ? "opacity-60" : ""}`}
    >
      <Link
        href={`/admin/students/${student.id}`}
        className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm truncate">{getDisplayName(student)}</p>
          {disabled && (
            <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">
              Inhabilitado
            </span>
          )}
        </div>
        {student.semester && (
          <p className="text-xs text-muted-foreground">{student.semester}° Trayecto</p>
        )}
      </Link>
      <AdminActions kind="student" id={student.id} disabled={disabled} />
    </div>
  );
}
