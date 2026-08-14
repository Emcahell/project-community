"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { updatePassword } from "@/app/actions/auth";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
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
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-muted/20">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              Community
            </span>
          </div>
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Elige una contraseña segura para tu cuenta.
          </p>
        </div>

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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.confirm && (
                <p className="text-xs text-destructive">{errors.confirm.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-destructive">{errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  );
}
