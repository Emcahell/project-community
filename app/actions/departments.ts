"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authorize } from "@/lib/auth";
import { type ActionResult, failure, UNIQUE_VIOLATION } from "@/lib/errors";
import { departmentSchema, idSchema, type DepartmentValues } from "@/lib/validations";

const DUPLICATE = "Ya existe un departamento con ese nombre.";

async function ownInstitutionId(): Promise<
  { error: string } | { supabase: SupabaseClient; institutionId: string }
> {
  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;
  const { data } = await supabase
    .from("institutions")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!data) return { error: "No se encontró tu institución." };
  return { supabase, institutionId: data.id as string };
}

export async function createDepartment(values: DepartmentValues): Promise<ActionResult<{ success: true; department: { id: string; name: string; created_at: string | null } }>> {
  const parsed = departmentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const ctx = await ownInstitutionId();
  if ("error" in ctx) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("departments")
    .insert({ institution_id: ctx.institutionId, name: parsed.data.name })
    .select("id, name, created_at")
    .single();
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { error: DUPLICATE };
    return failure("createDepartment", error, "Ocurrió un error al guardar el departamento.");
  }

  revalidatePath("/dashboard/departments");
  return { success: true as const, department: data };
}

export async function updateDepartment(departmentId: string, values: DepartmentValues): Promise<ActionResult> {
  if (!idSchema.safeParse(departmentId).success) return { error: "Departamento inválido." };
  const parsed = departmentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const ctx = await ownInstitutionId();
  if ("error" in ctx) return { error: ctx.error };

  const { data, error } = await ctx.supabase
    .from("departments")
    .update({ name: parsed.data.name })
    .eq("id", departmentId)
    .eq("institution_id", ctx.institutionId)
    .select("id");
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { error: DUPLICATE };
    return failure("updateDepartment", error, "Ocurrió un error al actualizar el departamento.");
  }
  if (!data || data.length === 0) return { error: "No se encontró el departamento." };

  revalidatePath("/dashboard/departments");
  return { success: true as const };
}

export async function deleteDepartment(departmentId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(departmentId).success) return { error: "Departamento inválido." };

  const ctx = await ownInstitutionId();
  if ("error" in ctx) return { error: ctx.error };

  const { error } = await ctx.supabase
    .from("departments")
    .delete()
    .eq("id", departmentId)
    .eq("institution_id", ctx.institutionId);
  if (error) return failure("deleteDepartment", error, "Ocurrió un error al eliminar el departamento.");

  revalidatePath("/dashboard/departments");
  return { success: true as const };
}
