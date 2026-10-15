"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteNeed } from "@/app/actions/needs";

/** Botones de editar/eliminar una necesidad (solo mientras está abierta). */
export function NeedActions({
  needId,
  canDelete,
}: {
  needId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteNeed(needId);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
      setConfirming(false);
      return;
    }
    toast.success("Necesidad eliminada.");
    router.push("/dashboard");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">¿Eliminar esta necesidad?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Eliminando..." : "Sí, eliminar"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={deleting}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/needs/${needId}/edit`}>
        <Button size="sm" variant="outline">
          <Pencil className="w-3.5 h-3.5 mr-1" />
          Editar
        </Button>
      </Link>
      {canDelete && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirming(true)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Eliminar
        </Button>
      )}
    </div>
  );
}
