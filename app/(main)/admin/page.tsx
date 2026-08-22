import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminPageClient } from "./admin-page";

export default async function AdminPage() {
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

  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch institutions with profile data
  const { data: institutions } = await supabase
    .from("institutions")
    .select("id, name, address, verified, is_disabled, profiles (full_name, avatar_url)")
    .order("created_at", { ascending: false });

  // Fetch students
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name, avatar_url, semester, is_disabled")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  return (
    <AdminPageClient
      institutions={institutions ?? []}
      students={students ?? []}
    />
  );
}
