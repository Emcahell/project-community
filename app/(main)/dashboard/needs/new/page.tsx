import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getInstitutionWithDepartments } from "@/lib/institution";
import { NeedForm } from "../need-form";

export const metadata: Metadata = { title: "Publicar necesidad" };

export default async function NewNeedPage() {
  const { supabase, user } = await requireRole("institution");
  const data = await getInstitutionWithDepartments(supabase, user.id);
  if (!data) redirect("/dashboard");

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

      <NeedForm departments={data.departments} />
    </div>
  );
}
