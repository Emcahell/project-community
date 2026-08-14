import { Skeleton } from "@/components/ui/skeleton";

export default function NeedDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <Skeleton className="h-4 w-28 mb-6" />

      {/* Title section */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-3 w-32" />
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-full shrink-0 mt-1" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Application cards */}
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
