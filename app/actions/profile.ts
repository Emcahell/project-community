"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudentProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const fullName = (formData.get("full_name") as string)?.trim();
  const career = (formData.get("career") as string)?.trim() || null;
  const semesterRaw = formData.get("semester") as string;
  const semester = semesterRaw ? parseInt(semesterRaw) : null;
  const avatarFile = formData.get("avatar") as File | null;
  const cvFile = formData.get("cv") as File | null;

  if (!fullName || fullName.length < 2)
    return { error: "Ingresa tu nombre completo." };
  if (semester !== null && (isNaN(semester) || semester < 1 || semester > 12))
    return { error: "El semestre debe estar entre 1 y 12." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = { full_name: fullName, career, semester };

  // Avatar upload
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 2 * 1024 * 1024)
      return { error: "La foto no puede superar 2 MB." };

    const ext = avatarFile.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (uploadError) return { error: "Error subiendo la foto de perfil." };

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    updates.avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
  }

  // CV upload
  if (cvFile && cvFile.size > 0) {
    if (cvFile.size > 5 * 1024 * 1024)
      return { error: "El CV no puede superar 5 MB." };
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

  const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
  if (error) return { error: error.message };

  await supabase.auth.updateUser({
    data: { full_name: fullName, avatar_url: updates.avatar_url },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updateInstitutionProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const fullName = (formData.get("full_name") as string)?.trim();
  const name = (formData.get("name") as string)?.trim();
  const avatarFile = formData.get("avatar") as File | null;

  if (!fullName || fullName.length < 2)
    return { error: "Ingresa tu nombre completo." };
  if (!name || name.length < 2)
    return { error: "El nombre de la institución es requerido." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileUpdates: Record<string, any> = { full_name: fullName };

  // Avatar upload
  if (avatarFile && avatarFile.size > 0) {
    if (avatarFile.size > 2 * 1024 * 1024)
      return { error: "La foto no puede superar 2 MB." };

    const ext = avatarFile.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (uploadError) return { error: "Error subiendo la foto de perfil." };

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    profileUpdates.avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
  }

  const [profileResult, institutionResult] = await Promise.all([
    supabase.from("profiles").update(profileUpdates).eq("id", user.id),
    supabase
      .from("institutions")
      .update({
        name,
        description: (formData.get("description") as string)?.trim() || null,
        address: (formData.get("address") as string)?.trim() || null,
        phone: (formData.get("phone") as string)?.trim() || null,
        website: (formData.get("website") as string)?.trim() || null,
      })
      .eq("profile_id", user.id),
  ]);

  if (profileResult.error) return { error: profileResult.error.message };
  if (institutionResult.error) return { error: institutionResult.error.message };

  await supabase.auth.updateUser({
    data: { full_name: fullName, avatar_url: profileUpdates.avatar_url },
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
