import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DepartmentsManager } from "./departments-manager";

export const metadata: Metadata = { title: "Departamentos" };

export default async function DepartmentsPage() {
  const { supabase, user } = await requireRole("institution");

  const { data: institution } = await supabase
    .from("institutions")
    .select("id")
    .eq("profile_id", user.id)
    .single();
  if (!institution) redirect("/dashboard");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, created_at")
    .eq("institution_id", institution.id)
    .order("name", { ascending: true });

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
        <h1 className="text-2xl font-bold">Departamentos</h1>
        <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
          Crea los departamentos de tu institución para clasificar tus
          necesidades al publicarlas.
        </p>
      </div>

      <DepartmentsManager
        initialDepartments={departments ?? []}
      />
    </div>
  );
}
