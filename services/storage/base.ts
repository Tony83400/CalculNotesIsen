import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { invalidateDataScope, assertCurrent } from "../dataScope";
export const isWeb = Platform.OS === "web";
export const tokenName = "Token",
  tokenExpirationName = "TokenExpiration",
  userName = "User",
  passwordName = "Password";
export const secureKeys = [
  tokenName,
  tokenExpirationName,
  userName,
  passwordName,
];
const volatile = new Map<string, string>();
const prefix = "cnisen:v3:";
let migrated = false;
let secureQueue: Promise<unknown> = Promise.resolve();
let ordinaryQueue: Promise<unknown> = Promise.resolve();
function ordinaryOperation<T>(task: () => Promise<T>): Promise<T> {
  const next = ordinaryQueue.then(task, task);
  ordinaryQueue = next.catch(() => {});
  return next;
}
function secureOperation<T>(task: () => Promise<T>): Promise<T> {
  const next = secureQueue.then(task, task);
  secureQueue = next.catch(() => {});
  return next;
}
let nativeMigration: Promise<unknown> | null = null;
function migrateNative() {
  return (
    nativeMigration ??
    (nativeMigration = AsyncStorage.multiRemove([
      "Notes",
      "Agenda",
      "LastUpdate",
      "@multi_agenda_users",
      "@recent_multi_users",
    ]))
  );
}

function migrateWeb() {
  if (migrated || typeof document === "undefined") return;
  migrated = true;
  // Remove the old one-year JavaScript-readable credentials and unscoped caches.
  for (const key of [
    ...secureKeys,
    "Notes",
    "Agenda",
    "LastUpdate",
    "@multi_agenda_users",
    "@recent_multi_users",
  ]) {
    for (const secure of ["", ";Secure"])
      document.cookie = `${key}=;Max-Age=0;path=/;SameSite=Strict${secure}`;
    try {
      localStorage.removeItem(key);
    } catch {
      /* Storage can be unavailable. */
    }
  }
}
export async function getStorageItem(key: string): Promise<string | null> {
  if (isWeb) {
    migrateWeb();
    if (secureKeys.includes(key)) return volatile.get(key) ?? null;
    try {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(prefix + key);
    } catch {
      return null;
    }
  }
  await migrateNative();
  return secureKeys.includes(key)
    ? secureOperation(() => SecureStore.getItemAsync(key))
    : ordinaryOperation(() => AsyncStorage.getItem(prefix + key));
}
export async function setStorageItem(
  key: string,
  value: string,
  generation?: number,
) {
  if (generation !== undefined) assertCurrent(generation);
  if (isWeb) {
    migrateWeb();
    if (secureKeys.includes(key)) {
      volatile.set(key, value);
      return;
    }
    localStorage.setItem(prefix + key, value);
    return;
  }
  if (secureKeys.includes(key))
    await secureOperation(() => {
      if (generation !== undefined) assertCurrent(generation);
      return SecureStore.setItemAsync(key, value);
    });
  else
    await ordinaryOperation(() => {
      if (generation !== undefined) assertCurrent(generation);
      return AsyncStorage.setItem(prefix + key, value);
    });
}
export async function removeStorageItem(key: string) {
  if (isWeb) {
    migrateWeb();
    volatile.delete(key);
    try {
      localStorage.removeItem(prefix + key);
    } catch {}
    return;
  }
  if (secureKeys.includes(key))
    await secureOperation(() => SecureStore.deleteItemAsync(key));
  else await ordinaryOperation(() => AsyncStorage.removeItem(prefix + key));
}
export async function storageKeys() {
  if (!isWeb) await ordinaryQueue;
  const keys = isWeb
    ? typeof localStorage === "undefined"
      ? []
      : Array.from({ length: localStorage.length }, (_, i) =>
          localStorage.key(i),
        ).filter((k): k is string => k !== null)
    : await AsyncStorage.getAllKeys();
  return keys
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.slice(prefix.length));
}
export async function clearAllStorage() {
  invalidateDataScope();
  volatile.clear();
  const keys = await storageKeys().catch(() => []);
  await Promise.all([...keys, ...secureKeys].map(removeStorageItem));
}
