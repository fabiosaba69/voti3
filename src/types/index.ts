export interface Alunno {
  id: string;
  nome: string;
  cognome: string;
  dataNascita: string;
  classeId: string;
}

export interface Classe {
  id: string;
  nome: string;
  anno: string;
}

export interface Materia {
  id: string;
  nome: string;
  descrizione: string;
}

export interface Voto {
  id: string;
  alunnoId: string;
  materiaId: string;
  classeId: string;
  valore: ValutazioneType;
  data: string;
  note: string;
  quadrimestre: 1 | 2;
  tipoVerifica?: TipoVerifica;
}

export interface MediaCalcolata {
  alunnoId: string;
  materiaId: string;
  quadrimestre1?: ValutazioneType;
  quadrimestre2?: ValutazioneType;
  mediaFinale?: ValutazioneType;
}

export interface TipoVerifica {
  numeroDomande: number;
  risposteEsatte: number;
  dataVerifica: string;
  noteVerifica: string;
}

export type ValutazioneType = 'ottimo' | 'distinto' | 'buono' | 'discreto' | 'sufficiente' | 'non-sufficiente';

export interface MediaCalcolata {
  alunnoId: string;
  materiaId: string;
  quadrimestre1: ValutazioneType | null;
  quadrimestre2: ValutazioneType | null;
  mediaFinale: ValutazioneType | null;
}

export const VALUTAZIONI = {
  'ottimo': { valore: 10, label: 'Ottimo' },
  'distinto': { valore: 9, label: 'Distinto' },
  'buono': { valore: 8, label: 'Buono' },
  'discreto': { valore: 7, label: 'Discreto' },
  'sufficiente': { valore: 6, label: 'Sufficiente' },
  'non-sufficiente': { valore: 4, label: 'Non Sufficiente' }
} as const;

export function calcolaVotoVerifica(risposteEsatte: number, numeroDomande: number): ValutazioneType {
  if (numeroDomande === 0) return 'non-sufficiente';
  
  const percentuale = (risposteEsatte / numeroDomande) * 100;
  
  // Calcolo più elastico per scuola primaria
  // Sufficienza dalla metà delle risposte (50%)
  if (percentuale >= 90) return 'ottimo';      // 90-100%
  if (percentuale >= 80) return 'distinto';    // 80-89%
  if (percentuale >= 70) return 'buono';       // 70-79%
  if (percentuale >= 60) return 'discreto';    // 60-69%
  if (percentuale >= 50) return 'sufficiente'; // 50-59% (metà risposte)
  return 'non-sufficiente';
}