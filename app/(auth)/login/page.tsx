"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/app/actions/auth";
import { loginSchema, type LoginValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, Handshake, CheckCircle2 } from "lucide-react";
import { AuthBrandPanel, AuthMobileLogo } from "@/components/auth-brand-panel";
import { PasswordInput } from "@/components/password-input";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const passwordChanged = searchParams.get("password_changed") === "true";
  const accountDisabled = searchParams.get("disabled") === "true";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    const result = await login(values);
    if (result?.error) {
      setError("root", { message: result.error });
    }
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel
        badge="Plataforma de vinculación comunitaria"
        title="El puente entre estudiantes e instituciones públicas"
        description="Conectamos talento estudiantil con necesidades reales. Sin costo, sin trámites."
        features={[
          { icon: GraduationCap, text: "Estudiantes aplican a proyectos reales" },
          { icon: Building2, text: "Instituciones reciben apoyo calificado" },
          { icon: Handshake, text: "La comunidad crece junta" },
        ]}
      />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <AuthMobileLogo />

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              Bienvenido de vuelta
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Inicia sesión para continuar en la plataforma
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  {...register("email")}
                  className="w-full rounded-xl border border-input bg-background mt-2 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold">
                    Contraseña
                  </label>
                </div>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  {...register("password")}
                  className="w-full rounded-xl border border-input bg-background mt-2 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                />
              </div>

              {passwordChanged && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 font-medium">
                      Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión.
                    </p>
                  </div>
                </div>
              )}

              {accountDisabled && (
                <div role="alert" className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
                  <p className="text-sm text-destructive font-medium">
                    Tu cuenta está inhabilitada. Contacta al administrador.
                  </p>
                </div>
              )}

              {errors.root && (
                <div role="alert" className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
                  <p className="text-sm text-destructive font-medium">
                    {errors.root.message}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}

              <Button
                type="submit"
                className="w-full font-semibold shadow-sm shadow-primary/20 mt-1"
                disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Iniciar sesión"}
              </Button>
              <div className="w-full text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-foreground font-semibold hover:text-primary transition-colors underline underline-offset-4">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
