export const GENERIC_ERROR = "Ocurrió un error inesperado. Intenta de nuevo.";

type MaybeError = { message?: string; code?: string } | null | undefined;

/**
 * Registra el error real en el servidor y devuelve un mensaje genérico
 * para el usuario, sin filtrar detalles internos de la base de datos.
 */
export function failure(context: string, error: MaybeError, message = GENERIC_ERROR) {
  console.error(`[${context}]`, error?.code ?? "", error?.message ?? error);
  return { error: message };
}

/** Código de Postgres para violación de restricción única. */
export const UNIQUE_VIOLATION = "23505";

/** Resultado de una server action: error presentable o datos de éxito. */
export type ActionResult<T extends object = { success: true }> =
  | { error: string }
  | ({ error?: undefined } & T);
