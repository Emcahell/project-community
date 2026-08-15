import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DepartmentsManager } from "./departments-manager";

export default async function DepartmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "institution") redirect("/dashboard");

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
        institutionId={institution.id}
        initialDepartments={departments ?? []}
      />
    </div>
  );
}
