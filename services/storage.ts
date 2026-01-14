import { AgendaEvent } from "@/types/agenda";

const tokenName = "token";
export function getToken() {
    return localStorage.getItem(tokenName);
}
export function setToken(value: string) {
    return localStorage.setItem(tokenName, value);
}

const userName = "user"
export function getId() {
    return localStorage.getItem(userName);
}
export function setId(value: string) {
    return localStorage.setItem(userName, value);
}



export const saveAgendaToCache = (parsedEvents: AgendaEvent[]) => {
  try {
    localStorage.setItem("monAgendaCache", JSON.stringify(parsedEvents));
    localStorage.setItem("monAgendaDate", Date.now().toString()); // Optionnel : pour savoir quand on a mis en cache
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export const loadAgendaFromCache = (): AgendaEvent[] | null => {
  const cachedString = localStorage.getItem("monAgendaCache");

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