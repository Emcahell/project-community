"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users, Clock, Plus } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { NEED_STATUS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type NeedWithApps = {
  id: string;
  title: string;
  status: string;
  created_at: string | null;
  applications: { id: string; status: string }[];
};

const STATUS_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Abiertas" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed", label: "Completadas" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Más recientes" },
  { value: "oldest", label: "Más antiguas" },
  { value: "pending", label: "Más pendientes" },
];

export function InstitutionNeedsList({ needs }: { needs: NeedWithApps[] }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = needs
    .filter((n) => filter === "all" || n.status === filter)
    .sort((a, b) => {
      if (sort === "oldest")
        return (
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime()
        );
      if (sort === "pending") {
        const aPending = a.applications.filter((x) => x.status === "pending").length;
        const bPending = b.applications.filter((x) => x.status === "pending").length;
        return bPending - aPending;
      }
      return (
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
      );
    });

  if (needs.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted/20">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/15 to-violet-500/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold mb-1">Sin necesidades publicadas</p>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto leading-relaxed">
          Publica tu primera necesidad para empezar a recibir solicitudes de estudiantes.
        </p>
        <Link href="/dashboard/needs/new">
          <Button size="sm" className="shadow-sm shadow-primary/20 font-semibold">
            <Plus className="w-4 h-4 mr-1" />
            Publicar primera necesidad
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Filter & sort bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-1 bg-muted/80 rounded-xl p-1 border border-border/50">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
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

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto text-xs border border-border rounded-xl px-3 py-2 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring/50 cursor-pointer"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-sm text-muted-foreground">
            No hay necesidades con ese filtro.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((need) => {
            const applications = need.applications;
            const pending = applications.filter((a) => a.status === "pending").length;
            const accepted = applications.filter((a) => a.status === "accepted").length;
            const needStatus = NEED_STATUS[need.status] ?? NEED_STATUS.open;

            return (
              <Link
                key={need.id}
                href={`/dashboard/needs/${need.id}`}
                className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${needStatus.className}`}
                  >
                    {need.status === "open" && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5 -mb-px" />
                    )}
                    {needStatus.label}
                  </span>
                  {need.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(need.created_at)}
                    </span>
                  )}
                </div>

                <p className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors flex-1">
                  {need.title}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {applications.length}{" "}
                      {applications.length === 1 ? "solicitud" : "solicitudes"}
                    </span>
                    {pending > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Clock className="w-3 h-3" />
                        {pending} pendiente{pending > 1 ? "s" : ""}
                      </span>
                    )}
                    {accepted > 0 && pending === 0 && (
                      <span className="text-emerald-600 font-semibold">
                        {accepted} aceptada{accepted > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
