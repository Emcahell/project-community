import { Users } from "lucide-react";
import { APPLICATION_STATUS } from "@/lib/constants";
import { getDisplayName, getInitials } from "@/lib/utils";
import type { MemberProfile } from "@/lib/team";

export function TeamCard({
  title,
  status,
  leader,
  members,
}: {
  title: string;
  status?: string;
  leader: { name: string; suffix: string };
  members: MemberProfile[];
}) {
  const statusInfo = status ? APPLICATION_STATUS[status] : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm">{title}</h2>
        {status && (
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusInfo?.className ?? ""}`}
          >
            {statusInfo?.label ?? status}
          </span>
        )}
      </div>
      <ul className="space-y-2">
        <li className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
            {getInitials(leader.name)}
          </div>
          <p className="text-sm font-medium">
            {leader.name}
            <span className="text-muted-foreground font-normal ml-1">{leader.suffix}</span>
          </p>
        </li>
        {members.map((m) => {
          const name = getDisplayName(m);
          return (
            <li key={m.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                {getInitials(name)}
              </div>
              <p className="text-sm font-medium">{name}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
