"use client";

import { useState } from "react";
import { completeOnboarding } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Building2,
  CheckCircle,
  FileText,
  ArrowRight,
} from "lucide-react";

export function OnboardingContent({ role }: { role: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    const result = await completeOnboarding();
    // Si todo va bien, la acción redirige; solo volvemos aquí si hubo error
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/20">
      <div className="w-full max-w-lg">
        {role === "student" ? (
          <StudentContent />
        ) : role === "institution" ? (
          <InstitutionContent />
        ) : (
          <div className="text-center text-muted-foreground">
            Rol no reconocido.
          </div>
        )}

        {error && (
          <p role="alert" className="mt-6 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <Button onClick={handleAccept} disabled={loading} size="lg" className="gap-2">
            {loading ? (
              "Procesando..."
            ) : (
              <>
                Entendido, continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StudentContent() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">¡Bienvenido a Comunidad!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Antes de comenzar, te explicamos cómo funciona la plataforma.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">1</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Configura tu perfil</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Dirígete a <span className="font-medium">Perfil</span> y selecciona tu{" "}
              <span className="font-medium">trayecto</span>. Este es tu primer paso
              obligatorio para usar la plataforma.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">2</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Crea tu equipo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Antes de enviar una solicitud, reúnete con tu equipo de trabajo y
              designa a <span className="font-medium">un integrante</span> quien
              enviará la solicitud en nombre de todo el grupo. Esto evita que varios
              compañeros del mismo equipo apliquen a la misma necesidad.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">3</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Solicita una necesidad</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Explora las necesidades tecnológicas publicadas por instituciones y
              envía tu solicitud para participar en el proyecto que más te interese.
            </p>
          </div>
        </div>

        <hr className="border-border" />

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-300">
                Importante
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Una vez aceptados por una institución, debes presentarte{" "}
                <span className="font-medium">solo en los días y horario</span> que
                la institución publicó. No olvides llevar tu{" "}
                <span className="font-medium">
                  carta de aceptación emitida por la UPTYAB
                </span>
                , firmada por el coordinador de Informática y el/la profesor/a de
                Proyecto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstitutionContent() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">¡Bienvenido a Comunidad!</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Tu institución ya está registrada. Esto es lo que necesitas saber.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">1</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Completa tu perfil</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Dirígete a <span className="font-medium">Perfil</span> y actualiza la
              información de tu institución: dirección, teléfono de contacto, correo
              y horario de atención. Esto facilita la comunicación con los
              estudiantes que te visitarán.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-bold text-primary">2</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Publica tus necesidades</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Crea necesidades tecnológicas para que los estudiantes de la UPTYAB
              puedan verlas y ofrecer sus servicios. Ejemplos:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Sistema de inventario para control de activos</li>
              <li>Aplicación móvil para gestión de servicios</li>
              <li>Sitio web institucional moderno y funcional</li>
              <li>Sistema de facturación o punto de venta</li>
              <li>Automatización de procesos administrativos</li>
            </ul>
          </div>
        </div>

        <hr className="border-border" />

        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
                ¿Por qué usar Comunidad?
              </h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Esta plataforma fomenta el crecimiento tecnológico al conectar
                instituciones con estudiantes de informática capacitados para
                desarrollar software. Automatiza, mejora y moderniza tus procesos,
                fortaleciendo tanto tu institución como la comunidad universitaria.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
