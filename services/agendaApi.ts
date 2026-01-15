import { getId, loadAgendaFromCache, saveAgendaToCache } from "./storage";
import { parseAgenda } from "@/utils/agenda";

export async function getAgendaIsen() {
  const cachedData = loadAgendaFromCache();
  if (cachedData) {
    return cachedData;
  }

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
    saveAgendaToCache(data);
    return data;
  } catch (error) {
    console.error("Erreur dans getAgendaIsen :", error);
    throw error;
  }
}