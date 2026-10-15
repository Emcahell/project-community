import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-redirect";

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/dashboard?page=2")).toBe("/dashboard?page=2");
  });

  it("usa el valor por defecto si falta", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("", "/login")).toBe("/login");
  });

  it.each(["//evil.com", "/\\evil.com", "@evil.com", "https://evil.com", "evil.com", "/ok\n//x"])(
    "rechaza redirecciones abiertas: %s",
    (next) => {
      expect(safeNextPath(next)).toBe("/dashboard");
    },
  );
});
