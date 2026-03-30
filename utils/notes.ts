import { Ue, Note } from "../types/note";

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
  // Sécurité : évite l'erreur JSON.parse("undefined")
  if (!dataFiliere) dataFiliere = [];
  
  // Copie profonde pour ne pas muter l'original
  const structureCopie: Ue[] = JSON.parse(JSON.stringify(dataFiliere));
  const usedNoteCodes = new Set<string>();

  // Prétraitement des notes
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

      // 1. Attribution des notes aux évaluations
      matiere.evaluations.forEach((evaluation, indexEval) => {
        const uniqueId = evaluation.code || `${matiere.name}_${evaluation.name}_${indexEval}`;
        evaluation.uniqueId = uniqueId;

        let noteFromApi = null;
        if (evaluation.code) {
          noteFromApi = normalNotes.find((n) => n.code === evaluation.code) || 
                        normalNotes.find((n) => n.code.startsWith(evaluation.code));
          
          if (noteFromApi) usedNoteCodes.add(noteFromApi.code);
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

      // 2. Calcul Moyenne Initiale (pour règle rattrapage ISEN)
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

      // 3. Application des Rattrapages (si activé)
      if (showRattrapages) {
        const matiereNameUpper = matiere.name.toUpperCase().replace(/\s+/g, '_');
        const applicableRattrapages = rattrapageNotes.filter(r => {
          const ratSubject = r.code.split('_RATTRAPAGE_')[1] || "";
          return matiereNameUpper.includes(ratSubject) || ratSubject.includes(matiereNameUpper) ||
                 matiere.evaluations.some(ev => ev.code?.split('_').pop()?.includes(ratSubject));
        });

        if (applicableRattrapages.length > 0) {
          const bestRattrapage = [...applicableRattrapages].sort((a, b) => b.note - a.note)[0];
          usedNoteCodes.add(bestRattrapage.code);
          matiere.evaluations.forEach(ev => {
            if (bestRattrapage.note > (ev.noteReelle ?? -1)) {
              ev.noteReelle = bestRattrapage.note;
              ev.hasApiNote = true;
            }
          });
        }
      }

      // 4. Calcul Moyenne Finale Matière
      matiere.evaluations.forEach((ev) => {
        if (ev.noteReelle !== null) {
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

    // 5. Calcul Moyenne UE & Validation
    if (totalCoeffUE > 0) {
      const moyenneInitiale = totalCoeffUE_Initial > 0 ? sommePointsUE_Initial / totalCoeffUE_Initial : 0;
      const moyenneApresCalcul = sommePointsUE / totalCoeffUE;

      if (showRattrapages) {
        // RÈGLE ISEN : Plafonnement à 10 si moyenne initiale < 10
        ue.moyenne = moyenneInitiale < 10 ? Math.min(moyenneApresCalcul, 10) : moyenneInitiale;
      } else {
        ue.moyenne = moyenneApresCalcul;
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

  // 6. Gestion des notes "orphelines" (non présentes dans la structure)
  let currentSemester = "";
  structureCopie.some(ue => ue.matieres.some(m => m.evaluations.some(e => {
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

    structureCopie.push({
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

  return {
    structure: structureCopie,
    stats: {
      ects: ectsValides,
      moyenne: totalEctsSemestre > 0 ? totalPointsSemestre / totalEctsSemestre : 0
    },
  };
};

export default getDonneesAvecNotes;