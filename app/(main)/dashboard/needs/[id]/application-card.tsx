"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { getInitials, formatRelativeDate } from "@/lib/utils";
import { APPLICATION_STATUS } from "@/lib/constants";
import Image from "next/image";
import { toast } from "sonner";
import { FileText } from "lucide-react";

type Application = {
  id: string;
  message: string | null;
  status: string;
  created_at: string | null;
  profiles: { full_name: string | null; avatar_url: string | null; cv_url?: string | null } | null;
};

export function ApplicationCard({ application }: { application: Application }) {
  const [status, setStatus] = useState(application.status);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: "accepted" | "rejected") {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", application.id);

    if (error) {
      toast.error("No se pudo actualizar el estado. Intenta de nuevo.");
    } else {
      setStatus(newStatus);
      toast.success(
        newStatus === "accepted" ? "Solicitud aceptada." : "Solicitud rechazada."
      );
    }
    setLoading(false);
  }

  const statusInfo = APPLICATION_STATUS[status] ?? APPLICATION_STATUS.pending;
  const profile = application.profiles;
  const name = profile?.full_name ?? "Estudiante";
  const avatar = profile?.avatar_url;
  const cvUrl = profile?.cv_url;

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-muted shrink-0 select-none">
            {avatar ? (
              <Image
                src={avatar}
                alt={name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {getInitials(name)}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{name}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(application.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cvUrl && (
            <a
              href={cvUrl.split("?")[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              Ver CV
            </a>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {application.message && (
        <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-3 leading-relaxed">
          &ldquo;{application.message}&rdquo;
        </p>
      )}

      {status === "pending" && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => updateStatus("accepted")}
            disabled={loading}
          >
            Aceptar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => updateStatus("rejected")}
            disabled={loading}
            className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
          >
            Rechazar
          </Button>
        </div>
      )}
    </div>
  );
}
