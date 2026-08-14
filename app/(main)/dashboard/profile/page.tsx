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
      <div className="relative rounded-2xl overflow-hidden bg-primary px-6 py-7 mb-8 flex items-center gap-4">
        <div className="relative z-10 w-14 h-14 rounded-2xl overflow-hidden shrink-0">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.full_name ?? "Avatar"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-white/20 flex items-center justify-center text-xl font-bold text-white select-none">
              {getInitials(profile.full_name)}
            </div>
          )}
        </div>
        <div className="relative z-10">
          <p className="text-white font-bold text-lg leading-tight">
            {profile.full_name ?? "Sin nombre"}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-white/70 text-xs">
            {isInstitution ? (
              <>
                <Building2 className="w-3.5 h-3.5" />
                Institución · {institution?.name ?? "Sin configurar"}
                {institution?.verified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-sky-300" />
                )}
              </>
            ) : (
              <>
                <GraduationCap className="w-3.5 h-3.5" />
                Estudiante UPTYAB
                {profile.career && <> · {profile.career}</>}
                {profile.semester && <> · Sem. {profile.semester}</>}
              </>
            )}
          </div>
        </div>
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      </div>

      <ProfileForm profile={profile} institution={institution} />
    </div>
  );
}
