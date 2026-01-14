export interface Note {
  code: string;
  name: string;
  note: number; 
  date: string;
}

export interface Evaluations {
  name: string;
  code: string;
  coeff: number;
  noteReelle?: number | null; // Note finale (Simulée ou Réelle)
  
  // Nouveaux champs pour gérer ton affichage
  hasApiNote?: boolean;       // True si la note vient de l'API (cache le slider)
  uniqueId?: string;          // Identifiant unique pour le state du slider
}

export interface Matiere {
  name: string;
  coeff_matiere: number; 
  evaluations: Evaluations[];
  moyenne?: number | null; 
}

export interface Ue {
  ue: string;
  ects: number;
  matieres: Matiere[];
  moyenne?: number | null; 
  isValidated?: boolean; 
}