import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getTeamMap, getProfilesByIds, type MemberProfile } from "@/lib/team";
import { ApplicationsList } from "./applications-list";
import { NeedActions } from "./need-actions";
import { NEED_STATUS } from "@/lib/constants";

export const metadata: Metadata = { title: "Solicitudes de la necesidad" };

export default async function NeedApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireRole("institution");

  const [{ data: need }, { data: applications }] = await Promise.all([
    supabase
      .from("needs")
      .select(`*, institutions!inner(profile_id, name), departments(name)`)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("applications")
      .select(`*, profiles(full_name, avatar_url, first_name, last_name)`)
      .eq("need_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!need) notFound();

  const institution = need.institutions as { profile_id: string; name: string };
  if (institution.profile_id !== user.id) redirect("/dashboard");

  // Integrantes del equipo de cada solicitante (relación bidireccional)
  const applicantIds = [...new Set((applications ?? []).map((a) => a.student_id as string))];
  const teamMap = await getTeamMap(supabase, applicantIds);
  const profileMap = await getProfilesByIds(
    supabase,
    [...new Set(Object.values(teamMap).flat())],
  );
  const teamMembersByStudent: Record<string, MemberProfile[]> = Object.fromEntries(
    Object.entries(teamMap).map(([studentId, ids]) => [
      studentId,
      ids.map((memberId) => profileMap.get(memberId)).filter((p): p is MemberProfile => Boolean(p)),
    ]),
  );

  const total = applications?.length ?? 0;
  const pending = applications?.filter((a) => a.status === "pending").length ?? 0;
  const accepted = applications?.filter((a) => a.status === "accepted").length ?? 0;

  const statusInfo = NEED_STATUS[need.status] ?? NEED_STATUS.open;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      <div className="mb-6">
        {need.departments && (
          <span className="text-[11px] font-medium text-muted-foreground bg-muted border border-border/60 rounded-full px-2 py-0.5">
            {(need.departments as { name: string }).name}
          </span>
        )}
        <div className="flex items-start gap-3 mt-2">
          <h1 className="text-2xl font-bold flex-1 break-words">{need.title}</h1>
          <span
            className={`shrink-0 mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>
        {need.description && (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed whitespace-pre-line">
            {need.description}
          </p>
        )}
        {need.status === "open" && (
          <div className="mt-4">
            <NeedActions needId={id} canDelete={total === 0} />
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{accepted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Aceptadas</p>
          </div>
        </div>
      )}

      <ApplicationsList applications={applications ?? []} teamMembersByStudent={teamMembersByStudent} />
    </div>
  );
}
