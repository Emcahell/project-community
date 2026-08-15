import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Globe, Clock } from "lucide-react";
import { ApplyButton } from "./apply-button";
import { formatRelativeDate } from "@/lib/utils";
import { NEED_STATUS } from "@/lib/constants";
import { WEEK_DAYS } from "@/lib/validations";

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
  let studentApplications: {
    id: string;
    status: string;
    rejection_reason: string | null;
    created_at: string | null;
  }[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    userRole = profile?.role ?? null;

    if (userRole === "student") {
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, rejection_reason, created_at")
        .eq("need_id", id)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      studentApplications = applications ?? [];
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
    </div>
  );
}
