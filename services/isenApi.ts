import { API_URL } from "@/constants/Config";
import { getToken, loadNotesFromCache, saveNotesToCache } from "./storage";
import { Note } from "@/types/note";

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
        throw new Error("Identifiants incorrects ou session expirée");
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
  if (cachedData) {
    return cachedData;
  }

  try {
    const token = await getToken();
    if (!token) {
      throw new Error("Utilisateur non connecté (Token manquant)");
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
    throw error;
  }
}
