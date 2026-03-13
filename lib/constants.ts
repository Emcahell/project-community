export const NEED_STATUS: Record<string, { label: string; className: string }> = {
  open: {
    label: "Abierta",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  in_progress: {
    label: "En progreso",
    className: "text-blue-700 bg-blue-50 border-blue-200",
  },
  completed: {
    label: "Completada",
    className: "text-muted-foreground bg-muted border-border",
  },
};

export const APPLICATION_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  accepted: {
    label: "Aceptada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rechazada",
    className: "bg-red-50 text-red-600 border-red-200",
  },
};
