"use client";

import { useState } from "react";
import { ApplicationCard } from "./application-card";
import { Users } from "lucide-react";

type ApplicationWithProfile = {
  id: string;
  message: string | null;
  status: string;
  created_at: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "accepted", label: "Aceptadas" },
  { value: "rejected", label: "Rechazadas" },
];

export function ApplicationsList({
  applications,
}: {
  applications: ApplicationWithProfile[];
}) {
  const [filter, setFilter] = useState("all");

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    accepted: applications.filter((a) => a.status === "accepted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const filtered = applications.filter(
    (a) => filter === "all" || a.status === filter
  );

  if (applications.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
        <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
          <Users className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-semibold mb-1">Sin solicitudes aún</p>
        <p className="text-sm text-muted-foreground">
          Cuando los estudiantes apliquen a esta necesidad, aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 mb-4 w-fit">
        {FILTERS.map((f) => {
          const count = counts[f.value as keyof typeof counts];
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1 rounded-full ${
                    filter === f.value
                      ? "bg-primary/10 text-primary"
                      : "bg-muted-foreground/15 text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl bg-card">
          <p className="text-sm text-muted-foreground">
            No hay solicitudes {FILTERS.find((f) => f.value === filter)?.label.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </>
  );
}
