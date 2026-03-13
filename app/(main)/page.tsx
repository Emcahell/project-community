import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NeedCard } from "@/components/need-card";
import { Building2, GraduationCap, Handshake } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: needs } = await supabase
    .from("needs")
    .select(`*, institutions (id, name, address)`)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const count = needs?.length ?? 0;

  return (
    <div>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-primary mb-10 px-6 py-10 sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
            <Handshake className="w-3.5 h-3.5" />
            Plataforma UPTYAB
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
            Conecta tu talento con quienes lo necesitan
          </h1>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6">
            Instituciones públicas publican sus necesidades. Estudiantes las resuelven. Juntos construimos comunidad.
          </p>
          <div className="flex items-center gap-4 text-white/60 text-xs">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Instituciones públicas
            </span>
            <span className="w-px h-3 bg-white/30" />
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Estudiantes UPTYAB
            </span>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute right-12 bottom-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/3 pointer-events-none" />
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Necesidades abiertas</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {count > 0
              ? `${count} necesidad${count !== 1 ? "es" : ""} esperando a un estudiante`
              : "No hay necesidades publicadas aún"}
          </p>
        </div>
      </div>

      {needs && needs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {needs.map((need) => (
            <NeedCard key={need.id} need={need} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">
            Las instituciones aún no han publicado necesidades.
          </p>
          <Link
            href="/register"
            className="text-sm font-medium underline underline-offset-4 mt-2 inline-block"
          >
            Registrar institución
          </Link>
        </div>
      )}
    </div>
  );
}
