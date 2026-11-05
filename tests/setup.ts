import { vi } from "vitest";
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  useWindowDimensions: () => ({ width: 1440, height: 900 }),
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => {}),
    removeItem: vi.fn(async () => {}),
    getAllKeys: vi.fn(async () => []),
  },
}));
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => {}),
  deleteItemAsync: vi.fn(async () => {}),
}));
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  cancelAllScheduledNotificationsAsync: vi.fn(async () => {}),
}));
// React's act() environment for hook-level race tests.
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const memory = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
    clear: () => memory.clear(),
    get length() {
      return memory.size;
    },
    key: (i: number) => [...memory.keys()][i] ?? null,
  },
  document: { cookie: "" },
});
