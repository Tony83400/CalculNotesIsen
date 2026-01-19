import { AgendaEvent } from "@/types/agenda";
import { Note } from "@/types/note";

const tokenName = "Token";
const userName = "User";
const agendaName = "Agenda";
const notesName = "Notes";

export async function getToken (): Promise<string | null> {
  return localStorage.getItem(tokenName);
}
export async function setToken(value: string) {
  return localStorage.setItem(tokenName, value);
}

export async function getId() : Promise<string | null>{
  return localStorage.getItem(userName);
}
export async function setId(value: string) {
  return localStorage.setItem(userName, value);
}

export async function  saveAgendaToCache (parsedEvents: AgendaEvent[]){
  try {
    localStorage.setItem(agendaName, JSON.stringify(parsedEvents));
    localStorage.setItem(agendaName+"Date", Date.now().toString()); 
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export async function loadAgendaFromCache (): Promise<AgendaEvent[] | null> {
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

export async function saveNotesToCache  (notes: Note[]) {
  try {
    localStorage.setItem(notesName, JSON.stringify(notes));
    localStorage.setItem(notesName+"Date", Date.now().toString()); 
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export async function loadNotesFromCache (): Promise<Note[] | null> {
  const cachedString = localStorage.getItem(notesName);

  if (!cachedString) return null;

  // On transforme le texte en objet JSON
  const rawNotes = JSON.parse(cachedString);
  return rawNotes;
};


export async function clearAgendaFromStorage () {
  localStorage.removeItem(agendaName);
  localStorage.removeItem(agendaName+"Date");
};

export async function clearNotesFromStorage () {
  localStorage.removeItem(notesName);
  localStorage.removeItem(notesName+"Date");
};
export async function clearAllStorage () {
  localStorage.clear();
}