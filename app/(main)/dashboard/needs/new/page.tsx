"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const MAX_DESCRIPTION = 1500;

export default function NewNeedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string)?.trim();

    if (!title || title.length < 5) {
      setError("El título debe tener al menos 5 caracteres.");
      setLoading(false);
      return;
    }
    if (description.trim().length < 20) {
      setError("La descripción debe tener al menos 20 caracteres.");
      setLoading(false);
      return;
    }

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
      setError("No se encontró tu institución.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("needs").insert({
      institution_id: institution.id,
      title,
      description: description.trim(),
    });

    if (error) {
      setError("Ocurrió un error al publicar la necesidad.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Título <span className="text-destructive">*</span>
          </label>
          <input
            name="title"
            type="text"
            required
            placeholder="Ej: Sistema de gestión de inventario"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
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
            name="description"
            rows={7}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESCRIPTION}
            placeholder="Describe en detalle la necesidad tecnológica, qué problema resuelve, qué funcionalidades se necesitan..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            disabled={loading || description.length > MAX_DESCRIPTION}
          >
            {loading ? "Publicando..." : "Publicar necesidad"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
