import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Globe, Clock, Users } from "lucide-react";
import { ApplyButton } from "./apply-button";
import { formatRelativeDate } from "@/lib/utils";
import { NEED_STATUS, APPLICATION_STATUS } from "@/lib/constants";
import { WEEK_DAYS } from "@/lib/validations"

export default async function NeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: need } = await supabase
    .from("needs")
    .select(`*, institutions (id, name, address, phone, website, description, schedule)`)
    .eq("id", id)
    .single();

  if (!need) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: string | null = null;
  let userName: string | null = null;
  let studentApplications: {
    id: string;
    status: string;
    rejection_reason: string | null;
    created_at: string | null;
  }[] = [];

  let teamMembers: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }[] = [];

  // Teammates who also applied to this need (with their team members)
  type TeammateInfo = {
    studentId: string;
    studentName: string;
    status: string;
    members: { id: string; full_name: string | null; first_name: string | null; last_name: string | null }[];
  };
  const teammateApplications: TeammateInfo[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, first_name, last_name, full_name")
      .eq("id", user.id)
      .single();
    userRole = profile?.role ?? null;
    userName = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ") || profile?.full_name || null;

    if (userRole === "student") {
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, rejection_reason, created_at")
        .eq("need_id", id)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      studentApplications = applications ?? [];

      // Fetch team members if student has an active application (pending or accepted)
      const hasActiveApplication = studentApplications.some(
        (a) => a.status === "pending" || a.status === "accepted"
      );
      if (hasActiveApplication) {
        // Fetch from both directions (bidirectional team)
        const { data: ownedRows } = await supabase
          .from("team_members")
          .select("member_id")
          .eq("owner_id", user.id);
        const { data: memberOfRows } = await supabase
          .from("team_members")
          .select("owner_id")
          .eq("member_id", user.id);
        const allMemberIds = [
          ...new Set([
            ...(ownedRows ?? []).map((r) => r.member_id),
            ...(memberOfRows ?? []).map((r) => r.owner_id),
          ]),
        ];
        if (allMemberIds.length > 0) {
          const { data } = await supabase
            .from("profiles")
            .select("id, full_name, first_name, last_name")
            .in("id", allMemberIds);
          teamMembers = data ?? [];
        }
      }

      // Fetch teammate applications (other students who applied to same need)
      const { data: otherApps } = await supabase
        .from("applications")
        .select("student_id, status")
        .eq("need_id", id)
        .neq("student_id", user.id)
        .in("status", ["pending", "accepted"]);

      if (otherApps && otherApps.length > 0) {
        const otherStudentIds = [...new Set(otherApps.map((a) => a.student_id))];

        // Fetch their team members
        const { data: otherOwned } = await supabase
          .from("team_members")
          .select("owner_id, member_id")
          .in("owner_id", otherStudentIds);
        const { data: otherMemberOf } = await supabase
          .from("team_members")
          .select("member_id, owner_id")
          .in("member_id", otherStudentIds);

        // Build team map: studentId -> memberIds
        const teamMap: Record<string, Set<string>> = {};
        for (const row of otherOwned ?? []) {
          if (!teamMap[row.owner_id]) teamMap[row.owner_id] = new Set();
          teamMap[row.owner_id].add(row.member_id);
        }
        for (const row of otherMemberOf ?? []) {
          if (!teamMap[row.member_id]) teamMap[row.member_id] = new Set();
          teamMap[row.member_id].add(row.owner_id);
        }

        // Fetch all profiles needed
        const allNeededIds = [...new Set([
          ...otherStudentIds,
          ...Object.values(teamMap).flatMap((s) => [...s]),
        ])];
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, first_name, last_name")
          .in("id", allNeededIds);
        const profileMap = new Map((allProfiles ?? []).map((p) => [p.id, p]));

        // Build teammate info
        for (const app of otherApps) {
          const profile = profileMap.get(app.student_id);
          const studentName = profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.full_name || "Compañero"
            : "Compañero";
          const memberIds = teamMap[app.student_id];
          const members = memberIds
            ? [...memberIds].map((id) => profileMap.get(id)).filter(Boolean) as { id: string; full_name: string | null; first_name: string | null; last_name: string | null }[]
            : [];
          teammateApplications.push({
            studentId: app.student_id,
            studentName,
            status: app.status,
            members,
          });
        }
      }
    }
  }

  const institution = need.institutions as {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    website: string | null;
    description: string | null;
    schedule: { days: string[]; open_time: string; close_time: string } | null;
  } | null;

  const dayLabel = (value: string) =>
    WEEK_DAYS.find((d) => d.value === value)?.label ?? value;

  const statusInfo = NEED_STATUS[need.status] ?? NEED_STATUS.open;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
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
        <h1 className="text-2xl font-bold leading-snug">{need.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Publicado por{" "}
          <span className="font-medium text-foreground">
            {institution?.name}
          </span>
        </p>
      </div>

      <p className="text-foreground/80 leading-relaxed text-sm mb-8">
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
            {institution.schedule &&
              institution.schedule.days.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {institution.schedule.days
                      .map(dayLabel)
                      .join(", ")}
                    <span className="mx-1">·</span>
                    {institution.schedule.open_time} –{" "}
                    {institution.schedule.close_time}
                  </span>
                </div>
              )}
            {institution.website && (
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
        user={user}
        userRole={userRole}
        needStatus={need.status}
        applications={studentApplications}
        institution={institution}
      />

      {/* Mi equipo - solo para estudiantes con solicitud activa */}
      {userRole === "student" &&
        teamMembers.length > 0 &&
        studentApplications.some(
          (a) => a.status === "pending" || a.status === "accepted"
        ) && (
          <div className="rounded-xl border border-border bg-card p-5 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Mi equipo</h2>
            </div>
            <div className="space-y-2">
              {/* El propio estudiante siempre es primero */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  Tú
                </div>
                <p className="text-sm font-medium">{userName ?? user?.email} (tú)</p>
              </div>
              {teamMembers.map((m) => {
                const name = [m.first_name, m.last_name]
                  .filter(Boolean)
                  .join(" ") || m.full_name || "Sin nombre";
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {initials}
                    </div>
                    <p className="text-sm font-medium">{name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Equipos de compañeros que también aplicaron */}
      {userRole === "student" &&
        teammateApplications.length > 0 && (
          <div className="mt-4 space-y-4">
            {teammateApplications.map((t) => (
              <div key={t.studentId} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">
                    Equipo de {t.studentName}
                  </h2>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                      APPLICATION_STATUS[t.status]?.className ?? ""
                    }`}
                  >
                    {APPLICATION_STATUS[t.status]?.label ?? t.status}
                  </span>
                </div>
                {t.members.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Este estudiante no tiene equipo registrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* El compañero que hizo la solicitud */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {t.studentName
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <p className="text-sm font-medium">
                        {t.studentName}
                        <span className="text-muted-foreground font-normal ml-1">(solicitante)</span>
                      </p>
                    </div>
                    {t.members.map((m) => {
                      const name = [m.first_name, m.last_name]
                        .filter(Boolean)
                        .join(" ") || m.full_name || "Sin nombre";
                      const initials = name
                        .split(" ")
                        .map((w) => w[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      return (
                        <div key={m.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {initials}
                          </div>
                          <p className="text-sm font-medium">{name}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
