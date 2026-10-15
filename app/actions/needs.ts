"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authorize } from "@/lib/auth";
import { type ActionResult, failure } from "@/lib/errors";
import { needSchema, idSchema, type NeedValues } from "@/lib/validations";

async function getOwnInstitution(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("institutions")
    .select("id, is_disabled")
    .eq("profile_id", userId)
    .maybeSingle();
  return data as { id: string; is_disabled: boolean | null } | null;
}

/** El departamento, si se indica, debe pertenecer a la institución. */
async function validDepartment(
  supabase: SupabaseClient,
  institutionId: string,
  departmentId: string | undefined,
) {
  if (!departmentId) return true;
  const { data } = await supabase
    .from("departments")
    .select("id")
    .eq("id", departmentId)
    .eq("institution_id", institutionId)
    .maybeSingle();
  return Boolean(data);
}

async function getOwnedNeed(supabase: SupabaseClient, needId: string, institutionId: string) {
  const { data } = await supabase
    .from("needs")
    .select("id, status")
    .eq("id", needId)
    .eq("institution_id", institutionId)
    .maybeSingle();
  return data as { id: string; status: string } | null;
}

export async function createNeed(values: NeedValues): Promise<ActionResult> {
  const parsed = needSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const institution = await getOwnInstitution(supabase, user.id);
  if (!institution) return { error: "Primero completa la configuración de tu institución." };
  if (institution.is_disabled) return { error: "Tu institución está inhabilitada." };

  const { title, description, department_id } = parsed.data;
  if (!(await validDepartment(supabase, institution.id, department_id))) {
    return { error: "El departamento seleccionado no es válido." };
  }

  const { error } = await supabase.from("needs").insert({
    institution_id: institution.id,
    title,
    description,
    department_id: department_id || null,
  });
  if (error) return failure("createNeed", error, "Ocurrió un error al publicar la necesidad.");

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function updateNeed(needId: string, values: NeedValues): Promise<ActionResult> {
  if (!idSchema.safeParse(needId).success) return { error: "Necesidad inválida." };
  const parsed = needSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const institution = await getOwnInstitution(supabase, user.id);
  if (!institution) return { error: "No se encontró tu institución." };

  const need = await getOwnedNeed(supabase, needId, institution.id);
  if (!need) return { error: "No se encontró la necesidad." };
  if (need.status !== "open") return { error: "No se puede editar una necesidad ya asignada." };

  const { title, description, department_id } = parsed.data;
  if (!(await validDepartment(supabase, institution.id, department_id))) {
    return { error: "El departamento seleccionado no es válido." };
  }

  const { error } = await supabase
    .from("needs")
    .update({ title, description, department_id: department_id || null })
    .eq("id", needId);
  if (error) return failure("updateNeed", error, "No se pudo guardar la necesidad.");

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/needs/${needId}`);
  revalidatePath(`/needs/${needId}`);
  return { success: true as const };
}

export async function deleteNeed(needId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(needId).success) return { error: "Necesidad inválida." };

  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const institution = await getOwnInstitution(supabase, user.id);
  if (!institution) return { error: "No se encontró tu institución." };

  const need = await getOwnedNeed(supabase, needId, institution.id);
  if (!need) return { error: "No se encontró la necesidad." };

  // Conservar el historial de los estudiantes que ya aplicaron
  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("need_id", needId);
  if ((count ?? 0) > 0) {
    return { error: "No se puede eliminar una necesidad que ya recibió solicitudes." };
  }

  const { error } = await supabase.from("needs").delete().eq("id", needId);
  if (error) return failure("deleteNeed", error, "No se pudo eliminar la necesidad.");

  revalidatePath("/dashboard");
  return { success: true as const };
}
