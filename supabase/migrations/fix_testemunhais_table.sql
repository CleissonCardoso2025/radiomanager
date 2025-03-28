-- Garantir que a tabela testemunhais tenha todos os campos necessários
-- e que eles estejam com os tipos corretos

-- Verificar se a tabela existe e criar se não existir
DO $$
BEGIN
  -- Adicionar as colunas recorrente e lido_por se elas não existirem
  BEGIN
    ALTER TABLE public.testemunhais 
    ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS lido_por UUID[] DEFAULT '{}';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao adicionar colunas: %', SQLERRM;
  END;
END
$$;

-- Criar ou atualizar o trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger se ele não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_testemunhais'
  ) THEN
    CREATE TRIGGER set_timestamp_testemunhais
    BEFORE UPDATE ON public.testemunhais
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Criar índice para melhorar a performance das consultas por horário
CREATE INDEX IF NOT EXISTS idx_testemunhais_horario
ON public.testemunhais (horario_agendado);

-- Comentários para documentação
COMMENT ON COLUMN public.testemunhais.recorrente IS 'Indica se o testemunhal é recorrente';
COMMENT ON COLUMN public.testemunhais.lido_por IS 'Array de UUIDs dos usuários que já leram este testemunhal';
