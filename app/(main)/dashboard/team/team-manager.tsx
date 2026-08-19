"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { saveTeam } from "@/app/actions/team";
import { createClient } from "@/lib/supabase/client";
import { Search, X, Users, UserPlus, Loader2 } from "lucide-react";

type MemberProfile = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type SearchResult = MemberProfile & {
  email: string;
};

function getDisplayName(profile: { full_name: string | null; first_name: string | null; last_name: string | null }) {
  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return composed || profile.full_name || "Sin nombre";
}

export function TeamManager({
  userId,
  initialMembers,
}: {
  userId: string;
  initialMembers: MemberProfile[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<MemberProfile[]>(initialMembers);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchByEmail = useCallback(async (email: string) => {
    if (!email.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, email")
      .eq("role", "student")
      .neq("id", userId)
      .ilike("email", `%${email}%`)
      .limit(10);

    if (!error && data) {
      // Filter out already-added members
      const memberIds = new Set(members.map((m) => m.id));
      setResults(
        data.filter((d) => !memberIds.has(d.id)).map((d) => ({
          ...d,
          email: (d as { email: string | null }).email ?? "",
        }))
      );
    }
    setSearching(false);
  }, [userId, members]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchByEmail(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchByEmail]);

  function addMember(profile: MemberProfile) {
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
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
                {r.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {r.email}
                  </p>
                )}
              </div>
              <UserPlus className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
            </button>
          ))}
        </div>
      )}

      {!searching && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No se encontraron estudiantes.
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
              Busca por nombre arriba para agregar.
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
