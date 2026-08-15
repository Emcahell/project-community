"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  updateStudentProfile,
  updateInstitutionProfile,
} from "@/app/actions/profile";
import {
  studentProfileSchema,
  institutionProfileSchema,
  MAX_AVATAR_SIZE,
  MAX_CV_SIZE,
  type StudentProfileValues,
  type InstitutionProfileValues,
} from "@/lib/validations";
import { Upload, FileText, X, Camera } from "lucide-react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

type Profile = {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  career: string | null;
  semester: number | null;
  cv_url: string | null;
};
type Institution = {
  name: string;
  email: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
} | null;

type ProfileFormData = StudentProfileValues & InstitutionProfileValues;

export function ProfileForm({
  profile,
  institution,
  initialEmail,
}: {
  profile: Profile;
  institution: Institution;
  initialEmail: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_url
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [cvFileName, setCvFileName] = useState<string | null>(
    profile.cv_url ? "CV actual" : null
  );
  const [cvFile, setCvFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Para estudiantes, si aún no hay first_name/last_name (migración pendiente),
  // se dividen del full_name existente como valor inicial.
  const initialFirstName =
    profile.first_name ?? profile.full_name?.split(" ")[0] ?? "";
  const initialLastName =
    profile.last_name ??
    profile.full_name?.split(" ").slice(1).join(" ") ??
    "";

  const schema =
    profile.role === "institution"
      ? institutionProfileSchema
      : studentProfileSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(schema) as unknown as Resolver<ProfileFormData>,
    defaultValues:
      profile.role === "institution"
        ? {
            name: institution?.name ?? "",
            email: institution?.email ?? initialEmail,
            description: institution?.description ?? "",
            address: institution?.address ?? "",
            phone: institution?.phone ?? "",
            website: institution?.website ?? "",
          }
        : {
            first_name: initialFirstName,
            last_name: initialLastName,
            career: profile.career ?? "",
            semester: profile.semester ? String(profile.semester) : "",
          },
  });

  // Warn on browser close/refresh when unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("El logo no puede superar 4 MB.");
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setIsDirty(true);
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CV_SIZE) {
      toast.error("El CV no puede superar 4 MB.");
      e.target.value = "";
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("El CV debe ser un archivo PDF.");
      e.target.value = "";
      return;
    }
    setCvFile(file);
    setCvFileName(file.name);
    setIsDirty(true);
  }

  async function onSubmit(values: ProfileFormData) {
    setLoading(true);
    const result =
      profile.role === "institution"
        ? await updateInstitutionProfile(values, avatarFile)
        : await updateStudentProfile(values, cvFile);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Cambios guardados correctamente.");
      setIsDirty(false);
      // Refresca los server components (navbar, header de perfil) para
      // mostrar el logo nuevo de inmediato
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onChange={() => setIsDirty(true)}
      className="space-y-6"
    >
      {/* Logo (solo instituciones) */}
      {profile.role === "institution" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Logo de la institución</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group cursor-pointer"
            >
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Logo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-primary/10 border border-primary/20 flex items-center justify-center text-lg font-bold text-primary select-none">
                  {getInitials(profile.full_name)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Cambiar logo
              </button>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG o WebP · Máx. 4 MB
              </p>
            </div>
            <input
              ref={avatarInputRef}
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      )}

      {/* Datos personales (solo estudiantes) */}
      {profile.role === "student" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Datos personales</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Primer nombre</label>
              <input
                type="text"
                {...register("first_name")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.first_name && (
                <p className="text-xs text-destructive">
                  {errors.first_name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Primer apellido</label>
              <input
                type="text"
                {...register("last_name")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.last_name && (
                <p className="text-xs text-destructive">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Carrera</label>
              <input
                type="text"
                placeholder="Ej. Ingeniería en Sistemas"
                {...register("career")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Semestre</label>
              <input
                type="number"
                min={1}
                max={12}
                placeholder="1–12"
                {...register("semester")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.semester && (
                <p className="text-xs text-destructive">
                  {errors.semester.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CV upload (students only) */}
      {profile.role === "student" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold">Currículum (CV)</h2>
          <div className="flex items-center gap-3">
            <div
              className={`flex-1 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                cvFileName
                  ? "border-primary/30 bg-primary/5 text-foreground"
                  : "border-dashed border-border text-muted-foreground"
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${cvFileName ? "text-primary" : ""}`} />
              <span className="truncate">{cvFileName ?? "Sin CV adjunto"}</span>
              {cvFileName && profile.cv_url && (
                <a
                  href={profile.cv_url.split("?")[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-primary hover:underline shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver
                </a>
              )}
              {cvFileName && !profile.cv_url && (
                <button
                  type="button"
                  onClick={() => {
                    setCvFileName(null);
                    setCvFile(null);
                    if (cvInputRef.current) cvInputRef.current.value = "";
                    setIsDirty(true);
                  }}
                  className="ml-auto shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              {cvFileName ? "Cambiar" : "Subir PDF"}
            </button>
            <input
              ref={cvInputRef}
              name="cv"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleCvChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">Solo PDF · Máx. 4 MB</p>
        </div>
      )}

      {/* Datos de la institución (todo junto) */}
      {profile.role === "institution" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Datos de la institución</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nombre de la institución <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Correo de registro <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              placeholder="correo@institución.edu"
              {...register("email")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Descripción <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Breve descripción de la institución..."
              {...register("description")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Dirección <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                {...register("address")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.address && (
                <p className="text-xs text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Contacto <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Teléfono o correo de contacto"
                {...register("phone")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sitio web</label>
            <input
              type="url"
              placeholder="https://..."
              {...register("website")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.website && (
              <p className="text-xs text-destructive">{errors.website.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
        {isDirty && (
          <p className="text-xs text-amber-600 font-medium">
            Cambios sin guardar
          </p>
        )}
      </div>
    </form>
  );
}
