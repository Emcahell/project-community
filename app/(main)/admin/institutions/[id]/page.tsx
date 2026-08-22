import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, ArrowLeft, Building2, MapPin, Phone, Mail, Globe, Calendar } from "lucide-react";

type Schedule = {
  days: string[];
  open_time: string;
  close_time: string;
} | null;

const DAY_LABELS: Record<string, string> = {
  lun: "Lun",
  mar: "Mar",
  mie: "Mié",
  jue: "Jue",
  vie: "Vie",
  sab: "Sáb",
  dom: "Dom",
};

export default async function InstitutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch institution
  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .single();

  if (!institution) notFound();

  // Fetch profile data
  const { data: instProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", institution.profile_id)
    .single();

  // Fetch needs
  const { data: needs } = await supabase
    .from("needs")
    .select("id, title, description, status, created_at, departments (name)")
    .eq("institution_id", id)
    .order("created_at", { ascending: false });

  const schedule = institution.schedule as Schedule;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      {/* Institution header */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
            {instProfile?.avatar_url ? (
              <Image
                src={instProfile.avatar_url}
                alt={institution.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{institution.name}</h1>
              {institution.verified && (
                <BadgeCheck className="w-5 h-5 text-sky-500 shrink-0" />
              )}
              {institution.is_disabled && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                  Inhabilitada
                </span>
              )}
            </div>
            {institution.description && (
              <p className="text-sm text-muted-foreground mt-2">{institution.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Institution info */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <h2 className="text-sm font-semibold mb-4">Información de contacto</h2>
        <div className="space-y-3">
          {instProfile?.email && (
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Correo" value={instProfile.email} />
          )}
          {institution.address && (
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={institution.address} />
          )}
          {institution.phone && (
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Contacto" value={institution.phone} />
          )}
          {institution.email && instProfile?.email !== institution.email && (
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Correo de contacto" value={institution.email} />
          )}
          {institution.website && (
            <InfoRow icon={<Globe className="w-4 h-4" />} label="Sitio web" value={institution.website} />
          )}
        </div>
      </div>

      {/* Schedule */}
      {schedule && schedule.days && schedule.days.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-4">Horario de atención</h2>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {Object.entries(DAY_LABELS).map(([key, label]) => (
                <span
                  key={key}
                  className={`text-xs px-2 py-1 rounded ${
                    schedule.days.includes(key)
                      ? "bg-primary/10 text-primary font-medium"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {schedule.open_time} – {schedule.close_time}
            </div>
          </div>
        </div>
      )}

      {/* Needs */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">
          Necesidades publicadas ({needs?.length ?? 0})
        </h2>
        {needs && needs.length > 0 ? (
          <div className="space-y-3">
            {needs.map((need) => (
              <div
                key={need.id}
                className="flex items-start gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">{need.title}</p>
                  <NeedStatusBadge status={need.status} />
                </div>
                {(() => {
                  const dept = need.departments as { name: string }[] | { name: string } | null;
                  const deptName = Array.isArray(dept) ? dept[0]?.name : dept?.name;
                  return deptName ? (
                    <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {deptName}
                    </span>
                  ) : null;
                })()}
                  {need.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                      {need.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Esta institución no tiene necesidades publicadas.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function NeedStatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded shrink-0">
        Aprobada
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 px-2 py-0.5 rounded shrink-0">
      Abierta
    </span>
  );
}
