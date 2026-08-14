import { z } from "zod";

export const MAX_DESCRIPTION = 1500;
export const MAX_APPLICATION_MESSAGE = 500;
export const MAX_AVATAR_SIZE = 4 * 1024 * 1024;
export const MAX_CV_SIZE = 4 * 1024 * 1024;

// ---------- Auth ----------

const emailField = z
  .string()
  .trim()
  .min(1, "Ingresa tu correo electrónico.")
  .email("Ingresa un correo electrónico válido.");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "La contraseña es requerida."),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirm: z.string().min(1, "Confirma tu contraseña."),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z
  .object({
    role: z.enum(["student", "institution"]),
    first_name: z.string().trim(),
    last_name: z.string().trim(),
    institution_name: z.string().trim(),
    email: emailField,
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirm_password: z.string().min(1, "Confirma tu contraseña."),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student") {
      if (data.first_name.length < 2)
        ctx.addIssue({
          code: "custom",
          path: ["first_name"],
          message: "Ingresa tu primer nombre (mínimo 2 caracteres).",
        });
      if (data.last_name.length < 2)
        ctx.addIssue({
          code: "custom",
          path: ["last_name"],
          message: "Ingresa tu primer apellido (mínimo 2 caracteres).",
        });
    } else if (data.institution_name.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["institution_name"],
        message: "Ingresa el nombre de la institución (mínimo 2 caracteres).",
      });
    }
    if (data.password !== data.confirm_password)
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Las contraseñas no coinciden.",
      });
  });
export type RegisterValues = z.infer<typeof registerSchema>;

// ---------- Institución ----------

const urlOrEmpty = z.union([
  z.literal(""),
  z.string().trim().url("Ingresa una URL válida (https://...)."),
]);

export const institutionSetupSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la institución es requerido."),
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  address: z.string().trim().min(1, "La dirección es obligatoria."),
  phone: z.string().trim().min(1, "El contacto es obligatorio."),
  website: urlOrEmpty,
});
export type InstitutionSetupValues = z.infer<typeof institutionSetupSchema>;

// ---------- Perfil ----------

const semesterField = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .regex(/^\d+$/, "El semestre debe ser un número entero.")
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 12,
      "El semestre debe estar entre 1 y 12.",
    ),
]);

export const studentProfileSchema = z.object({
  first_name: z.string().trim().min(2, "Ingresa tu primer nombre."),
  last_name: z.string().trim().min(2, "Ingresa tu primer apellido."),
  career: z.string().trim(),
  semester: semesterField,
});
export type StudentProfileValues = z.infer<typeof studentProfileSchema>;

export const institutionProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Ingresa tu nombre completo."),
  name: z.string().trim().min(2, "El nombre de la institución es requerido."),
  description: z.string().trim(),
  address: z.string().trim(),
  phone: z.string().trim(),
  website: urlOrEmpty,
});
export type InstitutionProfileValues = z.infer<typeof institutionProfileSchema>;

// ---------- Necesidades ----------

export const needSchema = z.object({
  title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres."),
  description: z
    .string()
    .trim()
    .min(20, "La descripción debe tener al menos 20 caracteres.")
    .max(
      MAX_DESCRIPTION,
      `La descripción no puede superar ${MAX_DESCRIPTION} caracteres.`,
    ),
});
export type NeedValues = z.infer<typeof needSchema>;

export const applicationSchema = z.object({
  message: z
    .string()
    .trim()
    .max(
      MAX_APPLICATION_MESSAGE,
      `El mensaje no puede superar ${MAX_APPLICATION_MESSAGE} caracteres.`,
    ),
});
export type ApplicationValues = z.infer<typeof applicationSchema>;
