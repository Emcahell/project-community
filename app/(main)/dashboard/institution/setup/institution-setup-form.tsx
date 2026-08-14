"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function InstitutionSetupForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const address = (formData.get("address") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const website = (formData.get("website") as string)?.trim();

    if (!name || name.length < 2) {
      setError("El nombre de la institución es requerido.");
      setLoading(false);
      return;
    }
    if (!description || !address || !phone) {
      setError("Completa todos los campos obligatorios.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

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
      description: description || null,
      address: address || null,
      phone: phone || null,
      website: website || null,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium">
          Nombre de la institución <span className="text-destructive">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={initialName}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground pt-1">
          Correo de registro:{" "}
          <span className="font-medium text-foreground">{initialEmail}</span>
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Descripción <span className="text-destructive">*</span>
        </label>
        <textarea
          name="description"
          rows={3}
          required
          placeholder="Breve descripción de la institución..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Dirección <span className="text-destructive">*</span>
        </label>
        <input
          name="address"
          type="text"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Contacto <span className="text-destructive">*</span>
        </label>
        <input
          name="phone"
          type="text"
          required
          placeholder="Teléfono o correo de contacto"
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
        {loading ? "Guardando..." : "Guardar información"}
      </Button>
    </form>
  );
}
