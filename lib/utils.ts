import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays === 0) return "hoy"
  if (diffDays === 1) return "ayer"
  if (diffDays < 7) return `hace ${diffDays} días`
  const weeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return `hace ${weeks} semana${weeks > 1 ? "s" : ""}`
  const months = Math.floor(diffDays / 30)
  if (diffDays < 365) return `hace ${months} mes${months > 1 ? "es" : ""}`
  const years = Math.floor(diffDays / 365)
  return `hace ${years} año${years > 1 ? "s" : ""}`
}

type NameParts = {
  full_name?: string | null
  first_name?: string | null
  last_name?: string | null
}

/** Nombre visible: "Nombre Apellido" o, si no existe, `full_name`. */
export function getDisplayName(
  profile: NameParts | null | undefined,
  fallback = "Sin nombre",
): string {
  if (!profile) return fallback
  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(" ")
  return composed || profile.full_name || fallback
}
