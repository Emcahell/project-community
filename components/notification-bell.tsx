"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({ userId }: { userId: string }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function refresh() {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("read", false);
      if (active && typeof count === "number") setUnread(count);
    }

    refresh();
    const interval = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId]);

  return (
    <Link
      href="/dashboard/notifications"
      className="relative w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Notificaciones"
      title="Notificaciones"
    >
      <Bell className="w-4 h-4" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background" />
      )}
    </Link>
  );
}
