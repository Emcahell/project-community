"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !validateEmail(email)) {
    return { error: "Ingresa un correo electrónico válido." };
  }
  if (!password) {
    return { error: "La contraseña es requerida." };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return { error: "Correo o contraseña incorrectos." };
    }
    return { error: error.message };
  }

  const role = authData.user?.user_metadata?.role as string | undefined;
  redirect(role === "admin" ? "/admin" : "/dashboard");
}

export async function register(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const role = formData.get("role") as string;

  if (!fullName || fullName.length < 2) {
    return { error: "Ingresa tu nombre completo (mínimo 2 caracteres)." };
  }
  if (!email || !validateEmail(email)) {
    return { error: "Ingresa un correo electrónico válido." };
  }
  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (!["student", "institution"].includes(role)) {
    return { error: "Selecciona un tipo de cuenta válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();

  if (!email || !validateEmail(email)) {
    return { error: "Ingresa un correo electrónico válido." };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
