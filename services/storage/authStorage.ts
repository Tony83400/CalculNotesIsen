import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  tokenName,
  tokenExpirationName,
  userName,
  passwordName,
  isWeb,
} from "./base";
import {
  invalidateDataScope,
  assertCurrent,
  getDataGeneration,
} from "../dataScope";
export const getToken = () => getStorageItem(tokenName);
export async function setToken(
  value: string,
  generation = getDataGeneration(),
) {
  assertCurrent(generation);
  await setStorageItem(tokenName, value, generation);
  assertCurrent(generation);
  await setStorageItem(
    tokenExpirationName,
    String(Date.now() + 3600000),
    generation,
  );
}
export async function isTokenExpired() {
  const t = Number(await getStorageItem(tokenExpirationName));
  return !Number.isFinite(t) || t <= Date.now();
}
export async function canSilentLogin() {
  return !!((await getId()) && (await getPasswordStorage()));
}
export const getId = () => getStorageItem(userName);
export async function setId(value: string) {
  if (value !== (await getId())) invalidateDataScope();
  await setStorageItem(userName, value);
}
export const getPasswordStorage = () => getStorageItem(passwordName);
export async function setPasswordStorage(value: string) {
  if (isWeb || !value) await removeStorageItem(passwordName);
  else await setStorageItem(passwordName, value);
}
export async function clearAuth() {
  invalidateDataScope();
  await Promise.all(
    [tokenName, tokenExpirationName, userName, passwordName].map(
      removeStorageItem,
    ),
  );
}
