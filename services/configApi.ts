import { Platform } from "react-native";
import localMapping from "../structures_notes/localMapping";
import {
  loadSemesterStructureFromCache,
  loadStructureFromCache,
  saveSemesterStructureToCache,
  saveStructureToCache,
} from "./storage";
import { validateStructure } from "../utils/notes";
import { validCatalog, type CurriculumCatalog } from "../types/config";
import { timedFetch } from "./http";
const ROOT = "https://raw.githubusercontent.com/Tony83400/CalculNotesIsen/";
export async function updateStructureConfig(
  forceRefresh = false,
): Promise<CurriculumCatalog> {
  const local = localMapping["structure.json"];
  if (Platform.OS === "web") return local;
  if (!forceRefresh) {
    try {
      const cached = await loadStructureFromCache();
      if (validCatalog(cached)) return cached;
    } catch {}
  }
  try {
    const response = await timedFetch(
      `${ROOT}main/structures_notes/structure.json`,
    );
    if (response.ok) {
      const data: unknown = await response.json();
      if (validCatalog(data)) {
        await saveStructureToCache(data);
        return data;
      }
    }
  } catch {}
  return local;
}
export async function fetchSemesterStructure(
  semester: string,
  url: string,
  forceRefresh = false,
) {
  if (!url.startsWith(ROOT)) throw new Error("Source de cursus non reconnue.");
  const relative = url.split("/structures_notes/")[1];
  const local = relative ? localMapping[relative] : undefined;
  if (Platform.OS === "web") return validateStructure(local);
  if (!forceRefresh) {
    try {
      const cached = await loadSemesterStructureFromCache(semester, url);
      if (cached) return validateStructure(cached);
    } catch {}
  }
  try {
    const response = await timedFetch(url);
    if (response.ok) {
      const data = validateStructure(await response.json());
      await saveSemesterStructureToCache(semester, url, data);
      return data;
    }
  } catch {}
  // An invalid downloaded structure must never poison the bundled reference.
  return validateStructure(local);
}
