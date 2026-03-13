"use client";

import { useState } from "react";
import { verifyInstitution } from "@/app/actions/profile";

export function VerifyButton({
  institutionId,
  verified,
}: {
  institutionId: string;
  verified: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(verified);

  async function toggle() {
    setLoading(true);
    const result = await verifyInstitution(institutionId, !current);
    if (!result?.error) setCurrent((v) => !v);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
        current
          ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
          : "border-border bg-background text-muted-foreground hover:border-sky-300 hover:text-sky-600"
      }`}
    >
      {loading ? "..." : current ? "Verificada" : "Verificar"}
    </button>
  );
}
