import { Platform } from 'react-native';
import localMapping from "@/structures_notes/localMapping";
import { 
    loadSemesterStructureFromCache, 
    loadStructureFromCache, 
    saveSemesterStructureToCache, 
    saveStructureToCache 
} from './storage';

const GITHUB_BASE_URL = "https://raw.githubusercontent.com/Tony83400/CalculNotesIsen/main/";
const GITHUB_MAIN_STRUCTURE_URL = `${GITHUB_BASE_URL}structures_notes/structure.json`;

const isWeb = Platform.OS === 'web';

/**
 * Met à jour la configuration globale (structure.json)
 */
export async function updateStructureConfig(forceRefresh = false) {
    // SUR WEB : On utilise TOUJOURS le local, pas de réseau pour les JSON
    if (isWeb) {
        return localMapping["structure.json"];
    }

    // SUR MOBILE : Cache-First
    if (!forceRefresh) {
        try {
            const cached = await loadStructureFromCache();
            if (cached) return cached;
        } catch (e) {}
    }

    // Tentative réseau (Mobile uniquement ou si cache vide)
    try {
        const response = await fetch(GITHUB_MAIN_STRUCTURE_URL);
        if (response.ok) {
            const json = await response.json();
            await saveStructureToCache(json);
            return json;
        }
    } catch (error) {
        console.warn("[Config] Réseau indisponible");
    }

    return localMapping["structure.json"];
}

/**
 * Récupère la structure d'un semestre spécifique
 */
export async function fetchSemesterStructure(semester: string, url: string, forceRefresh = false) {
    const pathParts = url.split('/structures_notes/');
    const relativePath = pathParts.length > 1 ? pathParts[1] : null;

    // SUR WEB : Strictement local
    if (isWeb) {
        if (relativePath && localMapping[relativePath]) {
            return localMapping[relativePath];
        }
    }

    // SUR MOBILE : Cache-First
    if (!forceRefresh) {
        try {
            const cached = await loadSemesterStructureFromCache(semester, url);
            if (cached) return cached;
        } catch (e) {}
    }

    // Tentative réseau
    try {
        const response = await fetch(url);
        if (response.ok) {
            const json = await response.json();
            await saveSemesterStructureToCache(semester, url, json);
            return json;
        }
    } catch (e) {
        console.warn(`[Config] Échec téléchargement pour ${semester}`);
    }

    if (relativePath && localMapping[relativePath]) {
        return localMapping[relativePath];
    }

    return null;
}
