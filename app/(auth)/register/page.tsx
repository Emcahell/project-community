"use client";

import { useState } from "react";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Building2, Handshake } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-10 relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-white font-bold text-lg">Community</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Únete a la plataforma de la UPTYAB
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Crea tu cuenta en segundos y empieza a conectarte con la comunidad. Sin costo, sin trámites.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              Si eres estudiante, aplica a proyectos
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              Si eres institución, publica necesidades
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Handshake className="w-4 h-4 text-white" />
              </div>
              Ambos construyen comunidad
            </div>
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">© 2025 UPTYAB Community</p>

        {/* Decorative */}
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/3 translate-x-1/4 pointer-events-none" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-muted/20">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1 lg:hidden">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">C</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Community</span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2 hidden lg:block">
              Community
            </p>
            <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Únete a la plataforma de la UPTYAB
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="text-sm font-medium">
                  Nombre completo
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  autoComplete="name"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Soy...</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2.5 rounded-lg border border-input p-3 cursor-pointer has-checked:border-primary has-checked:bg-primary/5 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      defaultChecked
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium leading-none">Estudiante</p>
                      <p className="text-xs text-muted-foreground mt-0.5">UPTYAB</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 rounded-lg border border-input p-3 cursor-pointer has-checked:border-primary has-checked:bg-primary/5 transition-colors">
                    <input
                      type="radio"
                      name="role"
                      value="institution"
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium leading-none">Institución</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Pública</p>
                    </div>
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-foreground font-medium underline underline-offset-4"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
