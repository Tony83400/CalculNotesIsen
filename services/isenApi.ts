import { API_URL } from "@/constants/Config";
import { getToken, loadNotesFromCache, saveNotesToCache, isTokenExpired, getId, getPasswordStorage, setToken } from "./storage";
import { Note } from "@/types/note";

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
    return formattedNotes;
  } catch (error: any) {
    console.error("Erreur dans getNotes :", error);
    if (cachedData && error.message !== "Session expirée") {
        return cachedData;
    }
    throw error;
  }
}
