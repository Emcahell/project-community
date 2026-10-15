"use server";

import { authorize } from "@/lib/auth";
import { type ActionResult, failure } from "@/lib/errors";
import { idSchema } from "@/lib/validations";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(notificationId).success) return { error: "Notificación inválida." };

  const auth = await authorize("student", "institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId)
    .eq("recipient_id", user.id);
  if (error) return failure("markNotificationRead", error);

  return { success: true as const };
}
