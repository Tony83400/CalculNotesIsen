import { AgendaEvent } from "@/types/agenda";
import { Note } from "@/types/note";
import { getStorageItem, setStorageItem, removeStorageItem } from "./base";
import { clearStructureCache } from "./configStorage";

const agendaName = "Agenda";
const notesName = "Notes";
const lastUpdateName = "LastUpdate";

export async function saveAgendaToCache(parsedEvents: AgendaEvent[]) {
  try {
    await setStorageItem(agendaName, JSON.stringify(parsedEvents));
  } catch (e) {
    console.error("Quota storage dépassé", e);
  }
}

export async function loadAgendaFromCache(): Promise<AgendaEvent[] | null> {
  const cachedString = await getStorageItem(agendaName);
  if (!cachedString) return null;
  const rawEvents = JSON.parse(cachedString);
  const fixedEvents = rawEvents.map((event: any) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));
  return fixedEvents;
}

export async function saveNotesToCache(notes: Note[]) {
  try {
    await setStorageItem(notesName, JSON.stringify(notes));
  } catch (e) {
    console.error("Quota storage dépassé", e);
  }
}

export async function loadNotesFromCache(): Promise<Note[] | null> {
  const cachedString = await getStorageItem(notesName);
  if (!cachedString) return null;
  return JSON.parse(cachedString);
}

export async function getLastUpdate(): Promise<string | null> {
  return await getStorageItem(lastUpdateName);
}

export async function setLastUpdate(value: string) {
  await setStorageItem(lastUpdateName, value);
}

export async function clearAgendaFromStorage() {
  await removeStorageItem(agendaName);
}

export async function clearNotesFromStorage() {
  await removeStorageItem(notesName);
}

export async function clearAppCache() {
  await Promise.all([
    clearAgendaFromStorage(),
    clearNotesFromStorage(),
    clearStructureCache()
  ]);
}
