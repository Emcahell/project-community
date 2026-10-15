"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth";
import { type ActionResult, failure } from "@/lib/errors";
import { idSchema } from "@/lib/validations";

export async function verifyInstitution(institutionId: string, verified: boolean): Promise<ActionResult> {
  const auth = await authorize("admin");
  if (auth.error !== undefined) return { error: auth.error };
  if (!idSchema.safeParse(institutionId).success) return { error: "Institución inválida." };

  const { error } = await auth.session.supabase
    .from("institutions")
    .update({ verified: Boolean(verified) })
    .eq("id", institutionId);
  if (error) return failure("verifyInstitution", error);

  revalidatePath("/admin", "layout");
  return { success: true as const };
}

export async function toggleInstitutionDisabled(institutionId: string, disabled: boolean): Promise<ActionResult> {
  const auth = await authorize("admin");
  if (auth.error !== undefined) return { error: auth.error };
  if (!idSchema.safeParse(institutionId).success) return { error: "Institución inválida." };

  const { error } = await auth.session.supabase
    .from("institutions")
    .update({ is_disabled: Boolean(disabled) })
    .eq("id", institutionId);
  if (error) return failure("toggleInstitutionDisabled", error);

  revalidatePath("/admin", "layout");
  return { success: true as const };
}

export async function toggleStudentDisabled(studentId: string, disabled: boolean): Promise<ActionResult> {
  const auth = await authorize("admin");
  if (auth.error !== undefined) return { error: auth.error };
  if (!idSchema.safeParse(studentId).success) return { error: "Estudiante inválido." };

  const { error } = await auth.session.supabase
    .from("profiles")
    .update({ is_disabled: Boolean(disabled) })
    .eq("id", studentId)
    .eq("role", "student");
  if (error) return failure("toggleStudentDisabled", error);

  revalidatePath("/admin", "layout");
  return { success: true as const };
}
