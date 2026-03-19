import { Ue } from "../types/note";

const getDonneesAvecNotes = (
  dataFiliere: Ue[],
  notes: any[],
  simulatedNotes: any,
  showRattrapages: boolean = false
) => {
  const structureCopie: Ue[] = JSON.parse(JSON.stringify(dataFiliere));
  const usedNoteCodes = new Set<string>();

  // 0. Prétraitement des rattrapages
  const rattrapageNotes = notes.filter(n => n.code.includes("_RATTRAPAGE_"));
  const normalNotes = notes.filter(n => !n.code.includes("_RATTRAPAGE_"));

  let ectsValides = 0;
  let totalPointsSemestre = 0;
  let totalEctsSemestre = 0;

  structureCopie.forEach((ue) => {
    let sommePointsUE = 0;
    let totalCoeffUE = 0;
    let sommePointsUE_Initial = 0;
    let totalCoeffUE_Initial = 0;
    let ueEstComplete = true;
    let pasDeNoteEliminatoire = true;

    ue.matieres.forEach((matiere) => {
      let sommePointsMat = 0;
      let totalCoeffMat = 0;

      // On traite d'abord les évaluations normalement
      matiere.evaluations.forEach((evaluation, indexEval) => {
        const uniqueId =
          evaluation.code && evaluation.code.length > 0
            ? evaluation.code
            : `${matiere.name}_${evaluation.name}_${indexEval}`;

        evaluation.uniqueId = uniqueId;

        let noteFromApi = null;
        if (evaluation.code) {
          noteFromApi = normalNotes.find((n) => n.code === evaluation.code);
          if (!noteFromApi) {
            noteFromApi = normalNotes.find((n) => n.code.startsWith(evaluation.code));
          }

          if (noteFromApi) {
            usedNoteCodes.add(noteFromApi.code);
          }
        }

        const simu = simulatedNotes[uniqueId];
        let finalNote: number | null = null;
        let isFromApi = false;

        if (simu !== undefined && simu !== null) {
          finalNote = simu;
        } else if (noteFromApi) {
          finalNote = noteFromApi.note;
          isFromApi = true;
        }

        evaluation.noteReelle = finalNote;
        evaluation.hasApiNote = isFromApi;
      });

      // --- CALCUL MOYENNE INITIALE (SANS RATTRAPAGES) ---
      let pointsMatiereSansRat = 0;
      let coeffMatiereSansRat = 0;
      matiere.evaluations.forEach(ev => {
        if (ev.noteReelle !== null) {
          pointsMatiereSansRat += ev.noteReelle * ev.coeff;
          coeffMatiereSansRat += ev.coeff;
        }
      });
      const moyenneMatiereSansRat = coeffMatiereSansRat > 0 ? pointsMatiereSansRat / coeffMatiereSansRat : null;
      if (moyenneMatiereSansRat !== null) {
        sommePointsUE_Initial += moyenneMatiereSansRat * matiere.coeff_matiere;
        totalCoeffUE_Initial += matiere.coeff_matiere;
      }

      // Logique de Rattrapage (si activé)
      if (showRattrapages) {
        const matiereNameUpper = matiere.name.toUpperCase().replace(/\s+/g, '_');
        
        const applicableRattrapages = rattrapageNotes.filter(r => {
          const rattrapageSubject = r.code.split('_RATTRAPAGE_')[1] || "";
          const matchMatiere = matiereNameUpper.includes(rattrapageSubject) || rattrapageSubject.includes(matiereNameUpper);
          const matchEval = matiere.evaluations.some(ev => {
            const evalSuffix = ev.code?.split('_').pop() || "";
            return (evalSuffix && evalSuffix.includes(rattrapageSubject)) || (rattrapageSubject && rattrapageSubject.includes(evalSuffix));
          });
          return matchMatiere || matchEval;
        });

        if (applicableRattrapages.length > 0) {
          const bestRattrapage = [...applicableRattrapages].sort((a, b) => b.note - a.note)[0];
          usedNoteCodes.add(bestRattrapage.code);
          matiere.evaluations.forEach((evaluation) => {
            const currentNote = evaluation.noteReelle ?? -1;
            if (bestRattrapage.note > currentNote) {
              evaluation.noteReelle = bestRattrapage.note;
              evaluation.hasApiNote = true;
            }
          });
        }
      }

      // Calcul de la moyenne de la matière avec les notes potentiellement modifiées
      matiere.evaluations.forEach((evaluation) => {
        if (evaluation.noteReelle !== null) {
          sommePointsMat += evaluation.noteReelle * evaluation.coeff;
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
      const moyenneInitiale = totalCoeffUE_Initial > 0 ? sommePointsUE_Initial / totalCoeffUE_Initial : 0;
      const moyenneAvecRattrapages = sommePointsUE / totalCoeffUE;

      if (showRattrapages) {
        // RÈGLE ISEN :
        // 1. Si moyenneInitiale < 10 : on plafonne à 10
        if (moyenneInitiale < 10) {
          ue.moyenne = Math.min(moyenneAvecRattrapages, 10);
        } 
        // 2. Si moyenneInitiale >= 10 : on garde la moyenne initiale (le rattrapage ne sert qu'à lever le < 6)
        else {
          ue.moyenne = moyenneInitiale;
        }
      } else {
        ue.moyenne = moyenneAvecRattrapages;
      }

      const estValide =
        ueEstComplete && ue.moyenne >= 10 && pasDeNoteEliminatoire;
      ue.isValidated = estValide;
      ue.hasEliminatoryNote = !pasDeNoteEliminatoire;

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