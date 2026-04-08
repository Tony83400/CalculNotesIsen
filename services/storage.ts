import { AgendaEvent } from "@/types/agenda";
import { Note } from "@/types/note";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";
const isWeb = Platform.OS === 'web';

const structureName = "StructureConfig";
const selectedYearName = "SelectedYear";
const selectedSemesterName = "SelectedSemester";
const selectedFiliereName = "SelectedFiliere";
const selectedMajorsName = "SelectedMajors";
const selectedMajorsUrlsName = "SelectedMajorsUrls";
const tokenName = "Token";
const userName = "User";
const passwordName = "Password";
const agendaName = "Agenda";
const notesName = "Notes";

const secureKeys = [tokenName, userName, passwordName];

const getStorageItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    if (secureKeys.includes(key)) {
      const name = key + "=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
      }
      return null; 
    }
    return localStorage.getItem(key);
  } else {
    if (secureKeys.includes(key)) {
      return await SecureStore.getItemAsync(key);
    }
    return await AsyncStorage.getItem(key);
  }
};

const setStorageItem = async (key: string, value: string) => {
  if (isWeb) {
    if (secureKeys.includes(key)) {
      const expires = new Date();
      expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
      document.cookie = `${key}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
    } else {
      localStorage.setItem(key, value);
    }
  } else {
    if (secureKeys.includes(key)) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }
};

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

export async function getSelectedFiliere(): Promise<string | null> {
  return await getStorageItem(selectedFiliereName);
}

export async function setSelectedFiliere(value: string) {
  await setStorageItem(selectedFiliereName, value);
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
export async function getToken(): Promise<string | null> {
  return await getStorageItem(tokenName);
}
export async function setToken(value: string) {
  await setStorageItem(tokenName, value);
}

export async function getId(): Promise<string | null> {
  return await getStorageItem(userName);
}
export async function setId(value: string) {
  await setStorageItem(userName, value);
}

export async function getPasswordStorage(): Promise<string | null> {
  return await getStorageItem(passwordName);
}
export async function setPasswordStorage(value: string) {
  await setStorageItem(passwordName, value);
}

export async function saveAgendaToCache(parsedEvents: AgendaEvent[]) {
  try {
    await setStorageItem(agendaName, JSON.stringify(parsedEvents));
  } catch (e) {
    console.error("Quota storage dépassé", e);
  }
};

export async function loadAgendaFromCache(): Promise<AgendaEvent[] | null> {
  const cachedString = await getStorageItem(agendaName);
  if (!cachedString) return null;
  const rawEvents = JSON.parse(cachedString);
  const fixedEvents = rawEvents.map((event: any) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  }));
  return fixedEvents;
};

export async function saveNotesToCache(notes: Note[]) {
  try {
    await setStorageItem(notesName, JSON.stringify(notes));
  } catch (e) {
    console.error("Quota storage dépassé", e);
  }
};

export async function loadNotesFromCache(): Promise<Note[] | null> {
  const cachedString = await getStorageItem(notesName);
  if (!cachedString) return null;
  return JSON.parse(cachedString);
};

async function removeStorageItem(key: string) {
  if (isWeb) {
    if (secureKeys.includes(key)) {
      document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
    }
    localStorage.removeItem(key);
  } else {
    if (secureKeys.includes(key)) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
}

export async function clearAgendaFromStorage() {
  await removeStorageItem(agendaName);
}

export async function clearNotesFromStorage() {
  await removeStorageItem(notesName);
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

export async function clearAppCache() {
  await Promise.all([
    clearAgendaFromStorage(),
    clearNotesFromStorage(),
    clearStructureCache()
  ]);
}

export async function clearAllStorage() {
  if (isWeb) {
    localStorage.clear();
    secureKeys.forEach(key => {
      document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;Secure`;
    });
    return;
  }
  await AsyncStorage.clear();
  await Promise.all(secureKeys.map(key => SecureStore.deleteItemAsync(key)));
}

// Réactivation des fonctions de cache JSON pour Mobile
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