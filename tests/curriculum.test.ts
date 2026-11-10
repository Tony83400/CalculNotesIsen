import { beforeEach, expect, it } from "vitest";
import catalog from "../structures_notes/structure.json";
import s7 from "../structures_notes/annee_4_isena4/S7_ISENA4.json";
import s8 from "../structures_notes/annee_4_isena4/S8_ISENA4.json";
import calc, { validateStructure } from "../utils/notes";
import {
  fetchSemesterStructure,
  updateStructureConfig,
} from "../services/configApi";
import * as storage from "../services/storage";
beforeEach(async () => {
  await storage.clearAllStorage();
});
it("exposes ISEN4 and ISENA4 and resolves every new bundled semester without changing the existing ISEN4 paths", async () => {
  const config = await updateStructureConfig();
  expect(config.annee).not.toHaveProperty("M1");
  expect(Object.keys(config.annee.ISEN4.S7)).toHaveLength(7);
  expect(config.annee.ISEN4.S7.DEV_LOGICIEL).toMatch(
    /annee_4\/S7_DEV_LOGICIEL\.json$/,
  );
  expect(Object.keys(config.annee.ISENA4)).toEqual(["S7", "S8"]);
  for (const [sem, tracks] of Object.entries(config.annee.ISENA4)) {
    expect(
      await fetchSemesterStructure(sem, Object.values(tracks)[0]),
    ).toHaveLength(5);
  }
});
it("transcribes the five modules and 30 ECTS of each supplied ISENA4 semester", () => {
  expect(s7.map((u) => [u.ue, u.ects])).toEqual([
    ["Sciences de l’ingénieur", 5],
    ["Informatique", 5],
    ["Sciences humaines", 5],
    ["Anglais", 5],
    ["Entreprise", 10],
  ]);
  expect(s8.map((u) => [u.ue, u.ects])).toEqual([
    ["Sciences de l’ingénieur", 5],
    ["IoT", 5],
    ["CYBER/IA", 6],
    ["Sciences humaines", 4],
    ["Entreprise", 10],
  ]);
  expect(s7.flatMap((u) => u.matieres)).toHaveLength(10);
  expect(s8.flatMap((u) => u.matieres)).toHaveLength(14);
  expect(s8[3].matieres.map((m) => m.name)).toEqual([
    "Méthodologie de recherche",
    "Management de la SST",
    "Droit et éthique",
    "Stratégie de développement",
  ]);
  for (const data of [s7, s8]) {
    expect(() => validateStructure(data)).not.toThrow();
    expect(data.reduce((total, u) => total + u.ects, 0)).toBe(30);
    for (const m of data.flatMap((u) => u.matieres)) {
      if (data === s7 && m.name === "Élec de puissance") {
        expect(m.evaluations).toEqual([
          { name: "Partiel", code: "26_ISENA4_TLN_S7_ELECPUISS", coeff: 1 },
        ]);
        continue;
      }
      expect(m.coeff_matiere).toBe(1);
      expect(m.evaluations.every((e) => e.coeff === 1 && e.code === "")).toBe(
        true,
      );
      expect(m.code_rattrapage).toBe("");
      expect(m.evaluations.map((e) => e.name)).toEqual(
        m.name.startsWith("Projet ")
          ? ["Projet"]
          : m.name === "Entreprise"
            ? ["Évaluation entreprise"]
            : ["DS", "Partiel"],
      );
    }
  }
});
it("uses equal DS/partiel weights, excludes missing marks and resets without modifying the supplied configuration", () => {
  const original = JSON.stringify(s7);
  const empty = calc(s7, [], {}, false, "S7");
  expect(empty.stats.moyenne).toBeNull();
  expect(empty.stats.totalEcts).toBe(30);
  const [ds, partiel] = empty.structure[0].matieres[1].evaluations;
  const result = calc(
    s7,
    [],
    { [ds.uniqueId!]: 10, [partiel.uniqueId!]: 14 },
    false,
    "S7",
  );
  expect(result.structure[0].matieres[1].moyenne).toBe(12);
  expect(result.stats.ects).toBe(0);
  expect(result.stats.published).toBe(0);
  expect(calc(s7, [], {}, false, "S7").stats.moyenne).toBeNull();
  expect(JSON.stringify(s7)).toBe(original);
});
it("weights the full simulated ISENA4 semester by the ECTS in the supplied table", () => {
  for (const [data, sem, expected] of [
    [s7, "S7", 440 / 30],
    [s8, "S8", 438 / 30],
  ] as const) {
    const simulations: Record<string, number> = {};
    calc(data, [], {}, false, sem).structure.forEach((u, i) =>
      u.matieres.forEach((m) =>
        m.evaluations.forEach((e) => {
          simulations[e.uniqueId!] = 10 + i * 2;
        }),
      ),
    );
    const result = calc(data, [], simulations, false, sem);
    expect(result.stats.moyenne).toBeCloseTo(expected);
    expect(result.stats.ects).toBe(30);
    expect(result.stats.published).toBe(0);
  }
});
it("reads a legacy M1 choice as ISEN4 while preserving its semester, major and URLs", async () => {
  await storage.setStorageItem("SelectedYear", "M1");
  await storage.setSelectedSemester("S8");
  await storage.setSelectedMajors({ S7: "CYBER", S8: "CYBER" });
  const urls = {
    S7: catalog.annee.ISEN4.S7.CYBER,
    S8: catalog.annee.ISEN4.S8.CYBER,
  };
  await storage.setSelectedMajorsUrls(urls);
  expect(await storage.getSelectedYear()).toBe("ISEN4");
  expect(await storage.getSelectedSemester()).toBe("S8");
  expect(await storage.getSelectedMajors()).toEqual({
    S7: "CYBER",
    S8: "CYBER",
  });
  expect(await storage.getSelectedMajorsUrls()).toEqual(urls);
  await storage.setSelectedYear("M1");
  expect(await storage.getStorageItem("SelectedYear")).toBe("ISEN4");
  await storage.setSelectedYear("ISENA4");
  expect(await storage.getSelectedYear()).toBe("ISENA4");
});

it("associates the published power electronics mark with its only assessment", () => {
  const result = calc(
    s7,
    [
      {
        code: "26_ISENA4_TLN_S7_ELECPUISS",
        name: "Élec de puissance",
        note: 14,
        date: "",
      },
    ],
    {},
    false,
    "S7",
  );
  expect(result.structure[0].matieres[0].evaluations).toEqual([
    expect.objectContaining({
      name: "Partiel",
      publishedNote: 14,
      source: "published",
    }),
  ]);
  expect(result.structure[0].matieres[0].moyenne).toBe(14);
  expect(result.stats.published).toBe(1);
});
