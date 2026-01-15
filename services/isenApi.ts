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
      let errorText;

      if (res.status == 500) {
        errorText = "Erreur serveur";
      } else if (res.status == 400) {
        errorText = "Erreur login";
      } else {
        errorText = "Erreur";
      }
      throw new Error(errorText);
    }

    const token = await res.text();

    return { token: token };
  } catch (error) {
    console.error("Erreur dans Login :", error);
    throw error;
  }
}

export async function getNotes() {
  console.log("Récupération des notes...");
  const cachedData = loadNotesFromCache();
  if (cachedData) {
    return cachedData;
  }

  try {
    const token = getToken();
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
      const errorText = await res.text();
      throw new Error(errorText || "Erreur serveur");
    }
    const rep = await res.json();
    const formattedNotes: Note[] = rep.map((elt: any) => ({
      code: elt.code,
      name: elt.name,
      note: Number(elt.note),
      date: elt.date,
    }));
    saveNotesToCache(formattedNotes);
    return formattedNotes;
  } catch (error) {
    console.error("Erreur dans getNotes :", error);
    throw error;
  }
}
