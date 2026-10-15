"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth";
import { type ActionResult, failure } from "@/lib/errors";
import { getTeamMemberIds } from "@/lib/team";
import {
  applicationSchema,
  rejectionReasonSchema,
  idSchema,
  MAX_APPLICATIONS_PER_NEED,
  type ApplicationValues,
} from "@/lib/validations";

export async function applyToNeed(needId: string, values: ApplicationValues): Promise<ActionResult<{ success: true; application: { id: string; status: string; rejection_reason: string | null; created_at: string | null } }>> {
  if (!idSchema.safeParse(needId).success) return { error: "Necesidad inválida." };
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const auth = await authorize("student");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const { data: need } = await supabase
    .from("needs")
    .select("id, status, institutions!inner(is_disabled)")
    .eq("id", needId)
    .maybeSingle();
  const institution = need?.institutions as { is_disabled: boolean | null } | null | undefined;
  if (!need || institution?.is_disabled) return { error: "Esta necesidad no existe." };
  if (need.status !== "open") return { error: "Esta necesidad ya no recibe solicitudes." };

  const { data: ownApps } = await supabase
    .from("applications")
    .select("status")
    .eq("need_id", needId)
    .eq("student_id", user.id);
  if ((ownApps ?? []).some((a) => a.status === "pending" || a.status === "accepted")) {
    return { error: "Ya tienes una solicitud activa para esta necesidad." };
  }
  if ((ownApps ?? []).length >= MAX_APPLICATIONS_PER_NEED) {
    return {
      error: `Alcanzaste el máximo de ${MAX_APPLICATIONS_PER_NEED} solicitudes para esta necesidad.`,
    };
  }

  // Un solo integrante del equipo aplica en nombre de todos
  const teamIds = await getTeamMemberIds(supabase, user.id);
  if (teamIds.length > 0) {
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("need_id", needId)
      .in("student_id", teamIds)
      .in("status", ["pending", "accepted"]);
    if ((count ?? 0) > 0) {
      return { error: "Un integrante de tu equipo ya envió una solicitud para esta necesidad." };
    }
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      need_id: needId,
      student_id: user.id,
      message: parsed.data.message || null,
    })
    .select("id, status, rejection_reason, created_at")
    .single();
  if (error) return failure("applyToNeed", error, "Ocurrió un error al enviar tu solicitud.");

  revalidatePath("/dashboard");
  return { success: true as const, application: data };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected",
  rejectionReason?: string,
): Promise<ActionResult<{ success: true; reason: string | null }>> {
  if (!idSchema.safeParse(applicationId).success) return { error: "Solicitud inválida." };
  if (status !== "accepted" && status !== "rejected") return { error: "Estado inválido." };

  let reason: string | null = null;
  if (status === "rejected") {
    const parsed = rejectionReasonSchema.safeParse({ reason: rejectionReason ?? "" });
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Motivo inválido." };
    reason = parsed.data.reason;
  }

  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const { data: application } = await supabase
    .from("applications")
    .select("id, status, need_id, needs!inner(status, institutions!inner(profile_id))")
    .eq("id", applicationId)
    .maybeSingle();

  const need = application?.needs as
    | { status: string; institutions: { profile_id: string } }
    | null
    | undefined;
  if (!application || need?.institutions.profile_id !== user.id) {
    return { error: "No se encontró la solicitud." };
  }
  if (application.status !== "pending") return { error: "Esta solicitud ya fue respondida." };
  if (need.status !== "open") return { error: "Esta necesidad ya fue asignada." };

  if (status === "accepted") {
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .eq("need_id", application.need_id)
      .eq("status", "accepted");
    if ((count ?? 0) > 0) return { error: "Esta necesidad ya tiene una solicitud aceptada." };
  }

  // `.eq("status", "pending")` evita sobrescribir si otra pestaña respondió antes
  const { data: updated, error } = await supabase
    .from("applications")
    .update(status === "rejected" ? { status, rejection_reason: reason } : { status })
    .eq("id", applicationId)
    .eq("status", "pending")
    .select("id");
  if (error) return failure("updateApplicationStatus", error, "No se pudo actualizar el estado.");
  if (!updated || updated.length === 0) return { error: "Esta solicitud ya fue respondida." };

  revalidatePath(`/dashboard/needs/${application.need_id}`);
  revalidatePath("/dashboard");
  return { success: true as const, reason };
}
