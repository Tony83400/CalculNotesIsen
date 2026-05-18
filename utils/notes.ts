import { Ue, Note, Matiere, Evaluation } from "../types/note";

/**
 * Fusionne les notes de l'API avec la structure locale et gère les simulations.
 */
function mergeNotesWithStructure(
  structure: Ue[],
  normalNotes: Note[],
  simulatedNotes: Record<string, number | null>,
  usedNoteCodes: Set<string>
) {
  structure.forEach((ue) => {
    ue.matieres.forEach((matiere) => {
      matiere.evaluations.forEach((evaluation, indexEval) => {
        const uniqueId = evaluation.code || `${matiere.name}_${evaluation.name}_${indexEval}`;
        evaluation.uniqueId = uniqueId;

        let noteFromApi = null;
        if (evaluation.code) {
          noteFromApi = normalNotes.find((n) => n.code === evaluation.code) || 
                        normalNotes.find((n) => n.code.startsWith(evaluation.code));
          
          if (noteFromApi) {
            usedNoteCodes.add(noteFromApi.code);
            evaluation.name = noteFromApi.name; // On utilise toujours le nom de l'API si dispo
          }
        }

        const simu = simulatedNotes[uniqueId];
        if (simu !== undefined && simu !== null) {
          evaluation.noteReelle = simu;
          evaluation.hasApiNote = false;
        } else if (noteFromApi) {
          evaluation.noteReelle = noteFromApi.note;
          evaluation.hasApiNote = true;
        } else {
          evaluation.noteReelle = null;
          evaluation.hasApiNote = false;
        }
      });
    });
  });
}

/**
 * Applique la logique des rattrapages ISEN.
 */
function applyRattrapagesLogic(
  structure: Ue[],
  rattrapageNotes: Note[],
  usedNoteCodes: Set<string>
) {
  structure.forEach((ue) => {
    let ueAUtiliseRattrapage = false;

    ue.matieres.forEach((matiere) => {
      const applicableRattrapages = rattrapageNotes.filter(r => {
        return matiere.code_rattrapage && r.code.includes(matiere.code_rattrapage);
      });

      if (applicableRattrapages.length > 0) {
        const bestRattrapage = [...applicableRattrapages].sort((a, b) => b.note - a.note)[0];
        usedNoteCodes.add(bestRattrapage.code);
        
        matiere.evaluations.forEach(ev => {
          if (bestRattrapage.note > (ev.noteReelle ?? -1)) {
            ev.noteReelle = bestRattrapage.note;
            ev.name = bestRattrapage.name; // On affiche le nom du rattrapage
            ev.hasApiNote = true;
            ueAUtiliseRattrapage = true;
          }
        });
      }
    });
    
    ue.hasRattrapageApplied = ueAUtiliseRattrapage;
  });
}

/**
 * Calcule les moyennes par matière et par UE, ainsi que la validation.
 */
function calculateAverages(structure: Ue[], showRattrapages: boolean) {
  let ectsValides = 0;
  let totalPointsSemestre = 0;
  let totalEctsSemestre = 0;

  structure.forEach((ue) => {
    let sommePointsUE = 0;
    let totalCoeffUE = 0;
    let ueEstComplete = true;
    let pasDeNoteEliminatoire = true;

    ue.matieres.forEach((matiere) => {
      let sommePointsMat = 0;
      let totalCoeffMat = 0;

      matiere.evaluations.forEach((ev) => {
        if (ev.noteReelle !== null && typeof ev.noteReelle === 'number') {
          sommePointsMat += ev.noteReelle * ev.coeff;
          totalCoeffMat += ev.coeff;
        } else {
          ueEstComplete = false;
        }
      });

      if (totalCoeffMat > 0) {
        matiere.moyenne = sommePointsMat / totalCoeffMat;
        if (matiere.moyenne < 6) pasDeNoteEliminatoire = false;
        sommePointsUE += matiere.moyenne * matiere.coeff_matiere;
        totalCoeffUE += matiere.coeff_matiere;
      } else {
        matiere.moyenne = null;
        ueEstComplete = false;
      }
    });

    if (totalCoeffUE > 0) {
      const moyenneCalculee = sommePointsUE / totalCoeffUE;

      if (showRattrapages && ue.hasRattrapageApplied) {
        ue.moyenne = Math.min(moyenneCalculee, 10);
      } else {
        ue.moyenne = moyenneCalculee;
      }

      ue.isValidated = ueEstComplete && ue.moyenne >= 10 && pasDeNoteEliminatoire;
      ue.hasEliminatoryNote = !pasDeNoteEliminatoire;

      if (ue.isValidated) ectsValides += ue.ects;
      totalPointsSemestre += ue.moyenne * ue.ects;
      totalEctsSemestre += ue.ects;
    } else {
      ue.moyenne = null;
      ue.isValidated = false;
    }
  });

  return { ectsValides, totalPointsSemestre, totalEctsSemestre };
}

