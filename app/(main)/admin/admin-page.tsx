"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  BadgeCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { verifyInstitution, toggleInstitutionDisabled, toggleStudentDisabled } from "@/app/actions/profile";
import { getInitials } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

type InstitutionProfile = { full_name: string | null; avatar_url: string | null };

type Institution = {
  id: string;
  name: string;
  address: string | null;
  verified: boolean;
  is_disabled: boolean;
  profiles: InstitutionProfile[] | InstitutionProfile | null;
};

type Student = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  semester: number | null;
  is_disabled: boolean;
};

type TabType = "institutions" | "students";
type InstitutionFilter = "all" | "verified" | "unverified" | "disabled";
type StudentFilter = "all" | "disabled";

function getProfile(inst: Institution): InstitutionProfile | null {
  if (!inst.profiles) return null;
  return Array.isArray(inst.profiles) ? inst.profiles[0] ?? null : inst.profiles;
}

export function AdminPageClient({
  institutions,
  students,
}: {
  institutions: Institution[];
  students: Student[];
}) {
  const [tab, setTab] = useState<TabType>("institutions");
  const [instFilter, setInstFilter] = useState<InstitutionFilter>("all");
  const [studentFilter, setStudentFilter] = useState<StudentFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  const filteredInstitutions = useMemo(() => {
    let result = institutions;

    if (instFilter === "verified") result = result.filter((i) => i.verified && !i.is_disabled);
    else if (instFilter === "unverified") result = result.filter((i) => !i.verified && !i.is_disabled);
    else if (instFilter === "disabled") result = result.filter((i) => i.is_disabled);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => {
        const profile = getProfile(i);
        return (
          i.name.toLowerCase().includes(q) ||
          profile?.full_name?.toLowerCase().includes(q) ||
          i.address?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [institutions, instFilter, search]);

  const filteredStudents = useMemo(() => {
    let result = students;

    if (studentFilter === "disabled") result = result.filter((s) => s.is_disabled);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        const name = s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
        return name.toLowerCase().includes(q);
      });
    }

    return result;
  }, [students, studentFilter, search]);

  const currentItems = tab === "institutions" ? filteredInstitutions : filteredStudents;
  const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona instituciones y estudiantes de la plataforma.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{institutions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Instituciones</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{students.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Estudiantes</p>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex rounded-lg border border-border bg-muted p-1 mb-4">
        <button
          onClick={() => { setTab("institutions"); setSearch(""); setPage(1); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "institutions"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Instituciones
        </button>
        <button
          onClick={() => { setTab("students"); setSearch(""); setPage(1); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "students"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Estudiantes
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1.5 flex-1 flex-wrap">
          {tab === "institutions" ? (
            <>
              <FilterButton active={instFilter === "all"} onClick={() => { setInstFilter("all"); resetPage(); }}>Todos</FilterButton>
              <FilterButton active={instFilter === "verified"} onClick={() => { setInstFilter("verified"); resetPage(); }}>Verificados</FilterButton>
              <FilterButton active={instFilter === "unverified"} onClick={() => { setInstFilter("unverified"); resetPage(); }}>Sin verificar</FilterButton>
              <FilterButton active={instFilter === "disabled"} onClick={() => { setInstFilter("disabled"); resetPage(); }}>Inhabilitados</FilterButton>
            </>
          ) : (
            <>
              <FilterButton active={studentFilter === "all"} onClick={() => { setStudentFilter("all"); resetPage(); }}>Todos</FilterButton>
              <FilterButton active={studentFilter === "disabled"} onClick={() => { setStudentFilter("disabled"); resetPage(); }}>Inhabilitados</FilterButton>
            </>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {tab === "institutions" ? (
          filteredInstitutions.length > 0 ? (
            filteredInstitutions
              .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
              .map((inst) => (
                <InstitutionCard key={inst.id} institution={inst} />
              ))
          ) : (
            <EmptyState message="No hay instituciones con estos filtros." />
          )
        ) : filteredStudents.length > 0 ? (
          filteredStudents
            .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
            .map((student) => (
              <StudentCard key={student.id} student={student} />
            ))
        ) : (
          <EmptyState message="No hay estudiantes con estos filtros." />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, currentItems.length)} de {currentItems.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground px-2">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InstitutionCard({ institution }: { institution: Institution }) {
  const [verified, setVerified] = useState(institution.verified);
  const [disabled, setDisabled] = useState(institution.is_disabled);
  const [loading, setLoading] = useState(false);
  const profile = getProfile(institution);

  async function handleVerify() {
    setLoading(true);
    const result = await verifyInstitution(institution.id, !verified);
    if (!result?.error) setVerified((v) => !v);
    setLoading(false);
  }

  async function handleToggleDisabled() {
    setLoading(true);
    const result = await toggleInstitutionDisabled(institution.id, !disabled);
    if (!result?.error) setDisabled((d) => !d);
    setLoading(false);
  }

  return (
    <Link
      href={`/admin/institutions/${institution.id}`}
      className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors ${disabled ? "opacity-60" : ""}`}
    >
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={institution.name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized
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
          {verified && <BadgeCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
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

      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
        <button
          onClick={handleVerify}
          disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
            verified
              ? "border-sky-300 bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 hover:bg-sky-200"
              : "border-border bg-background text-muted-foreground hover:border-sky-300 hover:text-sky-600"
          }`}
        >
          {loading ? "..." : verified ? "Verificada" : "Verificar"}
        </button>
        <button
          onClick={handleToggleDisabled}
          disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
            disabled
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
              : "border-border bg-background text-muted-foreground hover:border-red-300 hover:text-red-600"
          }`}
        >
          {loading ? "..." : disabled ? "Habilitar" : "Inhabilitar"}
        </button>
      </div>
    </Link>
  );
}

function StudentCard({ student }: { student: Student }) {
  const [disabled, setDisabled] = useState(student.is_disabled);
  const [loading, setLoading] = useState(false);

  const displayName =
    student.full_name || `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Sin nombre";

  async function handleToggleDisabled() {
    setLoading(true);
    const result = await toggleStudentDisabled(student.id, !disabled);
    if (!result?.error) setDisabled((d) => !d);
    setLoading(false);
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border border-border bg-card p-4 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-sm truncate">{displayName}</p>
          {disabled && (
            <span className="text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">
              Inhabilitado
            </span>
          )}
        </div>
        {student.semester && (
          <p className="text-xs text-muted-foreground">{student.semester}° Trayecto</p>
        )}
      </div>

      <div className="shrink-0">
        <button
          onClick={handleToggleDisabled}
          disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
            disabled
              ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
              : "border-border bg-background text-muted-foreground hover:border-red-300 hover:text-red-600"
          }`}
        >
          {loading ? "..." : disabled ? "Habilitar" : "Inhabilitar"}
        </button>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
