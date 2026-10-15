import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-primary mb-2">404</p>
        <h1 className="text-xl font-bold mb-2">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Lo que buscas no existe o ya no está disponible.
        </p>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
