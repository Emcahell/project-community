import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

/** Panel lateral de marca compartido por login y registro (solo escritorio). */
export function AuthBrandPanel({
  badge,
  title,
  description,
  features,
}: {
  badge: string;
  title: string;
  description: string;
  features: { icon: LucideIcon; text: string }[];
}) {
  return (
    <div
      className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, oklch(0.488 0.243 264.376) 0%, oklch(0.35 0.22 285) 100%)",
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div aria-hidden className="absolute right-0 top-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div aria-hidden className="absolute left-0 bottom-0 w-64 h-64 rounded-full bg-violet-400/10 translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <Link href="/" className="flex items-center gap-3 relative z-10">
        <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-white font-bold text-base">Comunidad</span>
          <span className="text-white/50 text-[9px] uppercase tracking-[0.12em] font-medium">
            UPTYAB
          </span>
        </div>
      </Link>

      <div className="relative z-10 max-w-sm">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          {badge}
        </div>
        <h2 className="text-3xl font-bold text-white leading-tight mb-4 tracking-tight">
          {title}
        </h2>
        <p className="text-white/60 text-sm leading-relaxed mb-10">{description}</p>
        <ul className="space-y-3.5">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3.5 text-white/75 text-sm">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-white/30 text-xs relative z-10">© {new Date().getFullYear()} UPTYAB</p>
    </div>
  );
}

/** Logo compacto que se muestra en móvil, cuando el panel lateral está oculto. */
export function AuthMobileLogo() {
  return (
    <div className="flex items-center gap-2.5 mb-8 lg:hidden">
      <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shadow-md shadow-primary/25">
        <span className="text-white text-sm font-bold">C</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-bold text-sm">Comunidad</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-[0.12em]">
          UPTYAB
        </span>
      </div>
    </div>
  );
}
