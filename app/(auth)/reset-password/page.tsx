"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  async function onSubmit(values: ResetPasswordValues) {
    const result = await updatePassword(values);
    if (result?.error) {
      setError("root", { message: result.error });
    } else {
      setSuccess(true);
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

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Comunidad
            </span>
          </div>
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Elige una contraseña segura para tu cuenta.
          </p>
        </div>

        {success ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-lg font-bold mb-2">Contraseña actualizada</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link href="/login">
              <Button className="w-full">Ir al login</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  className="w-full rounded-xl border border-input bg-background mt-1 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm" className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirm")}
                  className="w-full rounded-xl border border-input bg-background mt-1 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/50"
                />
                {errors.confirm && (
                  <p className="text-xs text-destructive">{errors.confirm.message}</p>
                )}
              </div>

              {errors.root && (
                <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-3.5 py-2.5">
                  <p className="text-sm text-destructive font-medium">
                    {errors.root.message}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full font-semibold shadow-sm shadow-primary/20" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Actualizar contraseña"}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
