import { Float } from "react-native/Libraries/Types/CodegenTypes";

export interface Note {
    code: string,
    name: string,
    note: Float,
    date: string
}
export interface Matiere { name: string; coeff_matiere: number, evaluations: Evaluations[] };
export interface Evaluations { name: string, code: string, coeff: number, noteReelle?: number; };
export interface UeData { ue: string; ects: number; matieres: Matiere[] };