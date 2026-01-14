import { API_URL } from "@/constants/Config";
import { getToken } from "./storage";

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
    return await res.json();
  } catch (error) {
    console.error("Erreur dans getNotes :", error);
    throw error;
  }
}
