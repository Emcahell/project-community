"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type ActionResult, failure } from "@/lib/errors";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginValues,
  type RegisterValues,
  type ForgotPasswordValues,
  type ResetPasswordValues,
} from "@/lib/validations";

export async function login(values: LoginValues) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "invalid_credentials" || error.message === "Invalid login credentials") {
      return { error: "Correo o contraseña incorrectos." };
    }
    if (error.code === "email_not_confirmed") {
      return { error: "Debes confirmar tu correo antes de iniciar sesión." };
    }
    return failure("login", error, "No se pudo iniciar sesión. Intenta de nuevo.");
  }

  // El rol se lee de la base de datos, no de user_metadata (editable por el usuario)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed, is_disabled")
    .eq("id", authData.user.id)
    .single();

  if (profile?.is_disabled) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta está inhabilitada. Contacta al administrador." };
  }

  // Admin siempre va a /admin
  if (profile?.role === "admin") redirect("/admin");

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function register(values: RegisterValues) {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const { role, email, password, first_name, last_name, institution_name } =
    parsed.data;

  const fullName =
    role === "institution"
      ? institution_name
      : `${first_name} ${last_name}`.trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        // Para estudiantes se guardan separados; para instituciones quedan null
        first_name: role === "student" ? first_name : null,
        last_name: role === "student" ? last_name : null,
        role,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { error: "Ya existe una cuenta con ese correo." };
    }
    if (error.code === "weak_password") {
      return { error: "La contraseña es demasiado débil. Usa una más segura." };
    }
    return failure("register", error, "No se pudo crear la cuenta. Intenta de nuevo.");
  }

  // Nuevo registro → redirigir a onboarding
  redirect("/onboarding");
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) return failure("completeOnboarding", error);

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(values: ForgotPasswordValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const siteUrl =
    process.env.SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    if (error.message.includes("rate limit")) {
      return {
        error:
          "Se alcanzó el límite de envío de correos. Intenta de nuevo en unos minutos.",
      };
    }
    return failure("resetPassword", error, "No se pudo enviar el correo. Intenta de nuevo.");
  }

  return { success: true as const };
}

export async function updatePassword(values: ResetPasswordValues) {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "same_password") {
      return { error: "La nueva contraseña debe ser distinta de la anterior." };
    }
    return failure("updatePassword", error, "No se pudo actualizar la contraseña. El enlace puede haber expirado.");
  }

  // Cerrar sesión y redirigir al login
  await supabase.auth.signOut();
  redirect("/login?password_changed=true");
}
