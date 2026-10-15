/**
 * Limpia un término de búsqueda para usarlo dentro de un filtro `or()` de
 * PostgREST: elimina caracteres con significado sintáctico (`,` `(` `)`),
 * comodines (`%` `*`) y la barra invertida.
 */
export function sanitizeSearch(value: string | null | undefined, maxLength = 80): string {
  if (!value) return "";
  return value
    .replace(/[,()%*\\:"']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
