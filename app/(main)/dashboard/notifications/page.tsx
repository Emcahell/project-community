import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = { title: "Notificaciones" };

const NOTIFICATIONS_LIMIT = 50;

export default async function NotificationsPage() {
  const { supabase, user, profile } = await requireRole("student", "institution");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, need_id, message, read, created_at")
    .eq("recipient_id", user.id)
    .order("read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(NOTIFICATIONS_LIMIT);

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
        role={profile.role}
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
