import type { SupabaseClient } from "@supabase/supabase-js";

/** Institución del usuario y sus departamentos (para formularios de necesidad). */
export async function getInstitutionWithDepartments(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: institution } = await supabase
    .from("institutions")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  if (!institution) return null;

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("institution_id", institution.id)
    .order("name", { ascending: true });

  return {
    institutionId: institution.id as string,
    departments: (departments ?? []) as { id: string; name: string }[],
  };
}
