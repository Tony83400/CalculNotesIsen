import { Platform } from 'react-native';
import { saveStructureToCache, saveSemesterStructureToCache } from "./storage";
import localMapping from "@/structures_notes/localMapping";

const GITHUB_BASE_URL = "https://raw.githubusercontent.com/Tony83400/CalculNotesIsen/main/";
const GITHUB_MAIN_STRUCTURE_URL = `${GITHUB_BASE_URL}structures_notes/structure.json`;

export async function updateStructureConfig() {
    try {
        const response = await fetch(GITHUB_MAIN_STRUCTURE_URL);
        if (!response.ok) throw new Error("Impossible de récupérer la structure");
        const json = await response.json();
        await saveStructureToCache(json);
        return json;
    } catch (error) {
        console.error("Erreur update structure:", error);
        return null; 
    }
}

export async function fetchSemesterStructure(semester: string, url: string) {
    // 1. On tente d'abord le mapping local (très rapide et fiable en dev)
    try {
        const pathParts = url.split('/structures_notes/');
        if (pathParts.length > 1) {
            const relativePath = pathParts[1];
            const localData = localMapping[relativePath];
            if (localData) {
                console.log(`[Config] Utilisation du mapping local pour: ${relativePath}`);
                // On le cache quand même pour que le reste de l'app fonctionne hors-ligne
                await saveSemesterStructureToCache(semester, localData);
                return localData;
            }
        }
    } catch (e) {
        console.warn("[Config] Erreur lors de la tentative de lecture locale:", e);
    }

    // 2. Si pas de mapping local, on tente le réseau
    try {
        console.log(`[Config] Tentative réseau pour ${semester}: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
            const json = await response.json();
            await saveSemesterStructureToCache(semester, json);
            return json;
        }
    } catch (e) {
        console.log(`[Config] Réseau indisponible pour ${semester}`);
    }

    return null;
}

export async function fetchStructureFromUrl(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur reseau");
        return await response.json();
    } catch (e) {
        console.error("Fetch structure error:", e);
        return null;
    }
}