/**
 * Gère les notes "orphelines" (non présentes dans la structure).
 */
function appendOrphanNotes(structure: Ue[], notes: Note[], usedNoteCodes: Set<string>) {
  let currentSemester = "";
  structure.some(ue => ue.matieres.some(m => m.evaluations?.some(e => {
    const match = e.code?.match(/_S(\d)_/);
    if (match) currentSemester = `S${match[1]}`;
    return !!currentSemester;
  })));

  const unusedNotes = notes.filter(n => !usedNoteCodes.has(n.code) && (!currentSemester || n.code.includes(`_${currentSemester}_`)));

  if (unusedNotes.length > 0) {
    const sortedUnused = [...unusedNotes].sort((a, b) => {
      const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
      const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    structure.push({
      ue: "Autres notes (Hors Moyenne)",
      ects: 0,
      matieres: sortedUnused.map(n => ({
        name: n.name,
        coeff_matiere: 1,
        evaluations: [{ name: n.name, code: n.code, coeff: 1, noteReelle: n.note, hasApiNote: true, uniqueId: n.code }],
        moyenne: n.note,
      })),
      moyenne: sortedUnused.reduce((acc, n) => acc + n.note, 0) / sortedUnused.length,
      isValidated: false,
    });
  }
}

/**
 * Calcule les moyennes et fusionne les notes de l'API avec la structure de la filière.
 * Gère les simulations et le mode rattrapage spécifique à l'ISEN.
 */
const getDonneesAvecNotes = (
  dataFiliere: Ue[] = [],
  notes: Note[] = [],
  simulatedNotes: Record<string, number | null> = {},
  showRattrapages: boolean = false
) => {
  if (!dataFiliere) dataFiliere = [];
  
  const structureCopie: Ue[] = JSON.parse(JSON.stringify(dataFiliere));
  const usedNoteCodes = new Set<string>();

  const rattrapageNotes = notes.filter(n => n.code.includes("_RATTRAPAGE_"));
  const normalNotes = notes.filter(n => !n.code.includes("_RATTRAPAGE_"));

  // 1. Fusion initiale
  mergeNotesWithStructure(structureCopie, normalNotes, simulatedNotes, usedNoteCodes);

  // 2. Rattrapages
  if (showRattrapages) {
    applyRattrapagesLogic(structureCopie, rattrapageNotes, usedNoteCodes);
  }

  // 3. Calcul des moyennes
  const { ectsValides, totalPointsSemestre, totalEctsSemestre } = calculateAverages(structureCopie, showRattrapages);

  // 4. Notes orphelines
  appendOrphanNotes(structureCopie, notes, usedNoteCodes);

  return {
    structure: structureCopie,
    stats: {
      ects: ectsValides,
      moyenne: totalEctsSemestre > 0 ? totalPointsSemestre / totalEctsSemestre : 0
    },
  };
};

export default getDonneesAvecNotes;
