import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NeedCard } from "@/components/need-card";
import { Building2, GraduationCap, Handshake, Sparkles } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: needs } = await supabase
    .from("needs")
    .select(`*, institutions (id, name, address, profiles (avatar_url))`)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const count = needs?.length ?? 0;

  return (
    <div>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-10 px-6 py-14 sm:px-10 sm:py-16"
        style={{
          background: "linear-gradient(135deg, oklch(0.488 0.243 264.376) 0%, oklch(0.4 0.22 285) 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute right-16 bottom-0 w-48 h-48 rounded-full bg-violet-400/10 translate-y-1/2 pointer-events-none" />
        <div className="absolute left-1/2 top-0 w-96 h-96 rounded-full bg-white/3 -translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma UPTYAB
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 tracking-tight">
            Conecta tu talento con quienes lo necesitan
          </h1>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-8">
            Instituciones públicas publican sus necesidades. Estudiantes las resuelven. Juntos construimos comunidad.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-white/60 text-xs">
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center">
                <Building2 className="w-3 h-3" />
              </div>
              Instituciones públicas
            </span>
            <span className="w-px h-3 bg-white/25" />
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center">
                <GraduationCap className="w-3 h-3" />
              </div>
              Estudiantes UPTYAB
            </span>
            <span className="w-px h-3 bg-white/25" />
            <span className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/15 flex items-center justify-center">
                <Handshake className="w-3 h-3" />
              </div>
              Vinculación real
            </span>
          </div>
        </div>

        {/* Stats badge */}
        {count > 0 && (
          <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white text-sm font-semibold">{count}</span>
            <span className="text-white/60 text-xs">necesidades abiertas</span>
          </div>
        )}
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Necesidades abiertas</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {count > 0
              ? `${count} necesidad${count !== 1 ? "es" : ""} esperando a un estudiante`
              : "No hay necesidades publicadas aún"}
          </p>
        </div>
        {count > 0 && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            {count} activas
          </span>
        )}
      </div>

      {needs && needs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {needs.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-muted/20">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Handshake className="w-6 h-6 text-primary" />
          </div>
          <p className="font-semibold text-sm mb-1">Sin necesidades activas</p>
          <p className="text-sm text-muted-foreground">
            Las instituciones aún no han publicado necesidades.
          </p>
          <Link
            href="/register"
            className="text-sm font-semibold text-primary underline underline-offset-4 mt-3 inline-block hover:text-primary/80 transition-colors"
          >
            Registrar institución
          </Link>
        </div>
      )}
    </div>
  );
}
