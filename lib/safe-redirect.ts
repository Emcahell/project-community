/**
 * Devuelve `next` solo si es una ruta interna relativa ("/algo").
 * Evita redirecciones abiertas como "//evil.com", "@evil.com" o
 * "https://evil.com".
 */
export function safeNextPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/[\r\n\t]/.test(next)) return fallback;
  return next;
}
