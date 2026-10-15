import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowRight, BadgeCheck, Clock } from "lucide-react";
import { formatRelativeDate, getInitials } from "@/lib/utils";
import { NEED_STATUS } from "@/lib/constants";

export type NeedCardData = {
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
    profiles?: { avatar_url: string | null } | null;
  } | null;
};

export function NeedCard({ need }: { need: NeedCardData }) {
  const institutionName = need.institutions?.name ?? "";
  const institutionAvatar = need.institutions?.profiles?.avatar_url ?? null;
  const status = NEED_STATUS[need.status] ?? NEED_STATUS.open;

  return (
    <Link
      href={`/needs/${need.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/8 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-border/60 select-none">
            {institutionAvatar ? (
              <Image
                src={institutionAvatar}
                alt={institutionName}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-primary/15 to-violet-500/10 flex items-center justify-center text-[11px] font-bold text-primary">
                {getInitials(institutionName)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs font-semibold truncate text-foreground/90">
              {institutionName}
              {need.institutions?.verified && (
                <BadgeCheck
                  className="w-3.5 h-3.5 text-sky-500 shrink-0"
                  aria-label="Institución verificada"
                />
              )}
            </p>
            {need.institutions?.address && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{need.institutions.address}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="w-3 h-3" />
          {formatRelativeDate(need.created_at)}
        </div>
      </div>

      <h2 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors">
        {need.title}
      </h2>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1 leading-relaxed">
        {need.description}
      </p>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}
        >
          {need.status === "open" && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          )}
          {status.label}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
          <span className="font-medium">Ver detalle</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
