import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      <Skeleton className="h-4 w-28 mb-6" />

      {/* Header banner */}
      <Skeleton className="h-[88px] rounded-2xl mb-8" />

      {/* Avatar card */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>

      {/* Personal data card */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 rounded-lg" />
          </div>
        </div>
      </div>

      <Skeleton className="h-9 w-32 rounded-lg" />
    </div>
  );
}
