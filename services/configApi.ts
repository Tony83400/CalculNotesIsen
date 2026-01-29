import { saveStructureToCache } from "./storage";

// Remplace par TON URL RAW GitHub
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/Tony83400/CalculNotesIsen/refs/heads/main/structure_note.json"; 

export async function updateStructureConfig() {
    try {
        console.log("Mise à jour de la structure...");
        const response = await fetch(GITHUB_RAW_URL);
        
        if (!response.ok) {
            throw new Error("Impossible de récupérer la structure");
        }

        const json = await response.json();
        
        // Petite vérification de sécurité pour être sûr que c'est le bon format
        if (json.version && json.filieres) {
            await saveStructureToCache(json);
            return json;
        }
    } catch (error) {
        console.error("Erreur update structure:", error);
        // On ne bloque pas l'appli, on garde l'ancienne version
        return null; 
    }
}