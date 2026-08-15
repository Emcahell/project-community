"use client";

import { useEffect, useState } from "react";
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
import { ArrowLeft, Check, ChevronDown, Plus } from "lucide-react";

type Department = { id: string; name: string };

export default function NewNeedPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [departmentId, setDepartmentId] = useState("");
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NeedValues>({
    resolver: zodResolver(needSchema),
    defaultValues: { title: "", description: "", department_id: "" },
  });
  const description = watch("description");

  const selectedDepartment = departments.find((d) => d.id === departmentId);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: institution } = await supabase
        .from("institutions")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (institution) {
        const { data: deps } = await supabase
          .from("departments")
          .select("id, name")
          .eq("institution_id", institution.id)
          .order("name", { ascending: true });
        setDepartments(deps ?? []);
      }
      setLoadingDepartments(false);
    })();
  }, []);

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
      department_id: values.department_id || null,
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
          <label className="text-sm font-medium">Departamento</label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              disabled={loadingDepartments}
              className="w-full flex items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
            >
              <span
                className={`truncate ${
                  selectedDepartment ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {loadingDepartments
                  ? "Cargando departamentos..."
                  : selectedDepartment
                    ? selectedDepartment.name
                    : "Sin departamento"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            {open && (
              <>
                {/* Fondo invisible para cerrar al hacer clic fuera */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpen(false)}
                  aria-hidden
                />
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow-xl overflow-hidden">
                  <div className="max-h-52 overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setDepartmentId("");
                        setValue("department_id", "");
                        setOpen(false);
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                    >
                      <span
                        className={departmentId === "" ? "font-medium" : "text-muted-foreground"}
                      >
                        Sin departamento
                      </span>
                      {departmentId === "" && (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                    {departments.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDepartmentId(d.id);
                          setValue("department_id", d.id, {
                            shouldValidate: true,
                          });
                          setOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
                      >
                        <span
                          className={`truncate ${
                            departmentId === d.id
                              ? "font-medium text-primary"
                              : ""
                          }`}
                        >
                          {d.name}
                        </span>
                        {departmentId === d.id && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard/departments")}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      Crear departamento
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Clasifica esta necesidad en un departamento de tu institución.
            {departments.length === 0 &&
              !loadingDepartments &&
              " Aún no tienes departamentos, crea el primero desde el menú."}
          </p>
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
