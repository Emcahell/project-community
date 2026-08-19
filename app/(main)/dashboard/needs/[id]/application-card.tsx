"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { getInitials, formatRelativeDate } from "@/lib/utils";
import { APPLICATION_STATUS } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { toast } from "sonner";
import { X, Users } from "lucide-react";
import {
  rejectionReasonSchema,
  MAX_REJECTION_REASON,
  type RejectionReasonValues,
} from "@/lib/validations";

type TeamMember = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type Application = {
  id: string;
  message: string | null;
  status: string;
  rejection_reason?: string | null;
  created_at: string | null;
  profiles: { full_name: string | null; avatar_url: string | null; first_name: string | null; last_name: string | null } | null;
};

export function ApplicationCard({
  application,
  teamMembers,
}: {
  application: Application;
  teamMembers?: TeamMember[];
}) {
  const [status, setStatus] = useState(application.status);
  const [reason, setReason] = useState(application.rejection_reason ?? null);
  const [loading, setLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<RejectionReasonValues>({
    resolver: zodResolver(rejectionReasonSchema),
    defaultValues: { reason: "" },
  });
  const reasonLength = watch("reason").length;

  async function updateStatus(newStatus: "accepted" | "rejected", rejectionReason?: string) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("applications")
      .update(
        newStatus === "rejected"
          ? { status: newStatus, rejection_reason: rejectionReason ?? null }
          : { status: newStatus }
      )
      .eq("id", application.id);

    if (error) {
      toast.error("No se pudo actualizar el estado. Intenta de nuevo.");
    } else {
      setStatus(newStatus);
      if (newStatus === "rejected") setReason(rejectionReason ?? null);
      toast.success(
        newStatus === "accepted"
          ? "Solicitud aceptada. El estudiante fue notificado."
          : "Solicitud rechazada."
      );
    }
    setLoading(false);
  }

  async function onReject(values: RejectionReasonValues) {
    setRejectOpen(false);
    reset();
    await updateStatus("rejected", values.reason.trim());
  }

  const statusInfo = APPLICATION_STATUS[status] ?? APPLICATION_STATUS.pending;
  const profile = application.profiles;
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ") || profile?.full_name || "Estudiante";
  const avatar = profile?.avatar_url;

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
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
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{name}</p>
                {teamMembers && teamMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTeamOpen(true)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    Ver integrantes
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatRelativeDate(application.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {status === "rejected" && reason && (
          <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-4 py-3 leading-relaxed">
            <span className="font-medium">Motivo del rechazo: </span>
            {reason}
          </div>
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
              onClick={() => setRejectOpen(true)}
              disabled={loading}
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
            >
              Rechazar
            </Button>
          </div>
        )}
      </div>

      {teamOpen && teamMembers && teamMembers.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Integrantes del equipo"
        >
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => setTeamOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Integrantes del equipo</h3>
              </div>
              <button
                type="button"
                onClick={() => setTeamOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {getInitials(name)}
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">Solicitante</p>
                </div>
              </div>
              {teamMembers.map((m) => {
                const memberName = [m.first_name, m.last_name]
                  .filter(Boolean)
                  .join(" ") || m.full_name || "Sin nombre";
                return (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {getInitials(memberName)}
                    </div>
                    <p className="text-sm font-medium">{memberName}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Rechazar solicitud"
        >
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => setRejectOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Rechazar solicitud</h3>
              <button
                type="button"
                onClick={() => setRejectOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Indica el motivo por el que rechazas la solicitud de{" "}
              <span className="font-medium text-foreground">{name}</span>. El
              estudiante podrá ver este motivo.
            </p>
            <form onSubmit={handleSubmit(onReject)} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Motivo</label>
                  <span
                    className={`text-xs tabular-nums ${
                      reasonLength > MAX_REJECTION_REASON
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {reasonLength}/{MAX_REJECTION_REASON}
                  </span>
                </div>
                <textarea
                  placeholder="Ej: el perfil no coincide con lo que buscamos..."
                  rows={4}
                  autoFocus
                  {...register("reason")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                {errors.reason && (
                  <p className="text-xs text-destructive">{errors.reason.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading || reasonLength > MAX_REJECTION_REASON}
                  className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                >
                  {loading ? "Rechazando..." : "Rechazar solicitud"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRejectOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
