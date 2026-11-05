import type { Ue, Note } from "../types/note";

export const validGrade = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 20;
export function parseGrade(text: string): number | null {
  if (!/^\d{1,2}([.,]\d{1,2})?$/.test(text.trim())) return null;
  const n = Number(text.trim().replace(",", "."));
  return validGrade(n) ? n : null;
}
export function validateNotes(data: unknown): Note[] {
  if (!Array.isArray(data)) throw new Error("Réponse de notes invalide.");
  return data.flatMap((n) => {
    if (!n || typeof n.code !== "string" || typeof n.name !== "string")
      return [];
    const value =
      typeof n.note === "string"
        ? /^\d+(?:[.,]\d+)?$/.test(n.note.trim())
          ? Number(n.note.trim().replace(",", "."))
          : null
        : n.note;
    return validGrade(value)
      ? [
          {
            code: n.code,
            name: n.name,
            note: value,
            date: typeof n.date === "string" ? n.date : "",
          },
        ]
      : [];
  });
}
export function validateStructure(data: unknown): Ue[] {
  if (
    !Array.isArray(data) ||
    !data.every(
      (u) =>
        u &&
        typeof u.ue === "string" &&
        Number.isFinite(u.ects) &&
        u.ects >= 0 &&
        Array.isArray(u.matieres) &&
        u.matieres.length > 0 &&
        u.matieres.every(
          (m: Ue["matieres"][number]) =>
            typeof m.name === "string" &&
            Number.isFinite(m.coeff_matiere) &&
            m.coeff_matiere > 0 &&
            Array.isArray(m.evaluations) &&
            m.evaluations.length > 0 &&
            m.evaluations.every(
              (e) =>
                typeof e.name === "string" &&
                typeof e.code === "string" &&
                Number.isFinite(e.coeff) &&
                e.coeff > 0,
            ),
        ),
    )
  ) {
    throw new Error("Structure de semestre invalide ou indisponible.");
  }
  return data;
}
const average = (
  items: { value: number | null | undefined; weight: number }[],
) => {
  let sum = 0,
    weight = 0;
  for (const i of items)
    if (validGrade(i.value) && Number.isFinite(i.weight) && i.weight > 0) {
      sum += i.value * i.weight;
      weight += i.weight;
    }
  return weight ? sum / weight : null;
};
const boundaryPrefix = (code: string, prefix: string) =>
  code === prefix ||
  code.startsWith(prefix.endsWith("_") ? prefix : `${prefix}_`);

