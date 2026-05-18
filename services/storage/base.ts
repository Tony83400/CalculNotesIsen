import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from "react-native";

export const isWeb = Platform.OS === 'web';

export const tokenName = "Token";
export const tokenExpirationName = "TokenExpiration";
export const userName = "User";
export const passwordName = "Password";

export const secureKeys = [tokenName, tokenExpirationName, userName, passwordName];

export const getStorageItem = async (key: string): Promise<string | null> => {
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

export const setStorageItem = async (key: string, value: string) => {
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

export const removeStorageItem = async (key: string) => {
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
};

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
