"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeDate } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  need_id: string | null;
  message: string;
  read: boolean;
  created_at: string | null;
};

export function NotificationsList({
  role,
  notifications,
}: {
  role: string;
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
    if (n.type === "team_added") {
      router.push("/dashboard/team");
    } else if (n.need_id) {
      // Institución → página de gestión de la necesidad;
      // estudiante → página pública de detalles de la necesidad
      router.push(
        role === "institution"
          ? `/dashboard/needs/${n.need_id}`
          : `/needs/${n.need_id}`
      );
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted/20">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/15 to-violet-500/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Bell className="w-7 h-7 text-primary" />
        </div>
        <p className="font-semibold mb-1">Sin notificaciones</p>
        <p className="text-sm text-muted-foreground">
          Aquí verás avisos como nuevas solicitudes a tus necesidades.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => handleClick(n)}
          className={`w-full group flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ${
            n.read
              ? "border-border bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              : "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50"
          }`}
        >
          {!n.read && (
            <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 animate-pulse" />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm leading-relaxed ${
                n.read ? "text-muted-foreground" : "font-semibold"
              }`}
            >
              {n.message}
            </p>
            {n.created_at && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeDate(n.created_at)}
              </p>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      ))}
    </div>
  );
}
