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
  noteReelle?: number | null;
  publishedNote?: number | null;
  hasApiNote?: boolean;
  uniqueId?: string;
  source?: "published" | "simulation" | "retake" | "missing";
}
export interface Matiere {
  name: string;
  coeff_matiere: number;
  evaluations: Evaluations[];
  moyenne?: number | null;
  code_rattrapage?: string;
  isComplete?: boolean;
}
export interface Ue {
  ue: string;
  ects: number;
  matieres: Matiere[];
  moyenne?: number | null;
  isValidated?: boolean;
  hasEliminatoryNote?: boolean;
  hasRattrapageApplied?: boolean;
  isComplete?: boolean;
  hasSimulation?: boolean;
  outsideStructure?: boolean;
}
export interface SemesterConfig {
  filieres: Record<string, Ue[]>;
}
