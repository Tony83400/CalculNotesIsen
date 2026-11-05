import type { Note, Ue } from "../types/note";
import type { AgendaEvent } from "../types/agenda";
import structure from "../structures_notes/annee_4/S7_DEV_LOGICIEL.json";
export const demoStructure: Ue[] = structure.map((u, ui) => ({
  ...u,
  matieres: u.matieres.map((m, mi) => ({
    ...m,
    evaluations: m.evaluations.map((e, ei) => ({
      ...e,
      code: e.code || `DEMO_S7_${ui}_${mi}_${ei}`,
    })),
  })),
}));
export function demoNotes(): Note[] {
  const grades = [14.5, 12, 16.25, 11, 8.5, 15, 13.75, 10, 17, 12.5, 14, 9.25];
  let index = 0;
  return demoStructure.flatMap((u) =>
    u.matieres.flatMap((m) =>
      m.evaluations.flatMap((e) => {
        index++;
        return e.code && index % 4 !== 0
          ? [
              {
                code: e.code,
                name: e.name,
                note: grades[index % grades.length],
                date: `${String(1 + (index % 3)).padStart(2, "0")}/11/2026`,
              },
            ]
          : [];
      }),
    ),
  );
}
export function demoEvents(): AgendaEvent[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const definitions: [
    [number, number, number, number],
    string,
    string,
    boolean?,
  ][] = [
    [[0, 8, 30, 120], "Architecture système · CM", "Bâtiment B · B204"],
    [
      [0, 13, 30, 180],
      "Développement web · Projet",
      "Salle informatique · C102",
    ],
    [[1, 9, 0, 120], "Générative IA · TD", "Bâtiment A · A301"],
    [[1, 13, 0, 120], "Anglais · Atelier", "Bâtiment B · B106"],
    [[2, 8, 30, 90], "Linux & shell · TP", "Salle informatique · C102"],
    [[2, 10, 15, 105], "Architecture système · TD", "Bâtiment B · B204"],
    [
      [2, 14, 0, 120],
      "Développement web · Projet",
      "Salle informatique · C102",
    ],
    [[3, 9, 0, 180], "Bases de données · TP", "Salle informatique · C201"],
    [[3, 14, 0, 90], "Algorithmique · Examen", "Amphithéâtre A", true],
    [[4, 8, 30, 120], "Réseaux · CM", "Amphithéâtre B"],
    [[4, 13, 30, 120], "Projet de semestre", "Salle projet · C012"],
  ];
  return definitions.map(([t, title, location, isExam], i) => {
    const start = new Date(monday);
    start.setDate(start.getDate() + t[0]);
    start.setHours(t[1], t[2]);
    return {
      id: `demo:${i}`,
      title,
      location,
      start,
      end: new Date(+start + t[3] * 60000),
      isExam,
      professors: "",
    };
  });
}
