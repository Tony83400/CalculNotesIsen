import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useCallback,
} from "react";
import {
  getDataGeneration,
  subscribeDataScope,
  assertCurrent,
  invalidateDataScope,
} from "../services/dataScope";
import * as storage from "../services/storage";
import { getNotes, login } from "../services/isenApi";
import { getAgendaFor } from "../services/agendaApi";
import { restoreWebSession, clearWebSession } from "../services/webSession";
import {
  fetchSemesterStructure,
  updateStructureConfig,
} from "../services/configApi";
import { validateStructure, validateNotes } from "../utils/notes";
import type { Note, Ue } from "../types/note";
import type { AgendaEvent } from "../types/agenda";
import {
  programmerNotifications,
  cancelCourseNotifications,
} from "../utils/notifications";

type Status = "idle" | "loading" | "network" | "cache" | "error";
interface Resource<T> {
  data: T;
  status: Status;
  updatedAt: string | null;
  error: string | null;
}
const empty = <T,>(data: T): Resource<T> => ({
  data,
  status: "idle",
  updatedAt: null,
  error: null,
});

function useAppState() {
  const generation = useSyncExternalStore(
    subscribeDataScope,
    getDataGeneration,
    getDataGeneration,
  );
  const [ready, setReady] = useState(false),
    [user, setUser] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null),
    [semester, setSemester] = useState<string | null>(null),
    [majors, setMajors] = useState<Record<string, string>>({}),
    [configs, setConfigs] = useState<Record<string, Ue[]>>({});
  const [notes, setNotes] = useState<Resource<Note[]>>(empty([])),
    [agenda, setAgenda] = useState<Resource<AgendaEvent[]>>(empty([]));
  const [owner, setOwner] = useState(generation),
    [simulations, setSimulations] = useState<
      Record<string, Record<string, number | null>>
    >({});
  const controller = useRef<AbortController | null>(null);
  const noteFlight = useRef<Promise<void> | null>(null),
    agendaFlight = useRef<Promise<void> | null>(null);

  const refreshNotes = useCallback(
    (id: string, g: number, signal: AbortSignal) => {
      if (noteFlight.current) return noteFlight.current;
      setNotes((p) => ({ ...p, status: "loading", error: null }));
      const task = (async () => {
        try {
          const data = await getNotes(signal);
          assertCurrent(g, signal);
          const updatedAt = await storage.writeCache("notes", id, data, g);
          assertCurrent(g, signal);
          setNotes({ data, status: "network", updatedAt, error: null });
        } catch (e) {
          if (g !== getDataGeneration() || signal.aborted) return;
          setNotes((p) => ({
            ...p,
            status: p.updatedAt ? "cache" : "error",
            error:
              (e as Error).name === "AbortError"
                ? "Le service met trop de temps à répondre."
                : (e as Error).message,
          }));
        }
      })();
      noteFlight.current = task;
      void task.finally(() => {
        if (noteFlight.current === task) noteFlight.current = null;
      });
      return task;
    },
    [],
  );

  const refreshAgenda = useCallback(
    (id: string, g: number, signal: AbortSignal) => {
      if (agendaFlight.current) return agendaFlight.current;
      setAgenda((p) => ({ ...p, status: "loading", error: null }));
      const task = (async () => {
        try {
          const data = await getAgendaFor(id, signal);
          assertCurrent(g, signal);
          const updatedAt = await storage.writeCache("agenda", id, data, g);
          assertCurrent(g, signal);
          setAgenda({ data, status: "network", updatedAt, error: null });
          void programmerNotifications(data);
        } catch (e) {
          if (g !== getDataGeneration() || signal.aborted) return;
          setAgenda((p) => ({
            ...p,
            status: p.updatedAt ? "cache" : "error",
            error:
              (e as Error).name === "AbortError"
                ? "Le service met trop de temps à répondre."
                : (e as Error).message,
          }));
        }
      })();
      agendaFlight.current = task;
      void task.finally(() => {
        if (agendaFlight.current === task) agendaFlight.current = null;
      });
      return task;
    },
    [],
  );

  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    noteFlight.current = null;
    agendaFlight.current = null;
    setReady(false);
    setOwner(generation);
    setNotes(empty([]));
    setAgenda(empty([]));
    setConfigs({});
    setSimulations({});
    void (async () => {
      try {
        if (!(await storage.getId())) {
          const restored = await restoreWebSession();
          assertCurrent(generation, abort.signal);
          if (restored) {
            await storage.setId(restored.username);
            await storage.setToken(restored.token);
            invalidateDataScope();
            return;
          }
        }
        const [id, y, s, m, urls] = await Promise.all([
          storage.getId(),
          storage.getSelectedYear(),
          storage.getSelectedSemester(),
          storage.getSelectedMajors(),
          storage.getSelectedMajorsUrls(),
        ]);
        assertCurrent(generation, abort.signal);
        setUser(id);
        setYear(y);
        setSemester(s);
        setMajors(m || {});
        if (id) {
          const [n, a] = await Promise.all([
            storage.readCache<Note[]>("notes", id),
            storage.readCache<AgendaEvent[]>("agenda", id),
          ]);
          assertCurrent(generation, abort.signal);
          if (n)
            setNotes({
              data: validateNotes(n.data),
              status: "cache",
              updatedAt: n.updatedAt,
              error: null,
            });
          if (a)
            setAgenda({
              data: storage.reviveEvents(a.data),
              status: "cache",
              updatedAt: a.updatedAt,
              error: null,
            });
        }
        if (urls) {
          const entries = await Promise.all(
            Object.entries(urls).map(
              async ([sem, url]) =>
                [
                  sem,
                  validateStructure(await fetchSemesterStructure(sem, url)),
                ] as const,
            ),
          );
          assertCurrent(generation, abort.signal);
          setConfigs(Object.fromEntries(entries));
        }
        setReady(true);
        if (id) {
          void refreshNotes(id, generation, abort.signal);
          void refreshAgenda(id, generation, abort.signal);
        }
      } catch (e) {
        if (abort.signal.aborted || generation !== getDataGeneration()) return;
        setNotes((p) => ({
          ...p,
          status: "error",
          error: (e as Error).message,
        }));
        setReady(true);
      }
    })();
    return () => abort.abort();
  }, [generation, refreshNotes, refreshAgenda]);

  const authenticate = async (
    username: string,
    password: string,
    remember: boolean,
  ) => {
    setSessionError(null);
    const g = getDataGeneration();
    const result = await login({
      username: username.trim().toLowerCase(),
      password,
      remember,
    });
    assertCurrent(g);
    await storage.clearAllStorage();
    await cancelCourseNotifications();
    await storage.setId(username.trim().toLowerCase());
    await storage.setToken(result.token);
    await storage.setPasswordStorage(remember ? password : "");
    invalidateDataScope();
  };

  const logout = async () => {
    setSessionError(null);
    try {
      await clearWebSession();
    } catch {
      setSessionError(
        "La déconnexion n’a pas pu être confirmée. Réessayez avec une connexion réseau.",
      );
      return false;
    }
    controller.current?.abort();
    await storage.clearAllStorage();
    await cancelCourseNotifications();
    invalidateDataScope();
    return true;
  };

  const selectSemester = async (s: string) => {
    if (!majors[s]) return;
    setSemester(s);
    await storage.setSelectedSemester(s);
  };

  const saveCurriculum = async (
    y: string,
    m: Record<string, string>,
    urls: Record<string, string>,
  ) => {
    const g = getDataGeneration();
    await Promise.all(
      Object.entries(urls).map(async ([s, url]) =>
        validateStructure(await fetchSemesterStructure(s, url)),
      ),
    );
    assertCurrent(g);
    const keys = Object.keys(m);
    const sem = semester && m[semester] ? semester : keys[0];
    await storage.setSelectedYear(y);
    await storage.setSelectedMajors(m);
    await storage.setSelectedMajorsUrls(urls);
    await storage.setSelectedSemester(sem);
    invalidateDataScope();
  };

  const refresh = async () => {
    if (!user || !controller.current) return;
    const signal = controller.current.signal;
    await Promise.all([
      refreshNotes(user, generation, signal),
      refreshAgenda(user, generation, signal),
      (async () => {
        try {
          await updateStructureConfig(true);
          const urls = await storage.getSelectedMajorsUrls();
          if (!urls) return;
          const entries = await Promise.all(
            Object.entries(urls).map(
              async ([s, url]) =>
                [
                  s,
                  validateStructure(await fetchSemesterStructure(s, url, true)),
                ] as const,
            ),
          );
          assertCurrent(generation, signal);
          setConfigs(Object.fromEntries(entries));
        } catch (e) {
          if (generation === getDataGeneration() && !signal.aborted)
            setNotes((p) => ({
              ...p,
              error: `Configuration : ${(e as Error).message}`,
            }));
        }
      })(),
    ]);
  };

  const updateSimulation = (id: string, value: number | null) => {
    if (!semester) return;
    setSimulations((p) => ({
      ...p,
      [semester]: { ...p[semester], [id]: value },
    }));
  };

  const resetSimulations = () => {
    if (semester) setSimulations((p) => ({ ...p, [semester]: {} }));
  };

  const current = owner === generation;
  return {
    ready: ready && current,
    user: current ? user : null,
    sessionError,
    year: current ? year : null,
    semester: current ? semester : null,
    majors: current ? majors : {},
    configs: current ? configs : {},
    notes: current ? notes : empty<Note[]>([]),
    agenda: current ? agenda : empty<AgendaEvent[]>([]),
    authenticate,
    logout,
    selectSemester,
    saveCurriculum,
    refresh,
    simulations: current && semester ? simulations[semester] || {} : {},
    updateSimulation,
    resetSimulations,
    generation,
  };
}

const Context = createContext<ReturnType<typeof useAppState> | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const value = useAppState();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAppData() {
  const value = useContext(Context);
  if (!value) throw new Error("AppDataProvider manquant");
  return value;
}
