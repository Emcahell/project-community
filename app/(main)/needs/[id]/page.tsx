import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Globe, Clock, BadgeCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getTeamMemberIds, getTeamMap, getProfilesByIds, type MemberProfile } from "@/lib/team";
import { formatRelativeDate, getDisplayName } from "@/lib/utils";
import { NEED_STATUS } from "@/lib/constants";
import { WEEK_DAYS } from "@/lib/validations";
import { ApplyButton } from "./apply-button";
import { TeamCard } from "./team-card";

type StudentApplication = {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string | null;
};

type TeammateInfo = {
  studentId: string;
  studentName: string;
  status: string;
  members: MemberProfile[];
};

type InstitutionInfo = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  description: string | null;
  verified: boolean | null;
  is_disabled: boolean | null;
  schedule: { days: string[]; open_time: string; close_time: string } | null;
};

async function getNeed(id: string) {
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("needs")
    .select(
      `*, institutions (id, name, address, phone, website, description, schedule, verified, is_disabled)`,
    )
    .eq("id", id)
    .maybeSingle();
  const institution = data?.institutions as InstitutionInfo | null | undefined;
  if (!data || institution?.is_disabled) return null;
  return { ...data, institution: institution ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const need = await getNeed(id);
  return need
    ? { title: need.title, description: need.description?.slice(0, 160) }
    : { title: "Necesidad no encontrada" };
}

export default async function NeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [need, { supabase, user, profile }] = await Promise.all([getNeed(id), getSession()]);
  if (!need) notFound();

  const userRole = profile?.role ?? null;
  let studentApplications: StudentApplication[] = [];
  let teamMembers: MemberProfile[] = [];
  const teammateApplications: TeammateInfo[] = [];

  if (user && userRole === "student") {
    const [{ data: applications }, teamIds] = await Promise.all([
      supabase
        .from("applications")
        .select("id, status, rejection_reason, created_at")
        .eq("need_id", id)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false }),
      getTeamMemberIds(supabase, user.id),
    ]);
    studentApplications = applications ?? [];

    // Solo se muestran las solicitudes de compañeros de MI equipo (no las de
    // cualquier estudiante), para no exponer quién más aplicó.
    const { data: teammateApps } =
      teamIds.length > 0
        ? await supabase
            .from("applications")
            .select("student_id, status")
            .eq("need_id", id)
            .in("student_id", teamIds)
            .in("status", ["pending", "accepted"])
        : { data: [] as { student_id: string; status: string }[] };

    const applicantIds = [...new Set((teammateApps ?? []).map((a) => a.student_id))];
    const teamMap = await getTeamMap(supabase, applicantIds);
    const profileMap = await getProfilesByIds(supabase, [
      ...new Set([...teamIds, ...applicantIds, ...Object.values(teamMap).flat()]),
    ]);

    const hasActiveApplication = studentApplications.some(
      (a) => a.status === "pending" || a.status === "accepted",
    );
    if (hasActiveApplication) {
      teamMembers = teamIds
        .map((memberId) => profileMap.get(memberId))
        .filter((p): p is MemberProfile => Boolean(p));
    }

    for (const app of teammateApps ?? []) {
      teammateApplications.push({
        studentId: app.student_id,
        studentName: getDisplayName(profileMap.get(app.student_id), "Compañero"),
        status: app.status,
        members: (teamMap[app.student_id] ?? [])
          .map((memberId) => profileMap.get(memberId))
          .filter((p): p is MemberProfile => Boolean(p)),
      });
    }
  }

  const institution = need.institution;
  const dayLabel = (value: string) =>
    WEEK_DAYS.find((d) => d.value === value)?.label ?? value;
  const statusInfo = NEED_STATUS[need.status] ?? NEED_STATUS.open;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={user ? "/dashboard" : "/"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
          {need.created_at && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeDate(need.created_at)}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold leading-snug break-words">{need.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Publicado por{" "}
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            {institution?.name}
            {institution?.verified && (
              <BadgeCheck className="w-4 h-4 text-sky-500" aria-label="Institución verificada" />
            )}
          </span>
        </p>
      </div>

      <p className="text-foreground/80 leading-relaxed text-sm mb-8 whitespace-pre-line">
        {need.description}
      </p>

      {institution && (
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <h2 className="font-semibold text-sm mb-3">Sobre la institución</h2>
          {institution.description && (
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              {institution.description}
            </p>
          )}
          <div className="space-y-2">
            {institution.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{institution.address}</span>
              </div>
            )}
            {institution.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{institution.phone}</span>
              </div>
            )}
            {institution.schedule && institution.schedule.days.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {institution.schedule.days.map(dayLabel).join(", ")}
                  <span className="mx-1">·</span>
                  {institution.schedule.open_time} – {institution.schedule.close_time}
                </span>
              </div>
            )}
            {institution.website && /^https?:\/\//i.test(institution.website) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4 shrink-0" />
                <a
                  href={institution.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-foreground transition-colors"
                >
                  {institution.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <ApplyButton
        needId={id}
        isLoggedIn={Boolean(user)}
        userRole={userRole}
        needStatus={need.status}
        applications={studentApplications}
        institution={institution}
      />

      {/* Mi equipo - solo para estudiantes con solicitud activa */}
      {teamMembers.length > 0 && (
        <TeamCard
          title="Mi equipo"
          leader={{ name: getDisplayName(profile, user?.email ?? "Tú"), suffix: "(tú)" }}
          members={teamMembers}
        />
      )}

      {/* Solicitudes de compañeros de mi equipo para esta misma necesidad */}
      {teammateApplications.map((t) => (
        <TeamCard
          key={t.studentId}
          title={`Equipo de ${t.studentName}`}
          status={t.status}
          leader={{ name: t.studentName, suffix: "(solicitante)" }}
          members={t.members}
        />
      ))}
    </div>
  );
}
