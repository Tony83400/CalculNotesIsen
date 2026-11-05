import {
  setPasswordStorage,
  getPasswordStorage,
  setToken,
  getToken,
  clearAllStorage,
  setStorageItem,
  getSelectedYear,
  setSelectedYear,
} from "../services/storage";
import { getDataGeneration } from "../services/dataScope";
import { it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  secure: new Map<string, string>(),
  ordinary: new Map<string, string>(),
}));
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("expo-secure-store", () => ({
  getItemAsync: async (k: string) => state.secure.get(k) || null,
  setItemAsync: async (k: string, v: string) => {
    state.secure.set(k, v);
  },
  deleteItemAsync: async (k: string) => {
    state.secure.delete(k);
  },
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: async (k: string) => state.ordinary.get(k) || null,
    setItem: async (k: string, v: string) => {
      state.ordinary.set(k, v);
    },
    removeItem: async (k: string) => {
      state.ordinary.delete(k);
    },
    multiRemove: async (keys: string[]) =>
      keys.forEach((k) => state.ordinary.delete(k)),
    getAllKeys: async () => [...state.ordinary.keys()],
  },
}));
it("keeps remembered native credentials in SecureStore and removes them on logout", async () => {
  await setPasswordStorage("fiction-secret");
  await setToken("fiction-token");
  expect(await getPasswordStorage()).toBe("fiction-secret");
  expect(state.secure.get("Password")).toBe("fiction-secret");
  expect(state.ordinary.size).toBe(0);
  await clearAllStorage();
  expect(await getPasswordStorage()).toBeNull();
  expect(await getToken()).toBeNull();
});
it("rejects a delayed renewal captured before logout", async () => {
  const g = getDataGeneration();
  await clearAllStorage();
  await expect(setToken("old-token", g)).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(await getToken()).toBeNull();
});
it("reads the native legacy M1 choice as ISEN4 and keeps ISENA4 as a distinct year", async () => {
  await setStorageItem("SelectedYear", "M1");
  expect(await getSelectedYear()).toBe("ISEN4");
  await setSelectedYear("ISENA4");
  expect(await getSelectedYear()).toBe("ISENA4");
  expect(state.ordinary.get("cnisen:v3:SelectedYear")).toBe("ISENA4");
});
