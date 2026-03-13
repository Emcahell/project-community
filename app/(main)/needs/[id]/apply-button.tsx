"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

const MAX_CHARS = 500;

export function ApplyButton({
  needId,
  user,
  userRole,
  alreadyApplied,
  needStatus,
}: {
  needId: string;
  user: User | null;
  userRole: string | null;
  alreadyApplied: boolean;
  needStatus: string;
}) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(alreadyApplied);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="rounded-xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Inicia sesión como estudiante para solicitar trabajar en esta necesidad.
        </p>
        <Link href="/login">
          <Button>Iniciar sesión</Button>
        </Link>
      </div>
    );
  }

  if (userRole !== "student" || needStatus !== "open") return null;

  if (applied) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-medium">Solicitud enviada</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            La institución revisará tu solicitud pronto.
          </p>
        </div>
      </div>
    );
  }

  async function handleApply() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("applications").insert({
      need_id: needId,
      student_id: user!.id,
      message: message.trim() || null,
    });
    if (error) {
      if (error.code === "23505") {
        setApplied(true); // ya existe en BD (doble envío)
      } else {
        setError("Ocurrió un error al enviar tu solicitud.");
      }
    } else {
      setApplied(true);
    }
    setLoading(false);
  }

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)}>Solicitar participar</Button>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-sm">Tu solicitud</h3>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Mensaje{" "}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              message.length > MAX_CHARS ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {message.length}/{MAX_CHARS}
          </span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntale a la institución por qué eres el indicado para este proyecto..."
          rows={4}
          maxLength={MAX_CHARS}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          onClick={handleApply}
          disabled={loading || message.length > MAX_CHARS}
        >
          {loading ? "Enviando..." : "Enviar solicitud"}
        </Button>
        <Button variant="outline" onClick={() => setShowForm(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
