import { describe, expect, it } from "vitest";
import {
  registerSchema,
  needSchema,
  scheduleSchema,
  teamSchema,
  MAX_TEAM_SIZE,
} from "@/lib/validations";

const baseRegister = {
  role: "student" as const,
  first_name: "Ana",
  last_name: "Pérez",
  institution_name: "",
  email: "ana@correo.com",
  password: "contraseña-segura",
  confirm_password: "contraseña-segura",
};

describe("registerSchema", () => {
  it("acepta un estudiante válido", () => {
    expect(registerSchema.safeParse(baseRegister).success).toBe(true);
  });

  it("exige contraseñas de al menos 8 caracteres", () => {
    const result = registerSchema.safeParse({ ...baseRegister, password: "1234567", confirm_password: "1234567" });
    expect(result.success).toBe(false);
  });

  it("no permite registrarse como admin", () => {
    expect(registerSchema.safeParse({ ...baseRegister, role: "admin" }).success).toBe(false);
  });

  it("exige el nombre de la institución para instituciones", () => {
    const result = registerSchema.safeParse({ ...baseRegister, role: "institution" });
    expect(result.success).toBe(false);
  });
});

describe("needSchema", () => {
  it("rechaza departamentos que no son UUID", () => {
    const result = needSchema.safeParse({
      title: "Sistema de inventario",
      description: "Necesitamos un sistema para controlar los activos.",
      department_id: "1 or 1=1",
    });
    expect(result.success).toBe(false);
  });
});

describe("scheduleSchema", () => {
  it("exige que el cierre sea posterior a la apertura", () => {
    const result = scheduleSchema.safeParse({ days: ["mon"], open_time: "14:00", close_time: "08:00" });
    expect(result.success).toBe(false);
  });
});

describe("teamSchema", () => {
  it("limita el tamaño del equipo", () => {
    const ids = Array.from({ length: MAX_TEAM_SIZE + 1 }, () => crypto.randomUUID());
    expect(teamSchema.safeParse(ids).success).toBe(false);
  });
});
