import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TeamManager } from "./team-manager";

export default async function TeamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") redirect("/dashboard");

  // Fetch all team members: where user is owner OR member (bidirectional)
  const { data: ownedRows } = await supabase
    .from("team_members")
    .select("member_id")
    .eq("owner_id", user.id);

  const { data: memberOfRows } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id);

  const memberIds = [
    ...new Set([
      ...(ownedRows ?? []).map((r) => r.member_id),
      ...(memberOfRows ?? []).map((r) => r.owner_id),
    ]),
  ];

  let memberProfiles: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
  }[] = [];

  if (memberIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name")
      .in("id", memberIds);
    memberProfiles = data ?? [];
  }

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
          Busca y agrega integrantes a tu equipo. Estos aparecerán cuando envíes
          una solicitud a una institución.
        </p>
      </div>

      <TeamManager
        userId={user.id}
        initialMembers={memberProfiles}
      />
    </div>
  );
}
