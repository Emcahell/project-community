import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, GraduationCap, Mail } from "lucide-react";
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
    </div>
  );
}
