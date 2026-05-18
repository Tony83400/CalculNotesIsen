import { getStorageItem, setStorageItem, tokenName, tokenExpirationName, userName, passwordName } from "./base";

export async function getToken(): Promise<string | null> {
  return await getStorageItem(tokenName);
}

export async function setToken(value: string) {
  await setStorageItem(tokenName, value);
  // Définir l'expiration à 1 heure (3600000 ms)
  const expirationTime = Date.now() + 3600000;
  await setStorageItem(tokenExpirationName, expirationTime.toString());
}

export async function isTokenExpired(): Promise<boolean> {
  const expiration = await getStorageItem(tokenExpirationName);
  if (!expiration) return true;
  return Date.now() > parseInt(expiration);
}

export async function canSilentLogin(): Promise<boolean> {
  const user = await getStorageItem(userName);
  const pass = await getStorageItem(passwordName);
  return !!(user && pass);
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
