"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize } from "@/lib/auth";
import { type ActionResult, failure } from "@/lib/errors";
import { getTeamMemberIds, type MemberProfile } from "@/lib/team";
import { teamSchema } from "@/lib/validations";

const emailSchema = z.string().trim().toLowerCase().email();

/**
 * Busca un estudiante por su correo EXACTO. No se permiten búsquedas
 * parciales para que nadie pueda listar los correos de otros estudiantes,
 * y solo se devuelven nombre e id (nunca el correo).
 */
export async function findStudentByEmail(
  email: string,
): Promise<{ error: string } | { error?: undefined; student: MemberProfile | null }> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { student: null };

  const auth = await authorize("student");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name")
    .eq("role", "student")
    .ilike("email", parsed.data.replace(/[%_\\]/g, "\\$&"))
    .neq("id", user.id)
    .limit(1)
    .maybeSingle();
  if (error) return failure("findStudentByEmail", error);

  return { student: (data as MemberProfile | null) ?? null };
}

export async function saveTeam(memberIds: string[]): Promise<ActionResult> {
  const parsed = teamSchema.safeParse([...new Set(memberIds)]);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Equipo inválido." };

  const auth = await authorize("student");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const desired = parsed.data.filter((id) => id !== user.id);

  // Solo se pueden agregar estudiantes existentes y habilitados
  if (desired.length > 0) {
    const { data: valid } = await supabase
      .from("profiles")
      .select("id, is_disabled")
      .in("id", desired)
      .eq("role", "student");
    const validIds = new Set(
      (valid ?? []).filter((p) => !p.is_disabled).map((p) => p.id as string),
    );
    if (desired.some((id) => !validIds.has(id))) {
      return { error: "Alguno de los integrantes no es un estudiante válido." };
    }
  }

  const current = new Set(await getTeamMemberIds(supabase, user.id));
  const desiredSet = new Set(desired);
  const toAdd = desired.filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !desiredSet.has(id));

  if (toRemove.length > 0) {
    // La relación es bidireccional: borrar en ambos sentidos
    const [asOwner, asMember] = await Promise.all([
      supabase.from("team_members").delete().eq("owner_id", user.id).in("member_id", toRemove),
      supabase.from("team_members").delete().eq("member_id", user.id).in("owner_id", toRemove),
    ]);
    const error = asOwner.error ?? asMember.error;
    if (error) return failure("saveTeam.remove", error, "Error al eliminar integrantes.");
  }

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from("team_members")
      .insert(toAdd.map((id) => ({ owner_id: user.id, member_id: id })));
    if (error) return failure("saveTeam.add", error, "Error al agregar integrantes.");
  }

  revalidatePath("/dashboard", "layout");
  return { success: true as const };
}
