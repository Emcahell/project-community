"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import {
  institutionSetupSchema,
  MAX_AVATAR_SIZE,
  WEEK_DAYS,
  type InstitutionSetupValues,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Camera, Clock } from "lucide-react";
import Image from "next/image";
import { getInitials } from "@/lib/utils";

export function InstitutionSetupForm({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } =  useForm<InstitutionSetupValues>({
    resolver: zodResolver(institutionSetupSchema),
    defaultValues: {
      name: initialName,
      email: initialEmail,
      description: "",
      address: "",
      phone: "",
      website: "",
      schedule: { days: [], open_time: "", close_time: "" },
    },
  });

  const selectedDays = watch("schedule.days") ?? [];

  function toggleDay(day: string) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setValue("schedule.days", next, { shouldValidate: true });
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_SIZE) {
      setError("root", { message: "El logo no puede superar 4 MB." });
      e.target.value = "";
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: InstitutionSetupValues) {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Prevent duplicate institution creation
    const { data: existing } = await supabase
      .from("institutions")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (existing) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Cambiar el correo de acceso si fue modificado
    if (values.email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: values.email,
      });
      if (emailError) {
        setError("root", {
          message:
            emailError.code === "email_exists"
              ? "Ese correo ya está en uso por otra cuenta."
              : `No se pudo cambiar el correo de acceso: ${emailError.message} (${emailError.code ?? "sin código"})`,
        });
        return;
      }
    }

    // Logo upload (opcional)
    let avatarUrl: string | null = null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (uploadError) {
        setError("root", { message: "Error subiendo el logo." });
        return;
      }
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    }

    const { error } = await supabase.from("institutions").insert({
      profile_id: user.id,
      name: values.name,
      email: values.email,
      description: values.description || null,
      address: values.address || null,
      phone: values.phone || null,
      website: values.website || null,
      schedule: values.schedule,
    });

    if (error) {
      setError("root", { message: "Ocurrió un error al guardar la institución." });
      return;
    }

    // Guardar el logo también en el perfil para navbar/dashboard
    if (avatarUrl) {
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);
      await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl },
      });
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Logo de la institución (primero) */}
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
              {getInitials(initialName)}
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
            Subir logo de la institución
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

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Nombre de la institución <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          {...register("name")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.name && (
          <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Correo de registro <span className="text-destructive">*</span>
        </label>
        <input
          type="email"
          placeholder="correo@institución.edu"
          {...register("email")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.email && (
          <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Descripción <span className="text-destructive">*</span>
        </label>
        <textarea
          rows={3}
          placeholder="Breve descripción de la institución..."
          {...register("description")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {errors.description && (
          <p className="text-xs text-destructive mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          Horario de atención <span className="text-destructive">*</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {WEEK_DAYS.map((d) => {
            const active = selectedDays.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`w-10 h-9 rounded-lg border text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Selecciona al menos un día.
        </p>
        {errors.schedule?.days && (
          <p className="text-xs text-destructive mt-1">
            {errors.schedule.days.message}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Hora de apertura <span className="text-destructive">*</span>
            </label>
            <input
              type="time"
              {...register("schedule.open_time")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Hora de cierre <span className="text-destructive">*</span>
            </label>
            <input
              type="time"
              {...register("schedule.close_time")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
        {(errors.schedule?.open_time || errors.schedule?.close_time) && (
          <p className="text-xs text-destructive mt-1">
            {errors.schedule?.open_time?.message ??
              errors.schedule?.close_time?.message}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Dirección <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          {...register("address")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.address && (
          <p className="text-xs text-destructive mt-1">{errors.address.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">
          Contacto <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          placeholder="Teléfono o correo de contacto"
          {...register("phone")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.phone && (
          <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Sitio web</label>
        <input
          type="url"
          placeholder="https://..."
          {...register("website")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.website && (
          <p className="text-xs text-destructive mt-1">{errors.website.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar información"}
      </Button>
    </form>
  );
}
