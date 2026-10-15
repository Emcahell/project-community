import { Search } from "lucide-react";

/** Búsqueda de necesidades por URL (?q=), sin JavaScript en el cliente. */
export function NeedSearch({
  defaultValue,
  action = "/dashboard",
}: {
  defaultValue?: string;
  action?: string;
}) {
  return (
    <form action={action} role="search" className="relative w-full sm:w-64">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar necesidades..."
        aria-label="Buscar necesidades"
        maxLength={80}
        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </form>
  );
}
