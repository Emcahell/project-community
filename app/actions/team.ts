"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveTeam(memberIds: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") return { error: "No autorizado" };

  // Fetch current team (both directions) to compute diff
  const { data: ownedRows } = await supabase
    .from("team_members")
    .select("member_id")
    .eq("owner_id", user.id);
  const { data: memberOfRows } = await supabase
    .from("team_members")
    .select("owner_id")
    .eq("member_id", user.id);

  const currentIds = new Set([
    ...(ownedRows ?? []).map((r) => r.member_id),
    ...(memberOfRows ?? []).map((r) => r.owner_id),
  ]);
  const desiredIds = new Set(memberIds);

  // Members to add (in desired but not in current)
  const toAdd = memberIds.filter((id) => !currentIds.has(id));
  // Members to remove (in current but not in desired)
  const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

  // Remove deleted members (only from owner side; bidirectional trigger handles the inverse)
  for (const memberId of toRemove) {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("owner_id", user.id)
      .eq("member_id", memberId);
    if (error) return { error: "Error al eliminar integrante: " + error.message };
  }

  // Add new members (only truly new ones)
  if (toAdd.length > 0) {
    const rows = toAdd.map((id) => ({
      owner_id: user.id,
      member_id: id,
    }));
    const { error } = await supabase.from("team_members").insert(rows);
    if (error) return { error: "Error al agregar integrante: " + error.message };
  }

  return { success: true };
}
