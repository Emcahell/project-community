export const NEED_STATUS: Record<string, { label: string; className: string }> = {
  open: {
    label: "Abierta",
    className:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  },
  approved: {
    label: "Aprobada",
    className:
      "text-violet-700 bg-violet-50 border-violet-200 dark:text-violet-300 dark:bg-violet-500/10 dark:border-violet-500/30",
  },
};

export const APPLICATION_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendiente",
    className:
      "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30",
  },
  accepted: {
    label: "Aceptada",
    className:
      "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30",
  },
  rejected: {
    label: "Rechazada",
    className:
      "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/30",
  },
};
