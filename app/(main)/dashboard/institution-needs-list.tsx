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
      <div className="text-center py-20 border border-dashed border-border rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold mb-1">Sin necesidades publicadas</p>
        <p className="text-sm text-muted-foreground mb-5">
          Publica tu primera necesidad para empezar a recibir solicitudes.
        </p>
        <Link href="/dashboard/needs/new">
          <Button size="sm">
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
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === f.value
                  ? "bg-background text-foreground shadow-sm"
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
          className="ml-auto text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
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
                className="group rounded-xl border border-border bg-card p-5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${needStatus.className}`}
                  >
                    {needStatus.label}
                  </span>
                  {need.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(need.created_at)}
                    </span>
                  )}
                </div>

                <p className="font-semibold text-sm leading-snug mb-3 group-hover:text-primary transition-colors">
                  {need.title}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {applications.length}{" "}
                      {applications.length === 1 ? "solicitud" : "solicitudes"}
                    </span>
                    {pending > 0 && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="w-3 h-3" />
                        {pending} pendiente{pending > 1 ? "s" : ""}
                      </span>
                    )}
                    {accepted > 0 && pending === 0 && (
                      <span className="text-emerald-600 font-medium">
                        {accepted} aceptada{accepted > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
