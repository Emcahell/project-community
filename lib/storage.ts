import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_SIZE } from "@/lib/validations";

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Sube el logo/avatar validando tipo y tamaño en el servidor. La extensión
 * se deriva del tipo MIME (no del nombre del archivo) para impedir subir
 * HTML/SVG al bucket público.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ url: string; error?: undefined } | { error: string }> {
  if (file.size > MAX_AVATAR_SIZE) return { error: "El logo no puede superar 4 MB." };

  const ext = EXTENSION_BY_TYPE[file.type];
  if (!ext || !(ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return { error: "El logo debe ser una imagen PNG, JPG o WEBP." };
  }

  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) {
    console.error("[uploadAvatar]", error.message);
    return { error: "Error subiendo el logo." };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // El parámetro `v` invalida la caché del navegador al reemplazar el logo.
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}
