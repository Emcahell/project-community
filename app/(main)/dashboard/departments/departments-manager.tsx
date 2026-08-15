"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  departmentSchema,
  type DepartmentValues,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, Building2, X } from "lucide-react";

type Department = {
  id: string;
  name: string;
  created_at: string | null;
};

export function DepartmentsManager({
  institutionId,
  initialDepartments,
}: {
  institutionId: string;
  initialDepartments: Department[];
}) {
  const router = useRouter();
  const [departments, setDepartments] =
    useState<Department[]>(initialDepartments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: DepartmentValues) {
    const supabase = createClient();
    setFormError(null);

    if (editingId) {
      const { error } = await supabase
        .from("departments")
        .update({ name: values.name })
        .eq("id", editingId);

      if (error) {
        setFormError(
          error.code === "23505"
            ? "Ya existe un departamento con ese nombre."
            : "Ocurrió un error al actualizar el departamento."
        );
        return;
      }

      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingId ? { ...d, name: values.name } : d
        )
      );
      setEditingId(null);
      reset();
      router.refresh();
      return;
    }

    const { data: created, error } = await supabase
      .from("departments")
      .insert({
        institution_id: institutionId,
        name: values.name,
      })
      .select("id, name, created_at")
      .single();

    if (error) {
      setFormError(
        error.code === "23505"
          ? "Ya existe un departamento con ese nombre."
          : "Ocurrió un error al guardar el departamento."
      );
      return;
    }

    if (created) {
      setDepartments((prev) =>
        [...prev, created].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
    }

    reset();
    router.refresh();
  }

  function startEdit(department: Department) {
    setEditingId(department.id);
    setConfirmingId(null);
    setValue("name", department.name, { shouldValidate: true });
  }

  function cancelEdit() {
    setEditingId(null);
    reset();
  }

  async function confirmDelete() {
    if (!confirmingId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", confirmingId);

    if (error) {
      setFormError("Ocurrió un error al eliminar el departamento.");
      setConfirmingId(null);
      return;
    }

    setDepartments((prev) => prev.filter((d) => d.id !== confirmingId));
    setConfirmingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Formulario crear/editar */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-border bg-card p-5 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            {editingId ? (
              <Pencil className="w-4 h-4 text-primary" />
            ) : (
              <Plus className="w-4 h-4 text-primary" />
            )}
          </div>
          <h2 className="font-semibold text-sm">
            {editingId ? "Editar departamento" : "Nuevo departamento"}
          </h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Nombre del departamento{" "}
            <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Sistemas, Recursos Humanos, Biblioteca..."
            {...register("name")}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {formError && (
          <p className="text-sm text-destructive">{formError}</p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting
              ? "Guardando..."
              : editingId
                ? "Guardar cambios"
                : "Guardar departamento"}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelEdit}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>

      {/* Lista */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Tus departamentos ({departments.length})
        </h2>

        {departments.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-muted/20">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-primary/15 to-violet-500/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-sm mb-1">Sin departamentos</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Crea tu primer departamento para poder clasificar tus
              necesidades al publicarlas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((department) => (
              <div
                key={department.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm flex-1 min-w-0 truncate">
                  {department.name}
                </p>

                {confirmingId === department.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground mr-1">
                      ¿Eliminar?
                    </span>
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={confirmDelete}
                    >
                      Sí, eliminar
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setConfirmingId(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => startEdit(department)}
                      aria-label={`Editar ${department.name}`}
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        setConfirmingId(department.id);
                        setEditingId(null);
                      }}
                      aria-label={`Eliminar ${department.name}`}
                      title="Eliminar"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
