"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  studentProfileSchema,
  institutionProfileSchema,
  MAX_AVATAR_SIZE,
  STUDENT_CAREER,
  type StudentProfileValues,
  type InstitutionProfileValues,
} from "@/lib/validations";

export async function updateStudentProfile(values: StudentProfileValues) {
  const parsed = studentProfileSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { first_name, last_name, track } = parsed.data;
  const fullName = `${first_name} ${last_name}`.trim();
  // El trayecto se guarda como número (2, 3 o 4)
  const semester = track === "" ? null : Number(track);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    full_name: fullName,
    first_name,
    last_name,
    career: STUDENT_CAREER,
    semester,
  };

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  if (error) return { error: error.message };

  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      first_name,
      last_name,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updateInstitutionProfile(
  values: InstitutionProfileValues,
  avatarFile: File | null,
) {
  const parsed = institutionProfileSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { name, email, description, address, phone, website, schedule } =
    parsed.data;

  // Cambiar el correo de acceso si fue modificado
  if (email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) {
      return {
        error:
          emailError.code === "email_exists"
            ? "Ese correo ya está en uso por otra cuenta."
            : `No se pudo cambiar el correo de acceso: ${emailError.message} (${emailError.code ?? "sin código"})`,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileUpdates: Record<string, any> = { full_name: name };

  // Logo upload
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > MAX_AVATAR_SIZE)
      return { error: "El logo no puede superar 4 MB." };

    const ext = avatarFile.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (uploadError) return { error: "Error subiendo el logo." };

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    profileUpdates.avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
  }

  const [profileResult, institutionResult] = await Promise.all([
    supabase.from("profiles").update(profileUpdates).eq("id", user.id),
    supabase
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
      .eq("profile_id", user.id),
  ]);

  if (profileResult.error) return { error: profileResult.error.message };
  if (institutionResult.error) return { error: institutionResult.error.message };

  await supabase.auth.updateUser({
    data: { full_name: name, avatar_url: profileUpdates.avatar_url },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function verifyInstitution(institutionId: string, verified: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Sin permisos." };

  const { error } = await supabase
    .from("institutions")
    .update({ verified })
    .eq("id", institutionId);

  if (error) return { error: error.message };

  revalidatePath("/admin");
  return { success: true };
}
