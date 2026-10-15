import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getTeamMemberIds, getProfilesByIds } from "@/lib/team";
import { TeamManager } from "./team-manager";

export const metadata: Metadata = { title: "Mi equipo" };

export default async function TeamPage() {
  const { supabase, user } = await requireRole("student");

  const memberIds = await getTeamMemberIds(supabase, user.id);
  const memberProfiles = [...(await getProfilesByIds(supabase, memberIds)).values()];

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gestionar equipo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agrega integrantes a tu equipo con su correo electrónico. Estos aparecerán cuando envíes
          una solicitud a una institución.
        </p>
      </div>

      <TeamManager
        initialMembers={memberProfiles}
      />
    </div>
  );
}
