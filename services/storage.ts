import { AgendaEvent } from "@/types/agenda";
import { Note } from "@/types/note";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";
const isWeb = Platform.OS === 'web';

const tokenName = "Token";
const userName = "User";
const passwordName = "Password";
const agendaName = "Agenda";
const notesName = "Notes";

const getStorageItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return await AsyncStorage.getItem(key);
};

const setStorageItem = async (key: string, value: string) => {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
};
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
    setStorageItem(agendaName, JSON.stringify(parsedEvents));
    setStorageItem(agendaName + "Date", Date.now().toString());
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export async function loadAgendaFromCache(): Promise<AgendaEvent[] | null> {
  const cachedString = await getStorageItem(agendaName);

  if (!cachedString) return null;

  // On transforme le texte en objet JSON
  const rawEvents = JSON.parse(cachedString);

  // ⚠️ CRUCIAL : On réhydrate les dates (car JSON les a transformées en string)
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
    await setStorageItem(notesName + "Date", Date.now().toString());
  } catch (e) {
    console.error("Quota localStorage dépassé", e);
  }
};

export async function loadNotesFromCache(): Promise<Note[] | null> {
  const cachedString = await getStorageItem(notesName);

  if (!cachedString) return null;

  // On transforme le texte en objet JSON
  const rawNotes = JSON.parse(cachedString);
  return rawNotes;
};
export async function loadLastUpdateNotes() : Promise<Date>{
  const date = await getStorageItem(notesName + "Date");
  if (!date) return new Date(0);
  return new Date(parseInt(date));
}
export async function loadLastUpdateAgenda() : Promise<Date>{
  const date = await getStorageItem(agendaName + "Date");
  if (!date) return new Date(0);
  return new Date(parseInt(date));
}

// Remove
async function removeStorageItem(key: string) {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export async function clearAgendaFromStorage() {
  await Promise.all([
    removeStorageItem(agendaName),
    removeStorageItem(agendaName + "Date")
  ]);
}

export async function clearNotesFromStorage() {
  await Promise.all([
    removeStorageItem(notesName),
    removeStorageItem(notesName + "Date")
  ]);
}

export async function clearAppCache() {
  await Promise.all([
    clearAgendaFromStorage(),
    clearNotesFromStorage()
  ]);
}

export async function clearAllStorage() {
  if (isWeb) {
    localStorage.clear();
    return;
  }

  await AsyncStorage.clear();
  await Promise.all([
    SecureStore.deleteItemAsync(tokenName),
    SecureStore.deleteItemAsync(userName)
  ]);
}