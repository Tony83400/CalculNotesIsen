import { UeData } from "./data";

const getDonneesAvecNotes = (
  dataFiliere: UeData[],
  notes: any[],
  simulatedNotes: any
) => {
  const structureCopie: UeData[] = JSON.parse(JSON.stringify(dataFiliere));

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
        // Si pas de code, on combine nom_matiere + nom_eval + index
        const uniqueId =
          evaluation.code && evaluation.code.length > 0
            ? evaluation.code
            : `${matiere.name}_${evaluation.name}_${indexEval}`;

        evaluation.uniqueId = uniqueId;

        // 2. Recherche note API

        const noteFromApi = evaluation.code
          ? notes.find((n) => n.code.startsWith(evaluation.code))
          : null; // Si pas de code, on renvoie null direct
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

  const moyGen =
    totalEctsSemestre > 0 ? totalPointsSemestre / totalEctsSemestre : 0;

  return {
    structure: structureCopie,
    stats: { ects: ectsValides, moyenne: moyGen },
  };
};

export default getDonneesAvecNotes;
