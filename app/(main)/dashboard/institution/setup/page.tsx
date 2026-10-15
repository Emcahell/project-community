import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { InstitutionSetupForm } from "./institution-setup-form";

export const metadata: Metadata = { title: "Configura tu institución" };

export default async function InstitutionSetupPage() {
  const { supabase, user, profile } = await requireRole("institution");

  const { data: existing } = await supabase
    .from("institutions")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) redirect("/dashboard/profile");

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configura tu institución</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Esta información será visible para los estudiantes.
        </p>
      </div>

      <InstitutionSetupForm
        initialName={profile?.full_name ?? ""}
        initialEmail={user.email ?? ""}
      />
    </div>
  );
}
