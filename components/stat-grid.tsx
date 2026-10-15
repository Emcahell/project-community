const TONE_CLASS = {
  default: "",
  warning: "text-amber-600",
  success: "text-emerald-600",
} as const;

export type Stat = {
  label: string;
  value: number;
  tone?: keyof typeof TONE_CLASS;
};

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-3 gap-2 shrink-0 w-full sm:w-auto">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center"
        >
          <dd className={`text-lg font-bold tracking-tight ${TONE_CLASS[stat.tone ?? "default"]}`}>
            {stat.value}
          </dd>
          <dt className="text-[10px] text-muted-foreground font-medium mt-0.5">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}
