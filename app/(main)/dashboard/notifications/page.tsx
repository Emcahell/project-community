import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationsList } from "./notifications-list";

export default async function NotificationsPage() {
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

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Notificaciones</h1>

      <NotificationsList
        role={profile?.role ?? "student"}
        notifications={(notifications ?? []).map((n) => ({
          id: n.id,
          type: n.type,
          need_id: n.need_id,
          message: n.message,
          read: n.read,
          created_at: n.created_at,
        }))}
      />
    </div>
  );
}
