import { Platform } from 'react-native';
import { saveStructureToCache, saveSemesterStructureToCache, loadSemesterStructureFromCache, loadStructureFromCache } from "./storage";
import localMapping from "@/structures_notes/localMapping";

const GITHUB_BASE_URL = "https://raw.githubusercontent.com/Tony83400/CalculNotesIsen/main/";
const GITHUB_MAIN_STRUCTURE_URL = `${GITHUB_BASE_URL}structures_notes/structure.json`;

/**
 * Met à jour la configuration globale (structure.json)
 * Strategie: 
 * - Web: Local Mapping (Bundled)
 * - Native: Cache -> GitHub -> Local (fallback)
 * - Force Refresh: GitHub -> Cache -> Local
 */
export async function updateStructureConfig(forceRefresh = false) {
    // --- STRATEGIE WEB ---
    if (Platform.OS === 'web' && !forceRefresh) {
        return localMapping["structure.json"];
    }

    // --- STRATEGIE NATIVE / FORCE REFRESH ---

    // 1. Si pas de forceRefresh, priorité au Cache (Vitesse)
    if (!forceRefresh) {
        try {
            const cached = await loadStructureFromCache();
            // On vérifie que c'est bien un objet et pas juste le défaut si possible 
            // loadStructureFromCache renvoie configDefault si vide, ce qui est correct
            if (cached) return cached;
        } catch (e) {}
    }

    // 2. Tentative réseau pour la fraîcheur (si forceRefresh ou cache absent)
    try {
        const response = await fetch(GITHUB_MAIN_STRUCTURE_URL);
        if (response.ok) {
            const json = await response.json();
            console.log(`[Config] Catalogue global mis à jour depuis GitHub`);
            await saveStructureToCache(json);
            return json;
        }
    } catch (error) {
        console.warn("[Config] Réseau indisponible pour le catalogue");
    }

    // 3. Mapping local (Bundled) en dernier recours
    return localMapping["structure.json"];
}

/**
 * Récupère la structure d'un semestre spécifique
 * Strategie: 
 * - Web: Local Mapping (Bundled)
 * - Native: Cache -> GitHub -> Local Mapping (Fallback)
 */
export async function fetchSemesterStructure(semester: string, url: string) {
    // Extraction du chemin relatif pour le mapping local
    const pathParts = url.split('/structures_notes/');
    const relativePath = pathParts.length > 1 ? pathParts[1] : null;

    // --- STRATEGIE WEB ---
    if (Platform.OS === 'web') {
        if (relativePath && localMapping[relativePath]) {
            console.log(`[Config][Web] Utilisation du fichier local: ${relativePath}`);
            return localMapping[relativePath];
        }
        // Fallback réseau si absent du mapping local
    }

    // --- STRATEGIE NATIVE ---
    
    // 1. Priorité au Cache (Vitesse)
    try {
        const cached = await loadSemesterStructureFromCache(semester);
        if (cached) return cached;
    } catch (e) {}

    // 2. Tentative réseau (Fraîcheur)
    try {
        console.log(`[Config][Native] Téléchargement: ${url}`);
        const response = await fetch(url);
        if (response.ok) {
            const json = await response.json();
            await saveSemesterStructureToCache(semester, json);
            return json;
        }
    } catch (e) {
        console.warn(`[Config][Native] Échec téléchargement pour ${semester}`);
    }

    // 3. Fallback Local (Bundled)
    if (relativePath && localMapping[relativePath]) {
        console.log(`[Config][Native] Fallback local pour: ${relativePath}`);
        await saveSemesterStructureToCache(semester, localMapping[relativePath]);
        return localMapping[relativePath];
    }

    return null;
}
