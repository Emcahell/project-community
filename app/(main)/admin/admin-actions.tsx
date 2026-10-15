"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  verifyInstitution,
  toggleInstitutionDisabled,
  toggleStudentDisabled,
} from "@/app/actions/admin";

const BASE =
  "text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50";
const NEUTRAL = "border-border bg-background text-muted-foreground";

export function AdminActions({
  kind,
  id,
  verified,
  disabled,
}: {
  kind: "institution" | "student";
  id: string;
  verified?: boolean;
  disabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: () => Promise<{ error?: string }>) {
    setLoading(true);
    const result = await action();
    if (result.error) toast.error(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {kind === "institution" && (
        <button
          type="button"
          onClick={() => run(() => verifyInstitution(id, !verified))}
          disabled={loading}
          aria-pressed={verified}
          className={`${BASE} ${
            verified
              ? "border-sky-300 bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 hover:bg-sky-200"
              : `${NEUTRAL} hover:border-sky-300 hover:text-sky-600`
          }`}
        >
          {loading ? "..." : verified ? "Verificada" : "Verificar"}
        </button>
      )}
      <button
        type="button"
        onClick={() =>
          run(() =>
            kind === "institution"
              ? toggleInstitutionDisabled(id, !disabled)
              : toggleStudentDisabled(id, !disabled),
          )
        }
        disabled={loading}
        className={`${BASE} ${
          disabled
            ? "border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
            : `${NEUTRAL} hover:border-red-300 hover:text-red-600`
        }`}
      >
        {loading ? "..." : disabled ? "Habilitar" : "Inhabilitar"}
      </button>
    </div>
  );
}
