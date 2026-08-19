"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  applicationSchema,
  MAX_APPLICATION_MESSAGE,
  type ApplicationValues,
} from "@/lib/validations";
import { CheckCircle2, XCircle, History, MapPin, Phone } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { APPLICATION_STATUS } from "@/lib/constants";
import { Pagination } from "@/components/pagination";

type StudentApplication = {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string | null;
};

type InstitutionInfo = {
  name: string;
  address: string | null;
  phone: string | null;
};

export function ApplyButton({
  needId,
  needStatus,
  user,
  userRole,
  applications,
  institution,
}: {
  needId: string;
  needStatus: string;
  user: User | null;
  userRole: string | null;
  applications: StudentApplication[];
  institution?: InstitutionInfo | null;
}) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apps, setApps] = useState(applications);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { message: "" },
  });
  const message = watch("message");

  const latest = apps[0] ?? null;
  const history = apps.slice(1);

  async function handleApply(values: ApplicationValues) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("applications")
      .insert({
        need_id: needId,
        student_id: user!.id,
        message: values.message.trim() || null,
      })
      .select("id, status, rejection_reason, created_at")
      .single();
    if (error) {
      setError("Ocurrió un error al enviar tu solicitud.");
    } else if (data) {
      setApps((prev) => [data, ...prev]);
      setShowForm(false);
    }
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Inicia sesión como estudiante para solicitar trabajar en esta necesidad.
        </p>
        <Link href="/login">
          <Button>Iniciar sesión</Button>
        </Link>
      </div>
    );
  }

  if (userRole !== "student") return null;

  // ---------- Necesidad aprobada ----------
  if (needStatus === "approved") {
    if (latest?.status === "accepted") {
      return (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-300 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ¡Solicitud aprobada!
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            Ya puedes ir a{" "}
            <span className="font-semibold">{institution?.name ?? "la institución"}</span>
            {institution?.address && (
              <>
                {" "}
                (<MapPin className="w-3.5 h-3.5 inline -mt-0.5" /> {institution.address})
              </>
            )}
            {institution?.phone && (
              <>
                {" "}
                · <Phone className="w-3.5 h-3.5 inline -mt-0.5" /> {institution.phone}
              </>
            )}
            . Recuerda llevar tu{" "}
            <span className="font-semibold">carta de aceptación</span> emitida por la
            universidad, firmada por el coordinador de tu carrera.
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <XCircle className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
        <p className="font-semibold text-sm">No disponible</p>
        <p className="text-xs text-muted-foreground mt-1">
          Esta necesidad ya fue asignada a otro estudiante.
        </p>
      </div>
    );
  }

  // ---------- Necesidad abierta, sin solicitudes ----------
  if (!latest) {
    if (!showForm) {
      return (
        <Button onClick={() => setShowForm(true)}>Solicitar participar</Button>
      );
    }
    return (
      <ApplyForm
        loading={loading}
        error={error}
        message={message}
        register={register}
        errors={errors}
        onSubmit={handleSubmit(handleApply)}
        onCancel={() => {
          setShowForm(false);
          setError(null);
        }}
        submitLabel={loading ? "Enviando..." : "Enviar solicitud"}
      />
    );
  }

  // ---------- Solicitud pendiente ----------
  if (latest.status === "pending") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-medium">Solicitud enviada</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              La institución revisará tu solicitud pronto.
            </p>
          </div>
        </div>
        {history.length > 0 && <HistoryList history={history} />}
      </div>
    );
  }

  // ---------- Solicitud rechazada: se puede volver a aplicar ----------
  if (latest.status === "rejected") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-5">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-300 shrink-0" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              Solicitud rechazada
            </p>
          </div>
          {latest.rejection_reason && (
            <p className="text-sm text-foreground/80 leading-relaxed">
              <span className="font-medium">Motivo: </span>
              {latest.rejection_reason}
            </p>
          )}
          {!showForm && (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Enviar nueva solicitud
            </Button>
          )}
          {showForm && (
            <div className="mt-4">
              <ApplyForm
                loading={loading}
                error={error}
                message={message}
                register={register}
                errors={errors}
                onSubmit={handleSubmit(handleApply)}
                onCancel={() => {
                  setShowForm(false);
                  setError(null);
                }}
                submitLabel={loading ? "Enviando..." : "Enviar solicitud"}
              />
            </div>
          )}
        </div>
        {history.length > 0 && <HistoryList history={history} />}
      </div>
    );
  }

  return null;
}

function ApplyForm({
  loading,
  error,
  message,
  register,
  errors,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  loading: boolean;
  error: string | null;
  message: string;
  register: UseFormRegister<ApplicationValues>;
  errors: FieldErrors<ApplicationValues>;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-sm">Tu solicitud</h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Mensaje <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              message.length > MAX_APPLICATION_MESSAGE
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {message.length}/{MAX_APPLICATION_MESSAGE}
          </span>
        </div>
        <textarea
          placeholder="Cuéntale a la institución por qué eres el indicado para este proyecto..."
          rows={4}
          {...register("message")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {errors.message && (
          <p className="text-xs text-destructive">{errors.message.message}</p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          onClick={onSubmit}
          disabled={loading || message.length > MAX_APPLICATION_MESSAGE}
        >
          {submitLabel}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function HistoryList({ history }: { history: StudentApplication[] }) {
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const start = (page - 1) * PAGE_SIZE;
  const visible = history.slice(start, start + PAGE_SIZE);

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        <History className="w-3.5 h-3.5" />
        Historial de solicitudes
      </p>
      <div className="space-y-2.5">
        {visible.map((app) => {
          const statusInfo =
            APPLICATION_STATUS[app.status] ?? APPLICATION_STATUS.pending;
          return (
            <div key={app.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span
                  className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.className}`}
                >
                  {statusInfo.label}
                </span>
                {app.status === "rejected" && app.rejection_reason && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Motivo: {app.rejection_reason}
                  </p>
                )}
              </div>
              {app.created_at && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeDate(app.created_at)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {history.length > PAGE_SIZE && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={history.length}
          onChange={setPage}
        />
      )}
    </div>
  );
}
