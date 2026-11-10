import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { AgendaEvent } from "../types/agenda";
import { fetchCalendar } from "../services/agendaApi";
import { getStorageItem, setStorageItem } from "../services/storage/base";
import { useAppData } from "../providers/AppData";

export interface RecentUser {
  id: string;
  prenom: string;
  nom: string;
}
export interface MultiAgendaUser extends RecentUser {
  color: string;
}

const USER_COLORS = [
  "#2563EB", // Bleu Royal
  "#10B981", // Vert Emeraude
  "#F43F5E", // Rouge Corail
  "#F59E0B", // Orange Doré
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#14B8A6", // Sarcelle (Teal)
  "#06B6D4", // Cyan
  "#3B82F6", // Bleu Clair
  "#84CC16", // Citron Vert
  "#F97316", // Orange Vif
  "#D946EF", // Fuchsia
  "#6366F1", // Indigo
  "#0EA5E9", // Bleu Ciel
  "#EAB308", // Jaune Moutarde
  "#64748B", // Gris Ardoise
];

export function useMultiAgendaState() {
  const app = useAppData();
  const [users, setUsers] = useState<MultiAgendaUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [cache, setCache] = useState<Record<string, AgendaEvent[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  // État du Lundi de la semaine affichée
  const [currentDay, setCurrentDay] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const m = new Date(now);
    m.setDate(diff);
    m.setHours(0, 0, 0, 0);
    return m;
  });

  // État du jour sélectionné (mode jour)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const endOfWeek = useMemo(() => {
    const end = new Date(currentDay);
    end.setDate(currentDay.getDate() + 5);
    return end;
  }, [currentDay]);

  const seq = useRef(0);
  const cacheRef = useRef<Record<string, AgendaEvent[]>>({});
  const lastRevision = useRef(0);
  const currentUsers = useRef(users);
  currentUsers.current = users;

  const scope = app.user || "guest";
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
            const events = await fetchCalendar(u.prenom, u.nom, abort.signal);
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
  }, [users, revision, hydrated]);

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
          USER_COLORS.find((c) => !used.includes(c)) ||
          USER_COLORS[currentUsers.current.length % USER_COLORS.length],
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

  const changeDate = useCallback(
    (offset: number) => {
      if (viewMode === "week") {
        setCurrentDay((prev) => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + offset);
          return newDate;
        });
      } else {
        setSelectedDate((prev) => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + offset);

          const day = newDate.getDay();
          const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
          const m = new Date(newDate);
          m.setDate(diff);
          m.setHours(0, 0, 0, 0);

          if (m.getTime() !== currentDay.getTime()) {
            setCurrentDay(m);
          }

          return newDate;
        });
      }
    },
    [viewMode, currentDay],
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const newMode = prev === "week" ? "day" : "week";

      if (newMode === "day") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startWeek = new Date(currentDay);
        const endWeek = new Date(currentDay);
        endWeek.setDate(endWeek.getDate() + 6);

        if (today >= startWeek && today <= endWeek) {
          setSelectedDate(today);
        } else {
          setSelectedDate(new Date(currentDay));
        }
      }
      return newMode;
    });
  }, [currentDay]);

  const allEvents = useMemo(
    () =>
      users.flatMap((u) =>
        (cache[u.id] || []).map((e) => ({
          ...e,
          id: `${u.id}:${e.id}`,
          color: u.color,
          userName: `${u.prenom} ${u.nom}`,
        })),
      ),
    [users, cache],
  );

  const weekEvents = useMemo(() => {
    const startWeek = new Date(currentDay);
    const endWeek = new Date(currentDay);
    endWeek.setDate(endWeek.getDate() + 6);
    endWeek.setHours(23, 59, 59, 999);

    return allEvents.filter(
      (event) => event.start >= startWeek && event.start <= endWeek,
    );
  }, [allEvents, currentDay]);

  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const m = new Date(now);
    m.setDate(diff);
    m.setHours(0, 0, 0, 0);

    setCurrentDay(m);
    setSelectedDate(today);
  }, []);

  return {
    users: hydrated ? users : [],
    addUser,
    removeUser,
    recentUsers: hydrated ? recentUsers : [],
    removeRecentUser: (id: string) =>
      setRecentUsers((p) => p.filter((u) => u.id !== id)),
    allEvents: hydrated ? allEvents : [],
    weekEvents: hydrated ? weekEvents : [],
    loading,
    error: null,
    errors: hydrated ? errors : {},
    refresh: () => setRevision((r) => r + 1),
    searchError,
    setSearchError,
    viewMode,
    currentDay,
    selectedDate,
    endOfWeek,
    changeDate,
    goToToday,
    toggleViewMode,
  };
}

const MultiAgendaContext = createContext<ReturnType<
  typeof useMultiAgendaState
> | null>(null);

export function MultiAgendaProvider({ children }: { children: ReactNode }) {
  const value = useMultiAgendaState();
  return createElement(MultiAgendaContext.Provider, { value }, children);
}

export function useMultiAgenda() {
  const value = useContext(MultiAgendaContext);
  if (!value) throw new Error("MultiAgendaProvider manquant");
  return value;
}
