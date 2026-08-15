export const NEED_STATUS: Record<string, { label: string; className: string }> = {
  open: {
    label: "Abierta",
    className:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  },
  in_progress: {
    label: "En progreso",
    className:
      "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30",
  },
  completed: {
    label: "Aprobada",
    className:
      "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30",
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
