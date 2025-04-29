
export interface ContentItem {
  id: string;
  conteudo?: string;
  texto?: string;
  nome?: string;
  patrocinador?: string;
  horario_programado?: string;
  horario_agendado?: string;
  data_programada?: string;
  data_fim?: string | null;
  programa_id?: string;
  programas?: {
    id?: string;
    nome?: string;
    apresentador?: string;
    dias?: string[];
    horario_inicio?: string;
    horario_fim?: string;
  };
  status?: string;
  lido_por?: string[];
  recorrente?: boolean;
  isUpcoming?: boolean;
  minutesUntil?: number;
  tipo?: 'conteudo' | 'testemunhal';
}

export interface Program {
  id: string;
  nome: string;
  apresentador: string;
  horario_inicio: string;
  horario_fim: string;
  dias: string[];
  status?: string;
}
