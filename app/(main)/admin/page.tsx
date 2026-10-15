import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { sanitizeSearch } from "@/lib/search";
import {
  AdminPanel,
  ADMIN_PAGE_SIZE,
  type AdminInstitution,
  type AdminStudent,
  type AdminFilter,
  type AdminTab,
} from "./admin-page";

export const metadata: Metadata = { title: "Administración" };

type SearchParams = { [key: string]: string | string[] | undefined };

const INSTITUTION_FILTERS = ["all", "verified", "unverified", "disabled"] as const;
const STUDENT_FILTERS = ["all", "disabled"] as const;

function str(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { supabase } = await requireRole("admin");

  const tab: AdminTab = str(params.tab) === "students" ? "students" : "institutions";
  const allowedFilters: readonly string[] =
    tab === "institutions" ? INSTITUTION_FILTERS : STUDENT_FILTERS;
  const filter = (allowedFilters.includes(str(params.filter)) ? str(params.filter) : "all") as AdminFilter;
  const search = sanitizeSearch(str(params.q));
  const requestedPage = Math.max(1, Math.floor(Number(str(params.page)) || 1));
  const from = (requestedPage - 1) * ADMIN_PAGE_SIZE;
  const to = from + ADMIN_PAGE_SIZE - 1;

  // Totales generales para las tarjetas de estadísticas
  const [institutionCount, studentCount] = await Promise.all([
    supabase.from("institutions").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
  ]);

  let institutions: AdminInstitution[] = [];
  let students: AdminStudent[] = [];
  let total = 0;

  if (tab === "institutions") {
    let query = supabase
      .from("institutions")
      .select("id, name, address, verified, is_disabled, profiles (full_name, avatar_url)", {
        count: "exact",
      });
    if (filter === "verified") query = query.eq("verified", true).not("is_disabled", "is", true);
    if (filter === "unverified") query = query.eq("verified", false).not("is_disabled", "is", true);
    if (filter === "disabled") query = query.eq("is_disabled", true);
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);

    const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);
    institutions = (data ?? []) as unknown as AdminInstitution[];
    total = count ?? 0;
  } else {
    let query = supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, avatar_url, semester, is_disabled", {
        count: "exact",
      })
      .eq("role", "student");
    if (filter === "disabled") query = query.eq("is_disabled", true);
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`,
      );
    }

    const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);
    students = (data ?? []) as AdminStudent[];
    total = count ?? 0;
  }

  return (
    <AdminPanel
      tab={tab}
      filter={filter}
      search={search}
      page={requestedPage}
      total={total}
      institutionCount={institutionCount.count ?? 0}
      studentCount={studentCount.count ?? 0}
      institutions={institutions}
      students={students}
    />
  );
}
