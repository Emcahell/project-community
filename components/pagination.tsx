"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  pageSize,
  total,
  href,
  paramName = "page",
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** Si se pasa, la paginación navega por URL (?paramName=N) en lugar de estado local */
  href?: string;
  paramName?: string;
  /** Si se pasa, la paginación usa estado local (botones) */
  onChange?: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const disabledClass =
    "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground/40 opacity-60 pointer-events-none select-none";
  const controlClass =
    "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border bg-background hover:border-primary/40 hover:text-foreground transition-colors";

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const sep = href && href.includes("?") ? "&" : "?";
  const prevHref = href ? `${href}${sep}${paramName}=${page - 1}` : undefined;
  const nextHref = href ? `${href}${sep}${paramName}=${page + 1}` : undefined;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground tabular-nums">
        Mostrando {start}–{end} de {total}
      </p>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <span className={disabledClass}>
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </span>
        ) : prevHref ? (
          <Link href={prevHref} className={controlClass}>
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onChange?.(page - 1)}
            className={controlClass}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>
        )}

        {nextDisabled ? (
          <span className={disabledClass}>
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        ) : nextHref ? (
          <Link href={nextHref} className={controlClass}>
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onChange?.(page + 1)}
            className={controlClass}
          >
            Siguiente
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
