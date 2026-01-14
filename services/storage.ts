import { AgendaEvent } from "@/types/agenda";
import { Note } from "@/types/note";

const tokenName = "Token";
const userName = "User";
const agendaName = "Agenda";
const notesName = "Notes";

export function getToken() {
  return localStorage.getItem(tokenName);
}
export function setToken(value: string) {
  return localStorage.setItem(tokenName, value);
}

export function getId() {
  return localStorage.getItem(userName);
}
export function setId(value: string) {
  return localStorage.setItem(userName, value);
}

export const saveAgendaToCache = (parsedEvents: AgendaEvent[]) => {
  try {
    localStorage.setItem(agendaName, JSON.stringify(parsedEvents));
    localStorage.setItem(agendaName, Date.now().toString()); // Optionnel : pour savoir quand on a mis en cache
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export const loadAgendaFromCache = (): AgendaEvent[] | null => {
  const cachedString = localStorage.getItem(agendaName);

  if (!cachedString) return null;

  // On transforme le texte en objet JSON
  const rawEvents = JSON.parse(cachedString);

  // ⚠️ CRUCIAL : On réhydrate les dates (car JSON les a transformées en string)
  const fixedEvents = rawEvents.map((event: any) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));

  return fixedEvents;
};

export const saveNotesToCache = (notes: Note[]) => {
  try {
    localStorage.setItem(notesName, JSON.stringify(notes));
    localStorage.setItem(agendaName, Date.now().toString()); // Optionnel : pour savoir quand on a mis en cache
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export const loadNotesFromCache = (): Note[] | null => {
  const cachedString = localStorage.getItem(notesName);

  if (!cachedString) return null;

  // On transforme le texte en objet JSON
  const rawNotes = JSON.parse(cachedString);
  return rawNotes;
};
