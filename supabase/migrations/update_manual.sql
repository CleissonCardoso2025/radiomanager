-- Script SQL para atualização manual do banco de dados
-- Execute este script diretamente no console SQL do Supabase

-- 1. Atualização da tabela testemunhais
-- Adiciona a coluna 'recorrente' se não existir
ALTER TABLE testemunhais 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE;

-- Adiciona a coluna 'lido_por' se não existir
ALTER TABLE testemunhais 
ADD COLUMN IF NOT EXISTS lido_por UUID[] DEFAULT '{}';

-- Cria índice para melhorar a performance das consultas por horário
CREATE INDEX IF NOT EXISTS idx_testemunhais_horario
ON testemunhais (horario_agendado);

-- 2. Atualização da tabela conteudos_produzidos
-- Adiciona a coluna 'recorrente' se não existir
ALTER TABLE conteudos_produzidos 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE;

-- Adiciona a coluna 'lido_por' se não existir
ALTER TABLE conteudos_produzidos 
ADD COLUMN IF NOT EXISTS lido_por UUID[] DEFAULT '{}';

-- Cria índice para melhorar a performance das consultas por data
CREATE INDEX IF NOT EXISTS idx_conteudos_data
ON conteudos_produzidos (data_programada);

-- 3. Atualização dos triggers para manter o campo updated_at atualizado
-- Cria ou substitui a função de trigger
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria os triggers se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_testemunhais'
  ) THEN
    CREATE TRIGGER set_timestamp_testemunhais
    BEFORE UPDATE ON testemunhais
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_conteudos'
  ) THEN
    CREATE TRIGGER set_timestamp_conteudos
    BEFORE UPDATE ON conteudos_produzidos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Comentários para documentação
COMMENT ON COLUMN testemunhais.recorrente IS 'Indica se o testemunhal é recorrente';
COMMENT ON COLUMN testemunhais.lido_por IS 'Array de UUIDs dos usuários que já leram este testemunhal';
COMMENT ON COLUMN conteudos_produzidos.recorrente IS 'Indica se o conteúdo é recorrente';
COMMENT ON COLUMN conteudos_produzidos.lido_por IS 'Array de UUIDs dos usuários que já leram este conteúdo';
