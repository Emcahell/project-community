"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateStudentProfile, updateInstitutionProfile } from "@/app/actions/profile";
import { Upload, FileText, X, Camera } from "lucide-react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

type Profile = {
  full_name: string | null;
  role: string;
  avatar_url: string | null;
  career: string | null;
  semester: number | null;
  cv_url: string | null;
};
type Institution = {
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
} | null;

export function ProfileForm({
  profile,
  institution,
}: {
  profile: Profile;
  institution: Institution;
}) {
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [cvFileName, setCvFileName] = useState<string | null>(
    profile.cv_url ? "CV actual" : null
  );
  const cvInputRef = useRef<HTMLInputElement>(null);

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
    setAvatarPreview(URL.createObjectURL(file));
    setIsDirty(true);
  }

  function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCvFileName(file.name);
      setIsDirty(true);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const action =
      profile.role === "institution"
        ? updateInstitutionProfile
        : updateStudentProfile;

    const result = await action(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Cambios guardados correctamente.");
      setIsDirty(false);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="space-y-6">
      {/* Avatar */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 group cursor-pointer"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar"
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
              Cambiar foto
            </button>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG o WebP · Máx. 2 MB
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

      {/* Personal data */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Datos personales</h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre completo</label>
          <input
            name="full_name"
            type="text"
            required
            defaultValue={profile.full_name ?? ""}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {profile.role === "student" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Carrera</label>
              <input
                name="career"
                type="text"
                placeholder="Ej. Ingeniería en Sistemas"
                defaultValue={profile.career ?? ""}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Semestre</label>
              <input
                name="semester"
                type="number"
                min={1}
                max={12}
                placeholder="1–12"
                defaultValue={profile.semester ?? ""}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

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
                    if (cvInputRef.current) cvInputRef.current.value = "";
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
          <p className="text-xs text-muted-foreground">Solo PDF · Máx. 5 MB</p>
        </div>
      )}

      {/* Institution data */}
      {profile.role === "institution" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Datos de la institución</h2>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Nombre de la institución <span className="text-destructive">*</span>
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={institution?.name ?? ""}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={institution?.description ?? ""}
              placeholder="Breve descripción de la institución..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Dirección</label>
              <input
                name="address"
                type="text"
                defaultValue={institution?.address ?? ""}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Teléfono</label>
              <input
                name="phone"
                type="tel"
                defaultValue={institution?.phone ?? ""}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sitio web</label>
            <input
              name="website"
              type="url"
              placeholder="https://..."
              defaultValue={institution?.website ?? ""}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
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
