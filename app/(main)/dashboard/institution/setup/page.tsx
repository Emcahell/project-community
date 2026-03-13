"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function InstitutionSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();

    if (!name || name.length < 2) {
      setError("El nombre de la institución es requerido.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Prevent duplicate institution creation
    const { data: existing } = await supabase
      .from("institutions")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (existing) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error } = await supabase.from("institutions").insert({
      profile_id: user.id,
      name,
      description: (formData.get("description") as string)?.trim() || null,
      address: (formData.get("address") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      website: (formData.get("website") as string)?.trim() || null,
    });

    if (error) {
      setError("Ocurrió un error al guardar la institución.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configura tu institución</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Esta información será visible para los estudiantes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="text-sm font-medium">Nombre de la institución *</label>
          <input
            name="name"
            type="text"
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Descripción</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Breve descripción de la institución..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Dirección</label>
          <input
            name="address"
            type="text"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Teléfono</label>
          <input
            name="phone"
            type="tel"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Sitio web</label>
          <input
            name="website"
            type="url"
            placeholder="https://..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar institución"}
        </Button>
      </form>
    </div>
  );
}
