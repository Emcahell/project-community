import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatRelativeDate, getDisplayName, getInitials } from "@/lib/utils";
import { sanitizeSearch } from "@/lib/search";

describe("getInitials", () => {
  it("toma hasta dos iniciales en mayúscula", () => {
    expect(getInitials("ana maría pérez")).toBe("AM");
    expect(getInitials("Alcaldía")).toBe("A");
  });

  it("tolera espacios repetidos y valores vacíos", () => {
    expect(getInitials("  Ana   Pérez ")).toBe("AP");
    expect(getInitials(null)).toBe("?");
  });
});

describe("getDisplayName", () => {
  it("prefiere nombre y apellido", () => {
    expect(getDisplayName({ first_name: "Ana", last_name: "Pérez", full_name: "X" })).toBe("Ana Pérez");
  });

  it("usa full_name y luego el valor por defecto", () => {
    expect(getDisplayName({ full_name: "Alcaldía" })).toBe("Alcaldía");
    expect(getDisplayName(null, "Compañero")).toBe("Compañero");
  });
});

describe("formatRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("formatea fechas relativas en español", () => {
    expect(formatRelativeDate("2026-10-15T08:00:00Z")).toBe("hoy");
    expect(formatRelativeDate("2026-10-14T08:00:00Z")).toBe("ayer");
    expect(formatRelativeDate("2026-10-10T12:00:00Z")).toBe("hace 5 días");
    expect(formatRelativeDate("2026-09-30T12:00:00Z")).toBe("hace 2 semanas");
    expect(formatRelativeDate("2026-07-15T12:00:00Z")).toBe("hace 3 meses");
    expect(formatRelativeDate("2024-10-01T12:00:00Z")).toBe("hace 2 años");
    expect(formatRelativeDate(null)).toBe("");
  });
});

describe("sanitizeSearch", () => {
  it("elimina caracteres con significado en filtros de PostgREST", () => {
    expect(sanitizeSearch("web,status.eq.open)")).toBe("web status.eq.open");
    expect(sanitizeSearch("100%*")).toBe("100");
  });

  it("recorta la longitud", () => {
    expect(sanitizeSearch("a".repeat(200))).toHaveLength(80);
    expect(sanitizeSearch(undefined)).toBe("");
  });
});
