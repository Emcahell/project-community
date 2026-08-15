import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";

export function MobileNav({
  userId,
  avatarUrl,
  fullName,
  role,
}: {
  userId: string;
  avatarUrl: string | null;
  fullName?: string;
  role?: string;
}) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="flex items-center justify-center gap-2 h-16">
        <NotificationBell userId={userId} />
        <UserMenu avatarUrl={avatarUrl} fullName={fullName} role={role} />
      </div>
    </nav>
  );
}
