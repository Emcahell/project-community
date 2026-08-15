import { z } from "zod";

export const MAX_DESCRIPTION = 1500;
export const MAX_APPLICATION_MESSAGE = 500;
export const MAX_AVATAR_SIZE = 4 * 1024 * 1024;

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

// ---------- Horario de atención ----------

export const WEEK_DAYS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mié" },
  { value: "thu", label: "Jue" },
  { value: "fri", label: "Vie" },
  { value: "sat", label: "Sáb" },
  { value: "sun", label: "Dom" },
] as const;

export type Schedule = {
  days: string[];
  open_time: string;
  close_time: string;
};

export const scheduleSchema = z
  .object({
    days: z
      .array(z.string())
      .min(1, "Selecciona al menos un día."),
    open_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Ingresa la hora de apertura (HH:MM)."),
    close_time: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Ingresa la hora de cierre (HH:MM)."),
  })
  .refine((s) => s.open_time < s.close_time, {
    message: "La hora de cierre debe ser posterior a la de apertura.",
    path: ["close_time"],
  });

export const institutionSetupSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la institución es requerido."),
  email: emailField,
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  address: z.string().trim().min(1, "La dirección es obligatoria."),
  phone: z.string().trim().min(1, "El contacto es obligatorio."),
  website: urlOrEmpty,
  schedule: scheduleSchema,
});
export type InstitutionSetupValues = z.infer<typeof institutionSetupSchema>;

// ---------- Perfil ----------

// Trayectos de la carrera de Informática: primer trayecto no aplica
// (quienes lo cursan aún no trabajan con sistemas).
export const TRACKS = [
  { value: "2", label: "Segundo trayecto" },
  { value: "3", label: "Tercer trayecto" },
  { value: "4", label: "Cuarto trayecto" },
] as const;

export const STUDENT_CAREER = "Informática";

const trackField = z.union([
  z.literal(""),
  z.enum(["2", "3", "4"], { message: "Selecciona tu trayecto." }),
]);

export const studentProfileSchema = z.object({
  first_name: z.string().trim().min(2, "Ingresa tu primer nombre."),
  last_name: z.string().trim().min(2, "Ingresa tu primer apellido."),
  track: trackField,
});
export type StudentProfileValues = z.infer<typeof studentProfileSchema>;

export const institutionProfileSchema = z.object({
  name: z.string().trim().min(2, "El nombre de la institución es requerido."),
  email: emailField,
  description: z.string().trim().min(1, "La descripción es obligatoria."),
  address: z.string().trim().min(1, "La dirección es obligatoria."),
  phone: z.string().trim().min(1, "El contacto es obligatorio."),
  website: urlOrEmpty,
  schedule: scheduleSchema,
});
export type InstitutionProfileValues = z.infer<typeof institutionProfileSchema>;

// ---------- Departamentos ----------

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres."),
});
export type DepartmentValues = z.infer<typeof departmentSchema>;

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
  department_id: z.string().trim().optional(),
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

export const MAX_REJECTION_REASON = 500;

export const rejectionReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Escribe un motivo de rechazo (mínimo 5 caracteres).")
    .max(
      MAX_REJECTION_REASON,
      `El motivo no puede superar ${MAX_REJECTION_REASON} caracteres.`,
    ),
});
export type RejectionReasonValues = z.infer<typeof rejectionReasonSchema>;
