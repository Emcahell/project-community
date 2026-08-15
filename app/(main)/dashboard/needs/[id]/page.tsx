import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ApplicationsList } from "./applications-list";
import { NEED_STATUS } from "@/lib/constants";

export default async function NeedApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: need } = await supabase
    .from("needs")
    .select(`*, institutions!inner(profile_id, name), departments(name)`)
    .eq("id", id)
    .single();

  if (!need) notFound();

  const institution = need.institutions as { profile_id: string; name: string };
  if (institution.profile_id !== user.id) redirect("/dashboard");

  const { data: applications } = await supabase
    .from("applications")
    .select(`*, profiles(full_name, avatar_url, cv_url)`)
    .eq("need_id", id)
    .order("created_at", { ascending: false });

  const total = applications?.length ?? 0;
  const pending = applications?.filter((a) => a.status === "pending").length ?? 0;
  const accepted = applications?.filter((a) => a.status === "accepted").length ?? 0;

  const statusInfo = NEED_STATUS[need.status] ?? NEED_STATUS.open;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      <div className="mb-6">
        {need.departments && (
          <span className="text-[11px] font-medium bg-muted border border-border/60 rounded-full px-2 py-0.5">
            {(need.departments as { name: string }).name}
          </span>
        )}
        <div className="flex items-start gap-3 mt-2">
          <h1 className="text-2xl font-bold flex-1">{need.title}</h1>
          <span
            className={`shrink-0 mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>
        {need.description && (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            {need.description}
          </p>
        )}
      </div>

      {total > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pendientes</p>
          </div>
          <div className="rounded-xl border border-border p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{accepted}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Aceptadas</p>
          </div>
        </div>
      )}

      <ApplicationsList applications={applications ?? []} />
    </div>
  );
}
