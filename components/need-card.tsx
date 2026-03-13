import Link from "next/link";
import { MapPin, ArrowRight, BadgeCheck } from "lucide-react";
import { formatRelativeDate, getInitials } from "@/lib/utils";
import { NEED_STATUS } from "@/lib/constants";

type NeedWithInstitution = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string | null;
  institutions: {
    id: string;
    name: string;
    address: string | null;
    verified?: boolean;
  } | null;
};

export function NeedCard({ need }: { need: NeedWithInstitution }) {
  const institutionName = need.institutions?.name ?? "";
  const status = NEED_STATUS[need.status] ?? NEED_STATUS.open;

  return (
    <Link
      href={`/needs/${need.id}`}
      className="group flex flex-col rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center text-[11px] font-bold text-primary shrink-0 select-none">
            {getInitials(institutionName)}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-medium truncate">
              {institutionName}
              {need.institutions?.verified && (
                <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              )}
            </p>
            {need.institutions?.address && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{need.institutions.address}</span>
              </p>
            )}
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatRelativeDate(need.created_at)}
        </span>
      </div>

      <h2 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors">
        {need.title}
      </h2>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
        {need.description}
      </p>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${status.className}`}
        >
          {need.status === "open" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
          {status.label}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}
