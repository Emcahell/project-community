"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createNeed, updateNeed } from "@/app/actions/needs";
import { needSchema, MAX_DESCRIPTION, type NeedValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Department = { id: string; name: string };

const fieldClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

/** Formulario compartido para publicar y editar una necesidad. */
export function NeedForm({
  departments,
  needId,
  initialValues,
}: {
  departments: Department[];
  needId?: string;
  initialValues?: NeedValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(needId);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NeedValues>({
    resolver: zodResolver(needSchema),
    defaultValues: initialValues ?? { title: "", description: "", department_id: "" },
  });
  const description = useWatch({ control, name: "description" }) ?? "";

  async function onSubmit(values: NeedValues) {
    const result = needId ? await updateNeed(needId, values) : await createNeed(values);
    if (result.error) {
      setError("root", { message: result.error });
      return;
    }
    router.push(needId ? `/dashboard/needs/${needId}` : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="need-title" className="text-sm font-medium">
          Título <span className="text-destructive">*</span>
        </label>
        <input
          id="need-title"
          type="text"
          placeholder="Ej: Sistema de gestión de inventario"
          {...register("title")}
          className={fieldClass}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="need-department" className="text-sm font-medium">
          Departamento
        </label>
        <select id="need-department" {...register("department_id")} className={fieldClass}>
          <option value="">Sin departamento</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Clasifica esta necesidad en un departamento de tu institución.{" "}
          <Link
            href="/dashboard/departments"
            className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
          >
            <Plus className="w-3 h-3" />
            Crear departamento
          </Link>
        </p>
        {errors.department_id && (
          <p className="text-xs text-destructive">{errors.department_id.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="need-description" className="text-sm font-medium">
            Descripción <span className="text-destructive">*</span>
          </label>
          <span
            className={`text-xs tabular-nums ${
              description.length > MAX_DESCRIPTION ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {description.length}/{MAX_DESCRIPTION}
          </span>
        </div>
        <textarea
          id="need-description"
          rows={7}
          placeholder="Describe en detalle la necesidad tecnológica, qué problema resuelve, qué funcionalidades se necesitan..."
          {...register("description")}
          className={`${fieldClass} resize-none`}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting || description.length > MAX_DESCRIPTION}>
          {isSubmitting
            ? isEdit
              ? "Guardando..."
              : "Publicando..."
            : isEdit
              ? "Guardar cambios"
              : "Publicar necesidad"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
