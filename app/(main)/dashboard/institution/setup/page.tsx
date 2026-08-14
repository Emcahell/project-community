import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InstitutionSetupForm } from "./institution-setup-form";

export default async function InstitutionSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

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
