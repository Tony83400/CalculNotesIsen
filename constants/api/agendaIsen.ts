import { getId } from "../token";

export async function getAgendaIsen() {
  try {
    const id = getId();
    if (!id) {
      throw new Error("Utilisateur non connecté (Token manquant)");
    }
    const prenom = id.split(".")[0];
    const nom = id.split(".")[1];

    const res = await fetch(
      `https://calcul-notes-isen.vercel.app/api/calendar?prenom=${prenom}&nom=${nom}`,
      {
        method: "GET",
        headers: {
          Accept: "text/calendar",
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Erreur serveur");
    }

    const icsString = await res.text();

    const data = parseAgenda(icsString);
    saveToCache(data);
    return data;
  } catch (error) {
    console.error("Erreur dans getAgendaIsen :", error);
    throw error;
  }
}
import ICAL from "ical.js";

// 1. On définit la structure de notre objet "Événement"
export interface AgendaEvent {
  id: string;
  title: string;
  professors: string;
  location: string;
  start: Date;
  end: Date;
  isExam?: boolean; // Optionnel : utile si on détecte "CONTROLE"
}

export const parseAgenda = (icsRawData: string): AgendaEvent[] => {
  if (!icsRawData) return [];

  try {
    // 2. Parsing initial via la librairie
    const jcalData = ICAL.parse(icsRawData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents("vevent");
    // 3. Transformation des données
    const formattedEvents: AgendaEvent[] = vevents.map((vevent: any) => {
      const event = new ICAL.Event(vevent);

      // --- NETTOYAGE ---
      const description = event.description || "";

      // On enlève les retours à la ligne (\n) qui traînent souvent dans les ICS de l'ISEN
      const cleanLocation = event.location
        ? event.location.replace(/\n/g, "").trim()
        : "Non défini";
      const cleanSummary = event.summary
        ? event.summary.replace(/\n/g, "").trim()
        : "Sans titre";

      // --- EXTRACTION INTELLIGENTE (REGEX) ---
      // On cherche le texte après "- Cours :"
      const coursMatch = description.match(/- Cours\s*:\s*(.*?)(?=\n|$)/);
      // On cherche le texte après "- Intervenant(s) :"
      const profMatch = description.match(
        /- Intervenant\(s\)\s*:\s*(.*?)(?=\n|$)/
      );

      // Si on trouve un nom de cours dans la description, on le prend. Sinon on garde le summary.
      const nomCours =
        coursMatch && coursMatch[1].trim() !== ""
          ? coursMatch[1].trim()
          : cleanSummary;

      const profs = profMatch ? profMatch[1].trim() : "";

      return {
        id: event.uid || Math.random().toString(), // Fallback si pas d'UID
        title: nomCours,
        professors: profs,
        location: cleanLocation,
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
        isExam:
          cleanSummary.toUpperCase().includes("CONTROLE") ||
          cleanSummary.toUpperCase().includes("EXAM"),
      };
    });

    // 4. Tri chronologique (TS préfère .getTime() pour les soustractions)
    formattedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    return formattedEvents;
  } catch (error) {
    console.error("Erreur critique lors du parsing ICS:", error);
    return [];
  }
};

export const saveToCache = (parsedEvents: AgendaEvent[]) => {
  try {
    localStorage.setItem("monAgendaCache", JSON.stringify(parsedEvents));
    localStorage.setItem("monAgendaDate", Date.now().toString()); // Optionnel : pour savoir quand on a mis en cache
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export const loadFromCache = (): AgendaEvent[] | null => {
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
