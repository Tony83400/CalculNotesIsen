import { useEffect, useRef, useState } from "react";
import type { AgendaEvent } from "../types/agenda";
import { fetchCalendar } from "../services/agendaApi";
import { getStorageItem, setStorageItem } from "../services/storage/base";
import { useAppData } from "../providers/AppData";
import { useCalendarNavigation } from "./useCalendarNavigation";
import { demoEvents } from "../services/demo";
export interface RecentUser {
  id: string;
  prenom: string;
  nom: string;
}
export interface MultiAgendaUser extends RecentUser {
  color: string;
}
const colors = [
  "#26264C",
  "#B2343D",
  "#2D627A",
  "#6A5730",
  "#49664A",
  "#765680",
];
export function useMultiAgenda() {
  const app = useAppData(),
    nav = useCalendarNavigation({ allowWeekOnMobile: true });
  const [users, setUsers] = useState<MultiAgendaUser[]>([]),
    [recentUsers, setRecentUsers] = useState<RecentUser[]>([]),
    [cache, setCache] = useState<Record<string, AgendaEvent[]>>({}),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(false),
    [searchError, setSearchError] = useState<string | null>(null),
    [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const seq = useRef(0);
  const cacheRef = useRef<Record<string, AgendaEvent[]>>({});
  const lastRevision = useRef(0);
  const currentUsers = useRef(users);
  currentUsers.current = users;
  const scope = app.demo ? "demo" : app.user || "guest";
  const key = `Multi:${encodeURIComponent(scope)}`;
  const scopeKey = `${key}:${app.generation}`;
  const hydrated = loadedScope === scopeKey;
  useEffect(() => {
    let alive = true;
    setLoadedScope(null);
    setUsers([]);
    setRecentUsers([]);
    setCache({});
    cacheRef.current = {};
    setErrors({});
    void (async () => {
      try {
        const raw = await getStorageItem(key);
        const p = raw ? JSON.parse(raw) : null;
        const valid = (x: unknown): x is MultiAgendaUser =>
          !!x &&
          typeof x === "object" &&
          ["id", "prenom", "nom", "color"].every(
            (k) => typeof (x as Record<string, unknown>)[k] === "string",
          );
        if (alive && p) {
          setUsers(
            Array.isArray(p.users) ? p.users.filter(valid).slice(0, 16) : [],
          );
          setRecentUsers(
            Array.isArray(p.recentUsers)
              ? p.recentUsers.filter(valid).slice(0, 10)
              : [],
          );
        }
      } catch {
      } finally {
        if (alive) setLoadedScope(scopeKey);
      }
    })();
    return () => {
      alive = false;
    };
  }, [key, app.generation, scopeKey]);
  useEffect(() => {
    if (hydrated)
      void setStorageItem(key, JSON.stringify({ users, recentUsers })).catch(
        () =>
          setSearchError(
            "Les recherches ne peuvent pas être enregistrées sur cet appareil.",
          ),
      );
  }, [users, recentUsers, hydrated, key]);
  useEffect(() => {
    if (!hydrated) return;
    const sequence = ++seq.current,
      abort = new AbortController();
    const force = revision !== lastRevision.current;
    lastRevision.current = revision;
    const targets = force
      ? users
      : users.filter((u) => !cacheRef.current[u.id]);
    setLoading(targets.length > 0);
    setErrors((p) =>
      Object.fromEntries(
        Object.entries(p).filter(([id]) => !targets.some((u) => u.id === id)),
      ),
    );
    void (async () => {
      await Promise.all(
        targets.map(async (u) => {
          try {
            const events = app.demo
              ? demoEvents().map((e, i) => ({
                  ...e,
                  start: new Date(+e.start + (u.id.length % 3) * 1800000),
                  end: new Date(+e.end + (u.id.length % 3) * 1800000),
                  id: `${e.id}:${i}`,
                }))
              : await fetchCalendar(u.prenom, u.nom, abort.signal);
            if (abort.signal.aborted || sequence !== seq.current) return;
            cacheRef.current = { ...cacheRef.current, [u.id]: events };
            setCache(cacheRef.current);
            setRecentUsers((p) =>
              [u, ...p.filter((r) => r.id !== u.id)].slice(0, 10),
            );
          } catch (e) {
            if (abort.signal.aborted || sequence !== seq.current) return;
            setErrors((p) => ({ ...p, [u.id]: (e as Error).message }));
          }
        }),
      );
      if (sequence === seq.current && !abort.signal.aborted) setLoading(false);
    })();
    return () => abort.abort();
  }, [users, revision, hydrated, app.demo]);
  const addUser = async (prenom: string, nom: string) => {
    const p = prenom.trim().toLowerCase(),
      n = nom.trim().toLowerCase();
    if (!p || !n || !/^[-\p{L}\p{M}' ]+$/u.test(p + n)) {
      setSearchError("Renseignez un prénom et un nom valides.");
      return;
    }
    const id = `${p.replace(/[\s']+/g, "-")}.${n.replace(/[\s']+/g, "-")}`;
    if (currentUsers.current.some((u) => u.id === id)) {
      setSearchError("Cet agenda est déjà affiché.");
      return;
    }
    if (currentUsers.current.length >= 16) {
      setSearchError("Vous pouvez comparer jusqu’à 16 agendas.");
      return;
    }
    const used = currentUsers.current.map((u) => u.color);
    const next = [
      ...currentUsers.current,
      {
        id,
        prenom: p,
        nom: n,
        color:
          colors.find((c) => !used.includes(c)) ||
          colors[currentUsers.current.length % colors.length],
      },
    ];
    currentUsers.current = next;
    setUsers(next);
    setSearchError(null);
  };
  const removeUser = (id: string) => {
    delete cacheRef.current[id];
    setCache({ ...cacheRef.current });
    const next = currentUsers.current.filter((u) => u.id !== id);
    currentUsers.current = next;
    setUsers(next);
  };
  const allEvents = users.flatMap((u) =>
    (cache[u.id] || []).map((e) => ({
      ...e,
      id: `${u.id}:${e.id}`,
      color: u.color,
      userName: `${u.prenom} ${u.nom}`,
    })),
  );
  return {
    ...nav,
    users: hydrated ? users : [],
    addUser,
    removeUser,
    recentUsers: hydrated ? recentUsers : [],
    removeRecentUser: (id: string) =>
      setRecentUsers((p) => p.filter((u) => u.id !== id)),
    allEvents: hydrated ? allEvents : [],
    weekEvents: hydrated ? allEvents : [],
    loading,
    error: null,
    errors: hydrated ? errors : {},
    refresh: () => setRevision((r) => r + 1),
    searchError,
    setSearchError,
  };
}
