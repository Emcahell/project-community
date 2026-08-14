"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/app/actions/auth";
import { loginSchema, type LoginValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, Handshake, Sparkles, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, oklch(0.488 0.243 264.376) 0%, oklch(0.35 0.22 285) 100%)",
        }}>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-64 h-64 rounded-full bg-violet-400/10 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-white font-bold text-base">Community</span>
            <span className="text-white/50 text-[9px] uppercase tracking-[0.12em] font-medium">
              UPTYAB
            </span>
          </div>
        </Link>

        <div className="relative z-10 max-w-sm">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma de vinculación comunitaria
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
            El puente entre estudiantes e instituciones públicas
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10">
            Conectamos talento estudiantil con necesidades reales. Sin costo,
            sin trámites.
          </p>
          <div className="space-y-3.5">
            {[
              {
                icon: GraduationCap,
                text: "Estudiantes aplican a proyectos reales",
              },
              {
                icon: Building2,
                text: "Instituciones reciben apoyo calificado",
              },
              { icon: Handshake, text: "La comunidad crece junta" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3.5 text-white/75 text-sm">
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs relative z-10">
          © 2025 UPTYAB Community
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shadow-md shadow-primary/25">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm">Community</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em]">
                UPTYAB
              </span>
            </div>
          </div>

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
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full rounded-xl border border-input bg-background mt-2 px-3.5 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errors.root && (
                <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
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
