-- Adiciona a coluna 'recorrente' à tabela 'testemunhais'
ALTER TABLE testemunhais
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE;

-- Adiciona a coluna 'lido_por' à tabela 'testemunhais'
ALTER TABLE testemunhais
ADD COLUMN IF NOT EXISTS lido_por UUID[] DEFAULT '{}';

-- Cria ou substitui a função de trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cria o trigger se ele não existir
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
END
$$;
