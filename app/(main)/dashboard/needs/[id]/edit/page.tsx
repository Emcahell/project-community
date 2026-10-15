import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getInstitutionWithDepartments } from "@/lib/institution";
import { NeedForm } from "../../need-form";

export const metadata: Metadata = { title: "Editar necesidad" };

export default async function EditNeedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireRole("institution");

  const data = await getInstitutionWithDepartments(supabase, user.id);
  if (!data) redirect("/dashboard");

  const { data: need } = await supabase
    .from("needs")
    .select("id, title, description, status, department_id")
    .eq("id", id)
    .eq("institution_id", data.institutionId)
    .maybeSingle();
  if (!need) notFound();
  if (need.status !== "open") redirect(`/dashboard/needs/${id}`);

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href={`/dashboard/needs/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la necesidad
      </Link>

      <h1 className="text-2xl font-bold mb-8">Editar necesidad</h1>

      <NeedForm
        needId={id}
        departments={data.departments}
        initialValues={{
          title: need.title,
          description: need.description,
          department_id: need.department_id ?? "",
        }}
      />
    </div>
  );
}
