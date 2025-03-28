-- Adiciona um índice para melhorar a performance das consultas por horário agendado
CREATE INDEX IF NOT EXISTS idx_testemunhais_horario_agendado
ON testemunhais (horario_agendado);

-- Adiciona um comentário à coluna horario_agendado para documentar seu uso
COMMENT ON COLUMN testemunhais.horario_agendado IS 'Horário agendado para o testemunhal no formato HH:MM. Os testemunhais são exibidos apenas 30 minutos antes deste horário.';

-- Adiciona um comentário à coluna recorrente para documentar seu uso
COMMENT ON COLUMN testemunhais.recorrente IS 'Indica se o testemunhal é recorrente. Mesmo que seja recorrente, só aparecerá 30 minutos antes do horário agendado e será removido quando marcado como lido.';

-- Adiciona um comentário à coluna lido_por para documentar seu uso
COMMENT ON COLUMN testemunhais.lido_por IS 'Array de UUIDs dos usuários que já leram este testemunhal. Usado para filtrar testemunhais já lidos pelo usuário atual.';
