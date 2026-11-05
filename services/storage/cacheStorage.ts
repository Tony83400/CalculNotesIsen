import type { AgendaEvent } from "../../types/agenda";
import type { Note } from "../../types/note";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  storageKeys,
} from "./base";
import { getId } from "./authStorage";
import {
  getDataGeneration,
  assertCurrent,
  invalidateDataScope,
} from "../dataScope";
import { validateNotes } from "../../utils/notes";
export interface Cached<T> {
  data: T;
  updatedAt: string;
}
export async function readCache<T>(
  kind: string,
  owner: string,
): Promise<Cached<T> | null> {
  try {
    const raw = await getStorageItem(`${kind}:${encodeURIComponent(owner)}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed.owner !== owner ||
      !Number.isFinite(Date.parse(parsed.updatedAt)) ||
      !Array.isArray(parsed.data)
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}
export async function writeCache<T>(
  kind: string,
  owner: string,
  data: T,
  generation = getDataGeneration(),
) {
  assertCurrent(generation);
  const updatedAt = new Date().toISOString();
  try {
    await setStorageItem(
      `${kind}:${encodeURIComponent(owner)}`,
      JSON.stringify({ owner, data, updatedAt }),
      generation,
    );
  } catch {
    /* Network success is still usable if storage is full. */
  }
  assertCurrent(generation);
  return updatedAt;
}
export async function loadNotesFromCache(): Promise<Note[] | null> {
  const c = await readCache<Note[]>("notes", (await getId()) || "guest");
  return c ? validateNotes(c.data) : null;
}
export async function saveNotesToCache(notes: Note[]) {
  return writeCache("notes", (await getId()) || "guest", notes);
}
export function reviveEvents(data: unknown): AgendaEvent[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((e) => {
    if (!e || typeof e.id !== "string" || typeof e.title !== "string")
      return [];
    const start = new Date(e.start),
      end = new Date(e.end);
    return Number.isFinite(+start) && Number.isFinite(+end) && end > start
      ? [{ ...e, start, end }]
      : [];
  });
}
export async function loadAgendaFromCache() {
  const c = await readCache<AgendaEvent[]>(
    "agenda",
    (await getId()) || "guest",
  );
  return c ? reviveEvents(c.data) : null;
}
export async function saveAgendaToCache(data: AgendaEvent[]) {
  return writeCache("agenda", (await getId()) || "guest", data);
}
export async function getLastUpdate() {
  return (
    (await readCache<Note[]>("notes", (await getId()) || "guest"))?.updatedAt ??
    null
  );
}
export async function setLastUpdate(_value: string) {
  /* Timestamp belongs to each cache envelope. */
}
export async function clearAgendaFromStorage() {
  await removeStorageItem(
    `agenda:${encodeURIComponent((await getId()) || "guest")}`,
  );
}
export async function clearNotesFromStorage() {
  await removeStorageItem(
    `notes:${encodeURIComponent((await getId()) || "guest")}`,
  );
}
export async function clearAppCache() {
  invalidateDataScope();
  const keys = await storageKeys();
  await Promise.all(
    keys
      .filter((k) => /^(notes:|agenda:|StructureConfig)/.test(k))
      .map(removeStorageItem),
  );
}