/** Pure projection. Preserves the existing retake cap pending the institution's rule. */
export default function getDonneesAvecNotes(
  dataFiliere: Ue[] = [],
  notes: Note[] = [],
  simulatedNotes: Record<string, number | null> = {},
  showRattrapages = false,
  semesterId?: string,
) {
  const valid = notes.filter((n) => validGrade(n.note));
  const normal = valid.filter((n) => !n.code.includes("_RATTRAPAGE_"));
  const retakes = valid.filter((n) => n.code.includes("_RATTRAPAGE_"));
  const exact = new Map<string, Note[]>();
  for (const n of normal) exact.set(n.code, [...(exact.get(n.code) || []), n]);
  const used = new Set<Note>();
  const configCodes = dataFiliere
    .flatMap((u) => u.matieres.flatMap((m) => m.evaluations.map((e) => e.code)))
    .filter(Boolean);
  let published = 0,
    total = 0,
    entered = 0;
  const structure: Ue[] = dataFiliere.map((ue, ui) => {
    let retakeApplied = false,
      hasSimulation = false;
    const matieres = ue.matieres.map((m, mi) => {
      const applicable =
        showRattrapages && m.code_rattrapage
          ? retakes.filter(
              (n) =>
                boundaryPrefix(n.code, m.code_rattrapage!) ||
                n.code.includes(`_${m.code_rattrapage}_`),
            )
          : [];
      applicable.forEach((n) => used.add(n));
      const best = applicable.reduce<Note | null>(
        (a, b) => (!a || b.note > a.note ? b : a),
        null,
      );
      const evaluations = m.evaluations.map((e, ei) => {
        total++;
        const uniqueId = `${ui}:${mi}:${ei}:${e.code || e.name}`;
        const exactMatches = e.code ? exact.get(e.code) : undefined;
        const candidates =
          exactMatches ||
          (e.code
            ? normal.filter(
                (n) =>
                  boundaryPrefix(n.code, e.code) &&
                  !configCodes.some(
                    (c) =>
                      c !== e.code &&
                      c.length > e.code.length &&
                      boundaryPrefix(n.code, c),
                  ),
              )
            : []);
        const api = candidates?.length === 1 ? candidates[0] : undefined;
        if (api) {
          used.add(api);
          published++;
        }
        const simulation = simulatedNotes[uniqueId];
        const isSimulation = validGrade(simulation);
        if (isSimulation) hasSimulation = true;
        let value = isSimulation ? simulation : (api?.note ?? null);
        let source: "published" | "simulation" | "retake" | "missing" =
          isSimulation ? "simulation" : api ? "published" : "missing";
        if (best && best.note > (value ?? -1)) {
          value = best.note;
          source = "retake";
          retakeApplied = true;
        }
        if (value !== null) entered++;
        return {
          ...e,
          uniqueId,
          publishedNote: api?.note ?? null,
          noteReelle: value,
          hasApiNote: !!api,
          source,
        };
      });
      return {
        ...m,
        evaluations,
        moyenne: average(
          evaluations.map((e) => ({ value: e.noteReelle, weight: e.coeff })),
        ),
        isComplete:
          evaluations.length > 0 &&
          evaluations.every((e) => validGrade(e.noteReelle)),
      };
    });
    const raw = average(
      matieres.map((m) => ({ value: m.moyenne, weight: m.coeff_matiere })),
    );
    const moyenne =
      raw === null ? null : retakeApplied ? Math.min(10, raw) : raw;
    const isComplete =
      matieres.length > 0 && matieres.every((m) => m.isComplete);
    const hasEliminatoryNote = matieres.some(
      (m) => m.moyenne !== null && m.moyenne < 6,
    );
    return {
      ...ue,
      matieres,
      moyenne,
      isComplete,
      hasSimulation,
      hasEliminatoryNote,
      hasRattrapageApplied: retakeApplied,
      isValidated:
        isComplete && moyenne !== null && moyenne >= 10 && !hasEliminatoryNote,
    };
  });
  const academic = structure.filter((u) => u.ects > 0);
  const moyenne = average(
    academic.map((u) => ({ value: u.moyenne, weight: u.ects })),
  );
  const semester =
    semesterId?.match(/^S(\d+)$/)?.[1] ||
    configCodes.map((c) => c.match(/_S(\d+)_/)?.[1]).find(Boolean);
  const unused = valid.filter(
    (n) => !used.has(n) && (!semester || n.code.includes(`_S${semester}_`)),
  );
  if (unused.length)
    structure.push({
      ue: "Notes hors structure",
      ects: 0,
      outsideStructure: true,
      moyenne: null,
      matieres: [...unused]
        .sort((a, b) => noteTimestamp(b.date) - noteTimestamp(a.date))
        .map((n) => ({
          name: n.name,
          coeff_matiere: 1,
          moyenne: n.note,
          evaluations: [
            {
              name: n.name,
              code: n.code,
              coeff: 1,
              noteReelle: n.note,
              publishedNote: n.note,
              hasApiNote: true,
              uniqueId: `orphan:${n.code}:${n.date}`,
              source: "published",
            },
          ],
        })),
    });
  return {
    structure,
    stats: {
      moyenne,
      ects: academic
        .filter((u) => u.isValidated)
        .reduce((a, u) => a + u.ects, 0),
      totalEcts: academic.reduce((a, u) => a + u.ects, 0),
      published,
      total,
      entered,
      complete: academic.length > 0 && academic.every((u) => u.isComplete),
    },
  };
}

export function noteTimestamp(date: string) {
  return (
    Date.parse(
      date.includes("/") ? date.split("/").reverse().join("-") : date,
    ) || 0
  );
}
