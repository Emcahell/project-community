"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as registerAction } from "@/app/actions/auth";
import { registerSchema, type RegisterValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, Handshake } from "lucide-react";
import { AuthBrandPanel, AuthMobileLogo } from "@/components/auth-brand-panel";
import { PasswordInput } from "@/components/password-input";

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "student",
      first_name: "",
      last_name: "",
      institution_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });
  const role = useWatch({ control, name: "role" });

  async function onSubmit(values: RegisterValues) {
    const result = await registerAction(values);
    if (result?.error) {
      setError("root", { message: result.error });
    }
  }

  return (
    <div className="min-h-screen flex">
      <AuthBrandPanel
        badge="Únete en segundos, sin costo."
        title="Únete a la plataforma que conecta estudiantes con comunidades."
        description="Crea tu cuenta y empieza a conectarte con la comunidad. Ahorra tiempo valioso buscando comunidades."
        features={[
          { icon: GraduationCap, text: "Si eres estudiante, aplica a proyectos reales." },
          { icon: Building2, text: "Si eres institución, publica necesidades." },
          { icon: Handshake, text: "Ambos construyen comunidad juntos." },
        ]}
      />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <AuthMobileLogo />

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Únete a la plataforma de vinculación de la UPTYAB
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {role === "student" ? (
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className="text-sm font-semibold">Nombre completo</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      id="first_name"
                      type="text"
                      aria-label="Primer nombre"
                      autoComplete="given-name"
                      placeholder="Primer nombre"
                      {...register("first_name")}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                    />
                    <input
                      id="last_name"
                      type="text"
                      aria-label="Primer apellido"
                      autoComplete="family-name"
                      placeholder="Primer apellido"
                      {...register("last_name")}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.first_name.message}
                    </p>
                  )}
                  {errors.last_name && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="institution_name" className="text-sm font-semibold">
                    Nombre de la institución
                  </label>
                  <input
                    id="institution_name"
                    type="text"
                    autoComplete="organization"
                    placeholder="Ej. Alcaldía del municipio"
                    {...register("institution_name")}
                    className="w-full rounded-xl border border-input bg-background mt-2 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                  />
                  {errors.institution_name && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.institution_name.message}
                    </p>
                  )}
                </div>
              )}

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
                <label htmlFor="password" className="text-sm font-semibold">
                  Contraseña
                </label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...register("password")}
                  className="w-full rounded-xl border border-input bg-background mt-2 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm_password" className="text-sm font-semibold">
                  Confirmar contraseña
                </label>
                <PasswordInput
                  id="confirm_password"
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  {...register("confirm_password")}
                  className="w-full rounded-xl border border-input bg-background mt-2 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                />
              </div>

              <fieldset className="space-y-1.5">
                <legend className="text-sm font-semibold">Soy...</legend>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <label className="flex items-center gap-3 rounded-xl border border-input p-3.5 cursor-pointer has-checked:border-primary has-checked:bg-primary/5 transition-all hover:border-border/80">
                    <input
                      type="radio"
                      value="student"
                      {...register("role")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold leading-none">Estudiante</p>
                      <p className="text-xs text-muted-foreground mt-1">UPTYAB</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-input p-3.5 cursor-pointer has-checked:border-primary has-checked:bg-primary/5 transition-all hover:border-border/80">
                    <input
                      type="radio"
                      value="institution"
                      {...register("role")}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-semibold leading-none">Institución</p>
                      <p className="text-xs text-muted-foreground mt-1">Pública</p>
                    </div>
                  </label>
                </div>
              </fieldset>

              {errors.root && (
                <div role="alert" className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
                  <p className="text-sm text-destructive font-medium">
                    {errors.root.message}
                  </p>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
              {errors.confirm_password && (
                <p className="text-xs text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}

              <Button type="submit" className="w-full font-semibold shadow-sm shadow-primary/20 mt-1" disabled={isSubmitting}>
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-foreground font-semibold hover:text-primary transition-colors underline underline-offset-4"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
