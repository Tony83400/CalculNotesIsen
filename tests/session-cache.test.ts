import { beforeEach, it, expect, vi } from "vitest";
import {
  getStorageItem,
  setStorageItem,
  clearAllStorage,
  setId,
  setToken,
  setPasswordStorage,
  getPasswordStorage,
  getToken,
} from "../services/storage";
import { getDataGeneration, invalidateDataScope } from "../services/dataScope";
import { readCache, writeCache } from "../services/storage/cacheStorage";
beforeEach(async () => {
  await clearAllStorage();
});
it("does not persist web credentials and removes legacy cookies", async () => {
  await setId("fiction.alice");
  await setToken("fiction-token");
  await setPasswordStorage("fiction-password");
  expect(await getPasswordStorage()).toBeNull();
  expect(await getToken()).toBe("fiction-token");
  expect(localStorage.getItem("Token")).toBeNull();
  expect(localStorage.getItem("Password")).toBeNull();
  expect(await getStorageItem("Password")).toBeNull();
});
it("isolates cache envelopes by exact account identity", async () => {
  await writeCache("notes", "fiction.alice", [
    { code: "a", name: "Test", note: 15, date: "" },
  ]);
  expect(await readCache("notes", "fiction.bob")).toBeNull();
  expect(
    (await readCache<unknown[]>("notes", "fiction.alice"))?.data,
  ).toHaveLength(1);
});
it("handles corrupt JSON and refuses stale writes", async () => {
  await setStorageItem("notes:fiction.alice", "{bad");
  expect(await readCache("notes", "fiction.alice")).toBeNull();
  const g = getDataGeneration();
  invalidateDataScope();
  await expect(
    writeCache("notes", "fiction.alice", [], g),
  ).rejects.toMatchObject({ name: "AbortError" });
});
it("clears credentials and app-owned data without clearing unrelated browser data", async () => {
  await setToken("fiction");
  await writeCache("notes", "fiction.alice", []);
  localStorage.setItem("other-app", "untouched");
  await clearAllStorage();
  expect(await getToken()).toBeNull();
  expect(await readCache("notes", "fiction.alice")).toBeNull();
  expect(localStorage.getItem("other-app")).toBe("untouched");
  localStorage.removeItem("other-app");
});
it("keeps network results usable if cache storage fails", async () => {
  const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
    throw new Error("Quota");
  });
  await expect(writeCache("notes", "fiction.alice", [])).resolves.toMatch(/T/);
  spy.mockRestore();
});
