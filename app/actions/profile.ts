"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  studentProfileSchema,
  institutionProfileSchema,
  MAX_AVATAR_SIZE,
  MAX_CV_SIZE,
  type StudentProfileValues,
  type InstitutionProfileValues,
} from "@/lib/validations";

export async function updateStudentProfile(
  values: StudentProfileValues,
  cvFile: File | null,
) {
  const parsed = studentProfileSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { first_name, last_name, career } = parsed.data;
  const fullName = `${first_name} ${last_name}`.trim();
  const semesterRaw = parsed.data.semester;
  const semester = semesterRaw === "" ? null : Number(semesterRaw);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    full_name: fullName,
    first_name,
    last_name,
    career: career || null,
    semester,
  };

  // CV upload
  if (cvFile && cvFile.size > 0) {
    if (cvFile.size > MAX_CV_SIZE)
      return { error: "El CV no puede superar 4 MB." };
    if (cvFile.type !== "application/pdf")
      return { error: "El CV debe ser un archivo PDF." };

    const path = `${user.id}/cv.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(path, cvFile, { upsert: true, contentType: "application/pdf" });
    if (uploadError) return { error: "Error subiendo el CV." };

    const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path);
    updates.cv_url = `${urlData.publicUrl}?t=${Date.now()}`;
  }

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

  const { full_name, name, description, address, phone, website } =
    parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileUpdates: Record<string, any> = { full_name };

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
        description: description || null,
        address: address || null,
        phone: phone || null,
        website: website || null,
      })
      .eq("profile_id", user.id),
  ]);

  if (profileResult.error) return { error: profileResult.error.message };
  if (institutionResult.error) return { error: institutionResult.error.message };

  await supabase.auth.updateUser({
    data: { full_name, avatar_url: profileUpdates.avatar_url },
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
