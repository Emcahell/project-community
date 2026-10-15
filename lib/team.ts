import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberProfile = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

/**
 * Relación de equipo bidireccional: devuelve, para cada estudiante, los ids
 * de sus compañeros (tanto si es `owner_id` como si es `member_id`).
 */
export async function getTeamMap(
  supabase: SupabaseClient,
  studentIds: string[],
): Promise<Record<string, string[]>> {
  if (studentIds.length === 0) return {};

  const [owned, memberOf] = await Promise.all([
    supabase.from("team_members").select("owner_id, member_id").in("owner_id", studentIds),
    supabase.from("team_members").select("owner_id, member_id").in("member_id", studentIds),
  ]);

  const map: Record<string, Set<string>> = {};
  const add = (key: string, value: string) => {
    (map[key] ??= new Set()).add(value);
  };
  for (const row of owned.data ?? []) add(row.owner_id, row.member_id);
  for (const row of memberOf.data ?? []) add(row.member_id, row.owner_id);

  return Object.fromEntries(
    Object.entries(map).map(([key, set]) => [key, [...set]]),
  );
}

export async function getTeamMemberIds(
  supabase: SupabaseClient,
  studentId: string,
): Promise<string[]> {
  const map = await getTeamMap(supabase, [studentId]);
  return map[studentId] ?? [];
}

export async function getProfilesByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, MemberProfile>> {
  if (ids.length === 0) return new Map();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .in("id", ids);
  return new Map((data ?? []).map((p: MemberProfile) => [p.id, p]));
}
