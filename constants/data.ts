
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
  noteReelle?: number | null; // Peut être null si pas encore noté
}

export interface Matiere {
  name: string;
  coeff_matiere: number; 
  evaluations: Evaluations[];
  moyenne?: number | null; 
}

export interface UeData {
  ue: string;
  ects: number;
  matieres: Matiere[];
  moyenne?: number | null; 
  isValidated?: boolean; 
}
