"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPassword } from "@/app/actions/auth";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await resetPassword(values);
    if (result?.error) {
      setError("root", { message: result.error });
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-muted/20">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al login
        </Link>

        {sent ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="text-lg font-bold mb-2">Revisa tu correo</h1>
            <p className="text-sm text-muted-foreground">
              Te enviamos un enlace para restablecer tu contraseña. Puede tardar unos minutos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">

              <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Ingresa tu correo y te enviamos un enlace para restablecerla.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    {...register("email")}
                    className="w-full rounded-lg border border-input bg-background mt-2 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {errors.root && (
                  <p className="text-sm text-destructive">{errors.root.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
