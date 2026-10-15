import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { OnboardingContent } from "./onboarding-content";

export const metadata: Metadata = { title: "Bienvenida" };

export default async function OnboardingPage() {
  const { profile } = await requireUser();

  // El rol se toma de la base de datos (no de user_metadata)
  if (!profile) redirect("/dashboard");
  if (profile.role === "admin") redirect("/admin");
  if (profile.onboarding_completed) redirect("/dashboard");

  return <OnboardingContent role={profile.role} />;
}
