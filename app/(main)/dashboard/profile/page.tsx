import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, GraduationCap, Building2, BadgeCheck } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  let institution = null;
  if (profile.role === "institution") {
    const { data } = await supabase
      .from("institutions")
      .select("*")
      .eq("profile_id", user.id)
      .single();
    institution = data;
  }

  const isInstitution = profile.role === "institution";

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card px-6 py-6 mb-8 flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 ring-1 ring-border">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Avatar"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-xl font-bold text-muted-foreground select-none">
              {getInitials(profile.full_name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-lg leading-tight truncate">
            {profile.full_name ?? "Sin nombre"}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-xs">
            {isInstitution ? (
              <>
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Institución · {institution?.name ?? "Sin configurar"}
                </span>
                {institution?.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                )}
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Estudiante UPTYAB
                  {profile.career && <> · {profile.career}</>}
                  {profile.semester && <> · Sem. {profile.semester}</>}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <ProfileForm profile={profile} institution={institution} />
    </div>
  );
}
