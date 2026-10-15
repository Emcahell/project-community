import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, GraduationCap, Mail, Calendar } from "lucide-react";
import { getInitials } from "@/lib/utils";

const TRACK_LABELS: Record<number, string> = {
  2: "2° Trayecto",
  3: "3° Trayecto",
  4: "4° Trayecto",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireRole("admin");

  // Fetch student
  const { data: student } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "student")
    .single();

  if (!student) notFound();

  // Fetch applications with need info
  const { data: applications } = await supabase
    .from("applications")
    .select(`
      id,
      status,
      rejection_reason,
      created_at,
      needs (
        title,
        institutions (name)
      )
    `)
    .eq("student_id", id)
    .order("created_at", { ascending: false });

  const displayName =
    student.full_name || `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Sin nombre";

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      {/* Student header */}
      <div className="rounded-xl border border-border bg-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
            {student.avatar_url ? (
              <Image
                src={student.avatar_url}
                alt={displayName}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                {getInitials(displayName)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{displayName}</h1>
              {student.is_disabled && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                  Inhabilitado
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {student.semester && (
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {TRACK_LABELS[student.semester] || `${student.semester}° Trayecto`}
                </span>
              )}
              {student.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {student.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">
          Solicitudes enviadas ({applications?.length ?? 0})
        </h2>
        {applications && applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => {
              const rawNeed = app.needs as {
                title: string;
                institutions: { name: string }[] | { name: string } | null;
              }[] | {
                title: string;
                institutions: { name: string }[] | { name: string } | null;
              } | null;
              const need = Array.isArray(rawNeed) ? rawNeed[0] ?? null : rawNeed;

              return (
                <div
                  key={app.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {need?.title ?? "Necesidad eliminada"}
                      </p>
                      {(() => {
                        const instRaw = need?.institutions;
                        const instName = Array.isArray(instRaw) ? instRaw[0]?.name : instRaw?.name;
                        return instName ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {instName}
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                  {app.rejection_reason && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Motivo de rechazo: {app.rejection_reason}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(app.created_at).toLocaleDateString("es-VE")}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Este estudiante no ha enviado solicitudes.
          </p>
        )}
      </div>
    </div>
  );
}

function ApplicationStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "accepted":
      return (
        <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded shrink-0">
          Aceptada
        </span>
      );
    case "rejected":
      return (
        <span className="text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded shrink-0">
          Rechazada
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded shrink-0">
          Pendiente
        </span>
      );
  }
}
