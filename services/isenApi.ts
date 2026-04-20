import { API_URL } from "@/constants/Config";
import { getToken, loadNotesFromCache, saveNotesToCache, isTokenExpired, getId, getPasswordStorage, setToken, setLastUpdate } from "./storage";
import { Note } from "@/types/note";
import { EventDetails } from "@/types/agenda";

/**
 * Tente une reconnexion silencieuse avec les identifiants en cache
 */
async function silentLogin() {
    const username = await getId();
    const password = await getPasswordStorage();
    if (username && password) {
        try {
            const res = await fetch(`${API_URL}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (res.ok) {
                const newToken = await res.text();
                await setToken(newToken);
                return newToken;
            }
        } catch (e) {
            console.error("Échec silent login", e);
        }
    }
    return null;
}

export async function login(loginData: { username: string; password: string }) {
  try {
    const res = await fetch(`${API_URL}/token`, {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 400) {
        throw new Error("Identifiants incorrects");
      }
      const errorText = await res.text();
      throw new Error(errorText || `Erreur de connexion (${res.status})`);
    }

    const token = await res.text();
    return { token: token };
  } catch (error: any) {
    console.error("Erreur dans Login :", error);
    throw error;
  }
}

export async function getNotes() {
  const cachedData = await loadNotesFromCache();
  
  try {
    let token = await getToken();
    const expired = await isTokenExpired();
    
    // Tentative de reconnexion automatique si expiré
    if (!token || expired) {
      token = await silentLogin();
    }

    if (!token) {
      throw new Error("Session expirée");
    }

    const res = await fetch(`${API_URL}/notations`, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Token: token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Si 401 après fetch, on tente une dernière fois le silent login
        const freshToken = await silentLogin();
        if (freshToken) {
            // On retente l'appel avec le nouveau token
            return await getNotes(); 
        }
        throw new Error("Session expirée");
      }
      const errorText = await res.text();
      throw new Error(errorText || `Erreur serveur (${res.status})`);
    }
    const rep = await res.json();
    const formattedNotes: Note[] = rep.map((elt: any) => ({
      code: elt.code,
      name: elt.name,
      note: Number(elt.note),
      date: elt.date,
    }));
    await saveNotesToCache(formattedNotes);
    
    // Sauvegarde de l'heure de mise à jour
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    await setLastUpdate(`${dateStr} à ${timeStr}`);
    
    return formattedNotes;
  } catch (error: any) {
    console.error("Erreur dans getNotes :", error);
    if (cachedData && error.message !== "Session expirée") {
        return cachedData;
    }
    throw error;
  }
}

/**
 * Récupère l'ID d'un événement à partir de son timestamp de début et fin
 */
export async function getEventIdByTime(startTs: number, endTs: number): Promise<string | null> {
    try {
        let token = await getToken();
        if (await isTokenExpired()) token = await silentLogin();
        if (!token) return null;

        // On élargit légèrement la recherche (+/- 5 min) pour être robuste aux arrondis
        const searchStart = startTs - (5 * 60 * 1000);
        const searchEnd = endTs + (5 * 60 * 1000);

        const res = await fetch(`${API_URL}/agenda?start=${searchStart}&end=${searchEnd}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Token: token,
            },
        });

        if (!res.ok) return null;
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0) {
            // Filtrage des événements avec des dates valides uniquement
            const validEvents = data.filter(e => e.id && e.start && !isNaN(new Date(e.start).getTime()));
            
            if (validEvents.length === 0) return null;

            // On cherche celui dont le début est le plus proche du startTs demandé
            const bestMatch = validEvents.reduce((prev, curr) => {
                const prevDiff = Math.abs(new Date(prev.start).getTime() - startTs);
                const currDiff = Math.abs(new Date(curr.start).getTime() - startTs);
                return currDiff < prevDiff ? curr : prev;
            });

            // Si le décalage est trop grand (> 15 min), c'est probablement un autre cours
            const finalDiff = Math.abs(new Date(bestMatch.start).getTime() - startTs);
            if (finalDiff > 15 * 60 * 1000) return null;

            return bestMatch.id;
        }
        return null;
    } catch (e) {
        console.error("Erreur getEventIdByTime", e);
        return null;
    }
}

/**
 * Récupère les détails avancés d'un événement par son ID
 */
export async function getEventDetails(eventId: string): Promise<EventDetails | null> {
    try {
        let token = await getToken();
        if (await isTokenExpired()) token = await silentLogin();
        if (!token) return null;

        const res = await fetch(`${API_URL}/agenda/event/${eventId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Token: token,
            },
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Erreur getEventDetails", e);
        return null;
    }
}
