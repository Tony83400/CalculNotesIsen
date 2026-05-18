import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorageItem, setStorageItem, isWeb } from "./base";

const structureName = "StructureConfig";
const selectedYearName = "SelectedYear";
const selectedSemesterName = "SelectedSemester";
const selectedFiliereName = "SelectedFiliere";
const selectedMajorsName = "SelectedMajors";
const selectedMajorsUrlsName = "SelectedMajorsUrls";

export async function getSelectedYear(): Promise<string | null> {
  return await getStorageItem(selectedYearName);
}

export async function setSelectedYear(value: string) {
  await setStorageItem(selectedYearName, value);
}

export async function getSelectedSemester(): Promise<string | null> {
  return await getStorageItem(selectedSemesterName);
}

export async function setSelectedSemester(value: string) {
  await setStorageItem(selectedSemesterName, value);
}

export async function getSelectedMajors(): Promise<Record<string, string> | null> {
  const data = await getStorageItem(selectedMajorsName);
  if (!data || data === "undefined") return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export async function setSelectedMajors(value: Record<string, string>) {
  await setStorageItem(selectedMajorsName, JSON.stringify(value));
}

export async function getSelectedMajorsUrls(): Promise<Record<string, string> | null> {
  const data = await getStorageItem(selectedMajorsUrlsName);
  if (!data || data === "undefined") return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export async function setSelectedMajorsUrls(value: Record<string, string>) {
  await setStorageItem(selectedMajorsUrlsName, JSON.stringify(value));
}

export async function clearStructureCache() {
  if (isWeb) {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(structureName)) {
        localStorage.removeItem(key);
      }
    });
    return;
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const structureKeys = keys.filter(key => key.startsWith(structureName));
    if (structureKeys.length > 0) {
      await AsyncStorage.multiRemove(structureKeys);
    }
  } catch (e) {
    console.error("Erreur clearStructureCache", e);
  }
}

export async function saveStructureToCache(structure: any) {
  try {
    await setStorageItem(structureName, JSON.stringify(structure));
  } catch (e) {
    console.error("Erreur sauvegarde structure", e);
  }
}

export async function loadStructureFromCache(): Promise<any | null> {
  const cachedString = await getStorageItem(structureName);
  if (cachedString) {
    try {
      return JSON.parse(cachedString);
    } catch (e) {
      console.error("Erreur parsing structure", e);
    }
  }
  return null; 
}

export async function saveSemesterStructureToCache(semester: string, url: string, structure: any) {
  try {
    const urlId = url.split('/').pop()?.replace('.json', '') || 'unknown';
    await setStorageItem(`${structureName}_${semester}_${urlId}`, JSON.stringify(structure));
  } catch (e) {
    console.error(`Erreur sauvegarde structure ${semester}`, e);
  }
}

export async function loadSemesterStructureFromCache(semester: string, url: string): Promise<any | null> {
  try {
    const urlId = url.split('/').pop()?.replace('.json', '') || 'unknown';
    const cachedString = await getStorageItem(`${structureName}_${semester}_${urlId}`);
    if (cachedString) {
      return JSON.parse(cachedString);
    }
  } catch (e) {
    console.error(`Erreur parsing structure ${semester}`, e);
  }
  return null;
}
