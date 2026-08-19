"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getInitials, formatRelativeDate } from "@/lib/utils";
import { APPLICATION_STATUS } from "@/lib/constants";
import { Pagination } from "@/components/pagination";

export type StudentApplication = {
  id: string;
  status: string;
  created_at: string | null;
  needs: {
    id: string;
    title: string;
    status: string;
    institutions: { id: string; name: string; address: string | null } | null;
  } | null;
};

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "accepted", label: "Aceptados" },
  { value: "rejected", label: "Rechazados" },
];

const PAGE_SIZE = 5;

export function StudentApplicationsList({
  applications,
}: {
  applications: StudentApplication[];
}) {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const filtered = applications.filter(
    (app) => filter === "all" || app.status === filter
  );
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-1 border border-border/50 w-fit mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === f.value
                ? "bg-background text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-sm text-muted-foreground">
            No tienes solicitudes con ese filtro.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((app) => {
            const need = app.needs;
            const appStatus =
              APPLICATION_STATUS[app.status] ?? APPLICATION_STATUS.pending;
            // La necesidad fue asignada a otro estudiante: ya no está disponible
            const unavailable =
              need?.status === "approved" && app.status !== "accepted";
            const badge = unavailable
              ? {
                  label: "No disponible",
                  className: "text-muted-foreground bg-muted border-border",
                }
              : appStatus;

            return (
              <Link
                key={app.id}
                href={`/needs/${need?.id}`}
                className="group flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-px transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary/15 to-violet-500/10 border border-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 select-none">
                  {getInitials(need?.institutions?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {need?.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {need?.institutions?.name}
                    {app.created_at && (
                      <> · {formatRelativeDate(app.created_at)}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onChange={setPage}
          />
        </div>
      )}
    </>
  );
}
