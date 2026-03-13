import { Ue } from "../types/note";

const getDonneesAvecNotes = (
  dataFiliere: Ue[],
  notes: any[],
  simulatedNotes: any
) => {
  const structureCopie: Ue[] = JSON.parse(JSON.stringify(dataFiliere));
  const usedNoteCodes = new Set<string>();

  let ectsValides = 0;
  let totalPointsSemestre = 0;
  let totalEctsSemestre = 0;

  structureCopie.forEach((ue) => {
    let sommePointsUE = 0;
    let totalCoeffUE = 0;
    let ueEstComplete = true;
    let pasDeNoteEliminatoire = true;

    ue.matieres.forEach((matiere) => {
      let sommePointsMat = 0;
      let totalCoeffMat = 0;

      matiere.evaluations.forEach((evaluation, indexEval) => {
        // 1. Génération d'un ID UNIQUE pour éviter le bug des sliders liés
        const uniqueId =
          evaluation.code && evaluation.code.length > 0
            ? evaluation.code
            : `${matiere.name}_${evaluation.name}_${indexEval}`;

        evaluation.uniqueId = uniqueId;

        // 2. Recherche note API
        let noteFromApi = null;
        if (evaluation.code) {
          // On cherche d'abord une correspondance exacte
          noteFromApi = notes.find((n) => n.code === evaluation.code);

          // Si pas de correspondance exacte, on cherche par préfixe (ex: LV2 -> LV2_ITALIEN)
          if (!noteFromApi) {
            noteFromApi = notes.find((n) => n.code.startsWith(evaluation.code));
          }

          if (noteFromApi) {
            usedNoteCodes.add(noteFromApi.code);
          }
        }

        // 3. Gestion Priorité : Simulation > API > Rien
        const simu = simulatedNotes[uniqueId];

        let finalNote: number | null = null;
        let isFromApi = false;

        // Si une simulation existe, elle gagne
        if (simu !== undefined && simu !== null) {
          finalNote = simu;
        }
        // Sinon, si on a une note API
        else if (noteFromApi) {
          finalNote = noteFromApi.note;
          isFromApi = true;
        }

        // On stocke les infos pour l'affichage
        evaluation.noteReelle = finalNote;
        evaluation.hasApiNote = isFromApi; // <-- Pour cacher le slider

        // Calculs
        if (finalNote !== null) {
          sommePointsMat += finalNote * evaluation.coeff;
          totalCoeffMat += evaluation.coeff;
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
      ue.moyenne = sommePointsUE / totalCoeffUE;
      const estValide =
        ueEstComplete && ue.moyenne >= 10 && pasDeNoteEliminatoire;
      ue.isValidated = estValide;

      if (estValide) ectsValides += ue.ects;

      totalPointsSemestre += ue.moyenne * ue.ects;
      totalEctsSemestre += ue.ects;
    } else {
      ue.moyenne = null;
      ue.isValidated = false;
    }
  });

  // 1. Extraire le semestre de la filière (ex: "CIN UI S5" -> "S5")
  const filiereName = structureCopie.length > 0 ? "" : ""; // On ne peut pas facilement via structureCopie
  // En fait, on peut regarder les codes des évaluations déjà présentes dans la structure pour deviner le semestre cible
  let currentSemester = "";
  for (const ue of structureCopie) {
    for (const mat of ue.matieres) {
      for (const ev of mat.evaluations) {
        if (ev.code) {
          const match = ev.code.match(/_S(\d)_/);
          if (match) {
            currentSemester = `S${match[1]}`;
            break;
          }
        }
      }
      if (currentSemester) break;
    }
    if (currentSemester) break;
  }

  // Gestion des notes "orphelines" (qui ne sont pas dans la structure)
  const unusedNotes = notes.filter((n) => {
    const isUnused = !usedNoteCodes.has(n.code);
    if (!isUnused) return false;
    
    // Si on a identifié un semestre (S5, S6...), on ne garde que les notes de ce semestre
    if (currentSemester) {
      return n.code.includes(`_${currentSemester}_`);
    }
    return true;
  });

  if (unusedNotes.length > 0) {
    // Tri des notes par date (la plus récente en premier)
    const sortedUnused = [...unusedNotes].sort((a, b) => {
      const dateA = a.date ? new Date(a.date.split('/').reverse().join('-')) : new Date(0);
      const dateB = b.date ? new Date(b.date.split('/').reverse().join('-')) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    const otherUe: Ue = {
      ue: "Autres notes (Hors Moyenne)",
      ects: 0,
      matieres: sortedUnused.map((n) => ({
        name: n.name,
        coeff_matiere: 1,
        evaluations: [
          {
            name: n.name,
            code: n.code,
            coeff: 1,
            noteReelle: n.note,
            hasApiNote: true,
            uniqueId: n.code,
          },
        ],
        moyenne: n.note,
      })),
      moyenne: sortedUnused.reduce((acc, n) => acc + n.note, 0) / sortedUnused.length,
      isValidated: false,
    };
    structureCopie.push(otherUe);
  }

  const moyGen =
    totalEctsSemestre > 0 ? totalPointsSemestre / totalEctsSemestre : 0;

  return {
    structure: structureCopie,
    stats: { ects: ectsValides, moyenne: moyGen },
  };
};

export default getDonneesAvecNotes;
