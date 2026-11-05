import { describe, it, expect } from "vitest";
import calc, {
  parseGrade,
  validateNotes,
  validateStructure,
} from "../utils/notes";
import type { Ue } from "../types/note";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
const fixture = (): Ue[] => [
  {
    ue: "Sciences",
    ects: 12,
    matieres: [
      {
        name: "Maths",
        coeff_matiere: 2,
        code_rattrapage: "MATH",
        evaluations: [
          { name: "Écrit", code: "Y_S1_MATH_A", coeff: 3 },
          { name: "Projet", code: "Y_S1_MATH_B", coeff: 1 },
        ],
      },
      {
        name: "Physique",
        coeff_matiere: 1,
        evaluations: [{ name: "Écrit", code: "Y_S1_PHY", coeff: 1 }],
      },
    ],
  },
  {
    ue: "Langues",
    ects: 6,
    matieres: [
      {
        name: "Anglais",
        coeff_matiere: 1,
        evaluations: [{ name: "Oral", code: "Y_S1_EN", coeff: 1 }],
      },
    ],
  },
];
const note = (code: string, n: number) => ({
  code,
  name: "Fictif",
  note: n,
  date: "01/11/2026",
});
describe("weighted academic projection", () => {
  it("weights assessments, subjects, then ECTS", () => {
    const r = calc(fixture(), [
      note("Y_S1_MATH_A", 10),
      note("Y_S1_MATH_B", 18),
      note("Y_S1_PHY", 15),
      note("Y_S1_EN", 16),
    ]);
    expect(r.structure[0].matieres[0].moyenne).toBe(12);
    expect(r.structure[0].moyenne).toBe(13);
    expect(r.stats.moyenne).toBe(14);
    expect(r.stats.ects).toBe(18);
  });
  it("keeps no grades null and partial averages provisional", () => {
    expect(calc(fixture()).stats.moyenne).toBeNull();
    const r = calc(fixture(), [note("Y_S1_MATH_A", 0)]);
    expect(r.stats.moyenne).toBe(0);
    expect(r.stats.ects).toBe(0);
    expect(r.structure[0].isComplete).toBe(false);
  });
  it("validates exact 6 and 10 thresholds, blocks just below 6", () => {
    const f: Ue[] = [
      {
        ue: "UE",
        ects: 3,
        matieres: [
          {
            name: "A",
            coeff_matiere: 1,
            evaluations: [{ name: "A", code: "a", coeff: 1 }],
          },
          {
            name: "B",
            coeff_matiere: 1,
            evaluations: [{ name: "B", code: "b", coeff: 1 }],
          },
        ],
      },
    ];
    expect(calc(f, [note("a", 6), note("b", 14)]).stats.ects).toBe(3);
    expect(calc(f, [note("a", 5.99), note("b", 20)]).stats.ects).toBe(0);
    expect(calc(f, [note("a", 6), note("b", 13.99)]).stats.ects).toBe(0);
  });
  it("accepts commas precisely and rejects absent/nonfinite/out-of-range values", () => {
    expect(parseGrade("12,75")).toBe(12.75);
    for (const v of ["", "12abc", "12.345", "21", "-1", "Infinity"])
      expect(parseGrade(v)).toBeNull();
    expect(
      validateNotes([
        null,
        ...[null, "", undefined, NaN, Infinity, "abc", 21].map((value) => ({
          code: "a",
          name: "A",
          note: value,
        })),
      ]),
    ).toEqual([]);
    expect(validateNotes([{ code: "a", name: "A", note: 0 }])[0].note).toBe(0);
  });
  it("simulates without mutating source and restores published grade on reset", () => {
    const f = fixture(),
      notes = [note("Y_S1_MATH_A", 8)],
      before = JSON.stringify({ f, notes });
    const id = calc(f, notes).structure[0].matieres[0].evaluations[0].uniqueId!;
    const r = calc(f, notes, { [id]: 16 });
    expect(r.structure[0].matieres[0].evaluations[0]).toMatchObject({
      noteReelle: 16,
      publishedNote: 8,
      source: "simulation",
    });
    expect(
      calc(f, notes, {}).structure[0].matieres[0].evaluations[0].noteReelle,
    ).toBe(8);
    expect(JSON.stringify({ f, notes })).toBe(before);
  });
  it("prefers exact and longest boundary prefixes; ambiguous prefixes stay outside", () => {
    const f = fixture();
    f[0].matieres[0].evaluations[0].code = "Y_S1_MATH";
    const r = calc(f, [
      note("Y_S1_MATH_B", 15),
      note("Y_S1_MATH_EXTRA", 12),
      note("Y_S1_MATH_EXTRA2", 10),
    ]);
    expect(r.structure[0].matieres[0].evaluations[0].noteReelle).toBeNull();
    expect(r.structure[0].matieres[0].evaluations[1].noteReelle).toBe(15);
    expect(r.structure.at(-1)?.outsideStructure).toBe(true);
  });
  it("preserves the existing cap even for an initially passing UE (rule pending)", () => {
    const f = fixture(),
      notes = [
        note("Y_S1_MATH_A", 12),
        note("Y_S1_MATH_B", 12),
        note("Y_S1_PHY", 14),
        note("Y_S1_MATH_RATTRAPAGE_1", 16),
        note("Y_S1_MATH_RATTRAPAGE_2", 18),
      ];
    const r = calc(f, notes, {}, true);
    expect(r.structure[0].moyenne).toBe(10);
    expect(r.structure[0].matieres[0].moyenne).toBe(18);
    expect(r.structure[0].hasRattrapageApplied).toBe(true);
    expect(
      r.structure.filter((u) => u.outsideStructure).flatMap((u) => u.matieres)
        .length,
    ).toBe(0);
    expect(calc(f, notes).structure[0].moyenne).toBeCloseTo(12.6666667);
  });
  it("does not apply a weaker retake and excludes orphan/zero-ECTS results", () => {
    const f = fixture();
    f[1].ects = 0;
    const r = calc(
      f,
      [
        note("Y_S1_MATH_A", 15),
        note("Y_S1_MATH_B", 15),
        note("Y_S1_PHY", 15),
        note("Y_S1_EN", 0),
        note("Y_S1_X", 0),
        note("Y_S1_MATH_RATTRAPAGE_1", 8),
      ],
      {},
      true,
    );
    expect(r.stats.moyenne).toBe(15);
    expect(r.structure[0].hasRattrapageApplied).toBe(false);
  });
  it("validates every bundled semester JSON without claiming regulatory compliance", () => {
    for (const dir of readdirSync("structures_notes", {
      withFileTypes: true,
    }).filter((d) => d.isDirectory()))
      for (const file of readdirSync(join("structures_notes", dir.name)).filter(
        (f) => f.endsWith(".json"),
      ))
        expect(
          () =>
            validateStructure(
              JSON.parse(
                readFileSync(join("structures_notes", dir.name, file), "utf8"),
              ),
            ),
          file,
        ).not.toThrow();
  });
});
it("uses the selected semester to filter orphans when all configured codes are blank", () => {
  const f: Ue[] = [
    {
      ue: "Fictif",
      ects: 3,
      matieres: [
        {
          name: "Fictif",
          coeff_matiere: 1,
          evaluations: [{ name: "Fictif", code: "", coeff: 1 }],
        },
      ],
    },
  ];
  const r = calc(f, [note("Y_S7_A", 15), note("Y_S8_A", 12)], {}, false, "S8");
  expect(
    r.structure
      .find((u) => u.outsideStructure)
      ?.matieres.map((m) => m.evaluations[0].code),
  ).toEqual(["Y_S8_A"]);
  expect(r.stats.moyenne).toBeNull();
});
