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
      const cleanLocation = event.location
        ? event.location.replace(/\\n/g, "").replace(/\n/g, "").trim()
        : "Non défini";
      const cleanSummary = event.summary
        ? event.summary.replace(/\\n/g, "").replace(/\n/g, "").trim()
        : "Sans titre";

      return {
        id: event.uid || Math.random().toString(),
        title: cleanSummary,
        professors: "", // On ne s'en sert plus selon la demande
        location: cleanLocation,
        start: event.startDate.toJSDate(),
        end: event.endDate.toJSDate(),
        isExam: cleanSummary.toUpperCase().includes("EXAM"),
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