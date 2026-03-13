import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(" ")
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
