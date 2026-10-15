"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { authorize } from "@/lib/auth";
import { type ActionResult, failure } from "@/lib/errors";
import { uploadAvatar } from "@/lib/storage";
import {
  studentProfileSchema,
  institutionProfileSchema,
  institutionSetupSchema,
  STUDENT_CAREER,
  type StudentProfileValues,
  type InstitutionProfileValues,
  type InstitutionSetupValues,
} from "@/lib/validations";

function firstIssue(error: { issues: { message: string }[] }) {
  return { error: error.issues[0]?.message ?? "Datos inválidos." };
}

/** Cambia el correo de acceso si fue modificado. */
async function changeLoginEmail(supabase: SupabaseClient, user: User, email: string) {
  if (email === user.email) return null;
  const { error } = await supabase.auth.updateUser({ email });
  if (!error) return null;
  if (error.code === "email_exists") return { error: "Ese correo ya está en uso por otra cuenta." };
  return failure("changeLoginEmail", error, "No se pudo cambiar el correo de acceso.");
}

export async function updateStudentProfile(values: StudentProfileValues): Promise<ActionResult> {
  const parsed = studentProfileSchema.safeParse(values);
  if (!parsed.success) return firstIssue(parsed.error);

  const auth = await authorize("student");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const { first_name, last_name, track } = parsed.data;
  const fullName = `${first_name} ${last_name}`.trim();
  // El trayecto se guarda como número (2, 3 o 4)
  const semester = track === "" ? null : Number(track);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      first_name,
      last_name,
      career: STUDENT_CAREER,
      semester,
    })
    .eq("id", user.id);
  if (error) return failure("updateStudentProfile", error);

  // Solo datos de presentación; el rol nunca se toma de user_metadata
  await supabase.auth.updateUser({
    data: { full_name: fullName, first_name, last_name },
  });

  revalidatePath("/dashboard", "layout");
  return { success: true as const };
}

export async function updateInstitutionProfile(
  values: InstitutionProfileValues,
  avatarFile: File | null,
): Promise<ActionResult> {
  const parsed = institutionProfileSchema.safeParse(values);
  if (!parsed.success) return firstIssue(parsed.error);

  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  const { name, email, description, address, phone, website, schedule } = parsed.data;

  // Subir primero el logo: si falla, no se modifica nada más
  let avatarUrl: string | undefined;
  if (avatarFile && avatarFile.size > 0) {
    const upload = await uploadAvatar(supabase, user.id, avatarFile);
    if (upload.error !== undefined) return { error: upload.error };
    avatarUrl = upload.url;
  }

  const { error: institutionError } = await supabase
    .from("institutions")
    .update({
      name,
      email,
      description,
      address,
      phone,
      website: website || null,
      schedule,
    })
    .eq("profile_id", user.id);
  if (institutionError) return failure("updateInstitutionProfile", institutionError);

  const { error: profileError } = await supabase
    .from("profiles")
    .update(avatarUrl ? { full_name: name, avatar_url: avatarUrl } : { full_name: name })
    .eq("id", user.id);
  if (profileError) return failure("updateInstitutionProfile.profile", profileError);

  // El correo de acceso se cambia al final, cuando el resto ya se guardó
  const emailResult = await changeLoginEmail(supabase, user, email);
  if (emailResult) return emailResult;

  await supabase.auth.updateUser({
    data: avatarUrl ? { full_name: name, avatar_url: avatarUrl } : { full_name: name },
  });

  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function setupInstitution(
  values: InstitutionSetupValues,
  avatarFile: File | null,
): Promise<ActionResult> {
  const parsed = institutionSetupSchema.safeParse(values);
  if (!parsed.success) return firstIssue(parsed.error);

  const auth = await authorize("institution");
  if (auth.error !== undefined) return { error: auth.error };
  const { supabase, user } = auth.session;

  // Evitar instituciones duplicadas
  const { data: existing } = await supabase
    .from("institutions")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) return { success: true as const };

  let avatarUrl: string | null = null;
  if (avatarFile && avatarFile.size > 0) {
    const upload = await uploadAvatar(supabase, user.id, avatarFile);
    if (upload.error !== undefined) return { error: upload.error };
    avatarUrl = upload.url;
  }

  const v = parsed.data;
  const { error } = await supabase.from("institutions").insert({
    profile_id: user.id,
    name: v.name,
    email: v.email,
    description: v.description,
    address: v.address,
    phone: v.phone,
    website: v.website || null,
    schedule: v.schedule,
  });
  if (error) return failure("setupInstitution", error, "Ocurrió un error al guardar la institución.");

  await supabase
    .from("profiles")
    .update(avatarUrl ? { full_name: v.name, avatar_url: avatarUrl } : { full_name: v.name })
    .eq("id", user.id);

  const emailResult = await changeLoginEmail(supabase, user, v.email);
  if (emailResult) return emailResult;

  if (avatarUrl) await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });

  revalidatePath("/", "layout");
  return { success: true as const };
}
