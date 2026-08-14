"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getInitials } from "@/lib/utils";

export function UserMenu({
  avatarUrl,
  fullName,
}: {
  avatarUrl: string | null;
  fullName?: string;
}) {
  const [open, setOpen] = useState(false);

  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Link
          href="/dashboard/profile"
          className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-border hover:ring-primary/40 transition-all"
          title="Editar perfil"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName ?? "Perfil"}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-primary/20 to-violet-500/20 text-primary flex items-center justify-center text-[11px] font-bold select-none">
              {getInitials(fullName)}
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Abrir menú"
          title="Abrir menú"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de usuario"
          >
            <div
              className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
                <span className="font-semibold text-sm">Menú</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                  <span className="text-sm font-medium">Tema</span>
                  <ThemeToggle />
                </div>
                <form action={logout}>
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    type="submit"
                  >
                    Salir
                  </Button>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
