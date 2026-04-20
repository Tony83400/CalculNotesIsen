export interface AgendaEvent {
  id: string;
  title: string;
  professors: string;
  location: string;
  start: Date;
  end: Date;
  isExam?: boolean; 
}

export interface EventDetails {
  start: string;
  end: string;
  status: string;
  subject: string;
  type: string;
  isPaper: boolean;
  rooms: string[];
  teachers: string[];
  students: string[];
  groups: string[];
  courseName: string;
  module: string;
}