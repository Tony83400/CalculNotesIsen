import { beforeEach, afterEach, expect, it, vi } from "vitest";
import {
  updateStructureConfig,
  fetchSemesterStructure,
} from "../services/configApi";
import {
  loadStructureFromCache,
  saveStructureToCache,
} from "../services/storage";
import { mergeCatalog } from "../types/config";
import catalog from "../structures_notes/structure.json";
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }));
vi.mock("../services/storage", () => ({
  loadStructureFromCache: vi.fn(async () => null),
  saveStructureToCache: vi.fn(async () => {}),
  loadSemesterStructureFromCache: vi.fn(async () => null),
  saveSemesterStructureToCache: vi.fn(async () => {}),
}));
const legacy = { annee: { M1: catalog.annee.ISEN4 } };
beforeEach(() => {
  vi.mocked(loadStructureFromCache).mockReset().mockResolvedValue(null);
  vi.mocked(saveStructureToCache).mockClear();
});
afterEach(() => vi.restoreAllMocks());
it("upgrades an old native catalog cache without hiding the newly bundled ISENA4", async () => {
  vi.mocked(loadStructureFromCache).mockResolvedValueOnce(legacy);
  const fetch = vi.spyOn(globalThis, "fetch");
  const result = await updateStructureConfig();
  expect(result.annee.ISEN4).toEqual(catalog.annee.ISEN4);
  expect(result.annee.ISENA4).toEqual(catalog.annee.ISENA4);
  expect(result.annee).not.toHaveProperty("M1");
  expect(fetch).not.toHaveBeenCalled();
});
it("keeps ISENA4 available when GitHub still serves the old M1 catalog and caches the normalized result", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(legacy)),
  );
  const result = await updateStructureConfig(true);
  expect(result.annee.ISENA4).toEqual(catalog.annee.ISENA4);
  expect(result.annee).not.toHaveProperty("M1");
  expect(saveStructureToCache).toHaveBeenCalledWith(result);
  const explicit = {
    ...legacy,
    annee: { ...legacy.annee, ISEN4: { S7: catalog.annee.ISEN4.S7 } },
  };
  expect(mergeCatalog(explicit, catalog).annee.ISEN4).toEqual(
    explicit.annee.ISEN4,
  );
});
it("loads both new semesters from the bundle when their GitHub files have not yet been published", async () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () => new Response("", { status: 404 }),
  );
  for (const [sem, tracks] of Object.entries(catalog.annee.ISENA4)) {
    const result = await fetchSemesterStructure(
      sem,
      Object.values(tracks)[0],
      true,
    );
    expect(result.reduce((total, u) => total + u.ects, 0)).toBe(30);
  }
});
