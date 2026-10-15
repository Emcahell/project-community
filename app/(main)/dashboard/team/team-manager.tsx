"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getInitials, getDisplayName } from "@/lib/utils";
import { toast } from "sonner";
import { saveTeam, findStudentByEmail } from "@/app/actions/team";
import { MAX_TEAM_SIZE } from "@/lib/validations";
import type { MemberProfile } from "@/lib/team";
import { Search, X, Users, UserPlus, Loader2 } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function TeamManager({
  initialMembers,
}: {
  initialMembers: MemberProfile[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<MemberProfile[]>(initialMembers);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const email = query.trim();
  const isValidEmail = EMAIL_RE.test(email);

  // Búsqueda por correo exacto (con debounce) para no exponer correos ajenos
  useEffect(() => {
    if (!isValidEmail) return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await findStudentByEmail(email);
      if (!active) return;
      if (result.error !== undefined) {
        toast.error(result.error);
        setResults([]);
      } else {
        const found = result.student;
        setResults(found && !members.some((m) => m.id === found.id) ? [found] : []);
      }
      setSearching(false);
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [email, isValidEmail, members]);

  function addMember(profile: MemberProfile) {
    if (members.length >= MAX_TEAM_SIZE) {
      toast.error(`Un equipo puede tener como máximo ${MAX_TEAM_SIZE} integrantes además de ti.`);
      return;
    }
    setMembers((prev) => [...prev, profile]);
    setResults((prev) => prev.filter((r) => r.id !== profile.id));
    setQuery("");
    setResults([]);
    setHasChanges(true);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    const memberIds = members.map((m) => m.id);
    const result = await saveTeam(memberIds);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Equipo guardado correctamente.");
      setHasChanges(false);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="email"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResults([]);
          }}
          placeholder="Correo exacto del compañero (ej. ana@correo.com)"
          aria-label="Buscar estudiante por correo"
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-2 space-y-1">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => addMember(r)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {getInitials(getDisplayName(r))}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {getDisplayName(r)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {email}
                </p>
              </div>
              <UserPlus className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
            </button>
          ))}
        </div>
      )}

      {!searching && isValidEmail && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No hay ningún estudiante registrado con ese correo.
        </p>
      )}

      {/* Current members */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            Mi equipo ({members.length})
          </h2>
        </div>

        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aún no tienes integrantes en tu equipo.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Escribe el correo de tu compañero arriba para agregarlo.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                  {getInitials(getDisplayName(m))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {getDisplayName(m)}
                  </p>
                  <p className="text-xs text-muted-foreground">Estudiante</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label="Eliminar integrante"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar equipo"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
