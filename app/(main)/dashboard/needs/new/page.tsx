"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  needSchema,
  MAX_DESCRIPTION,
  type NeedValues,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewNeedPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NeedValues>({
    resolver: zodResolver(needSchema),
    defaultValues: { title: "", description: "" },
  });
  const description = watch("description");

  async function onSubmit(values: NeedValues) {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: institution } = await supabase
      .from("institutions")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!institution) {
      setError("root", { message: "No se encontró tu institución." });
      return;
    }

    const { error } = await supabase.from("needs").insert({
      institution_id: institution.id,
      title: values.title,
      description: values.description,
    });

    if (error) {
      setError("root", {
        message: "Ocurrió un error al publicar la necesidad.",
      });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">Publicar necesidad</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Describe la necesidad tecnológica de tu institución.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Título <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Sistema de gestión de inventario"
            {...register("title")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Descripción <span className="text-destructive">*</span>
            </label>
            <span
              className={`text-xs tabular-nums ${
                description.length > MAX_DESCRIPTION
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {description.length}/{MAX_DESCRIPTION}
            </span>
          </div>
          <textarea
            rows={7}
            placeholder="Describe en detalle la necesidad tecnológica, qué problema resuelve, qué funcionalidades se necesitan..."
            {...register("description")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            disabled={isSubmitting || description.length > MAX_DESCRIPTION}
          >
            {isSubmitting ? "Publicando..." : "Publicar necesidad"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
