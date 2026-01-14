export interface AgendaEvent {
  id: string;
  title: string;
  professors: string;
  location: string;
  start: Date;
  end: Date;
  isExam?: boolean; // Optionnel : utile si on détecte "CONTROLE"
}