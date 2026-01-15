import { AgendaEvent } from "@/types/agenda";
import ICAL from "ical.js";

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