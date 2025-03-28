-- Garantir que a tabela conteudos_produzidos tenha todos os campos necessários
-- e que eles estejam com os tipos corretos

-- Verificar se a tabela existe e criar se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conteudos_produzidos') THEN
    CREATE TABLE public.conteudos_produzidos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nome TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      programa_id UUID REFERENCES public.programas(id),
      data_programada DATE NOT NULL,
      horario_programado TIME NOT NULL,
      status TEXT DEFAULT 'pendente',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      recorrente BOOLEAN DEFAULT FALSE,
      lido_por UUID[] DEFAULT '{}'
    );
    
    -- Adicionar comentários para documentação
    COMMENT ON TABLE public.conteudos_produzidos IS 'Tabela de conteúdos produzidos para a rádio';
    COMMENT ON COLUMN public.conteudos_produzidos.recorrente IS 'Indica se o conteúdo é recorrente';
    COMMENT ON COLUMN public.conteudos_produzidos.lido_por IS 'Array de UUIDs dos usuários que já leram este conteúdo';
  ELSE
    -- Garantir que as colunas recorrente e lido_por existam
    BEGIN
      ALTER TABLE public.conteudos_produzidos 
      ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS lido_por UUID[] DEFAULT '{}';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Erro ao adicionar colunas: %', SQLERRM;
    END;
  END IF;
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
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_conteudos_produzidos'
  ) THEN
    CREATE TRIGGER set_timestamp_conteudos_produzidos
    BEFORE UPDATE ON public.conteudos_produzidos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END
$$;

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_conteudos_produzidos_data_horario
ON public.conteudos_produzidos (data_programada, horario_programado);

-- Garantir que as políticas de segurança estejam configuradas
ALTER TABLE public.conteudos_produzidos ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conteudos_produzidos' AND policyname = 'Enable read access for all authenticated users'
  ) THEN
    CREATE POLICY "Enable read access for all authenticated users"
    ON public.conteudos_produzidos FOR SELECT 
    USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- Política para permitir inserção para usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conteudos_produzidos' AND policyname = 'Enable insert for authenticated users only'
  ) THEN
    CREATE POLICY "Enable insert for authenticated users only"
    ON public.conteudos_produzidos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END
$$;

-- Política para permitir atualização para usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conteudos_produzidos' AND policyname = 'Enable update for authenticated users only'
  ) THEN
    CREATE POLICY "Enable update for authenticated users only"
    ON public.conteudos_produzidos FOR UPDATE 
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END
$$;

-- Política para permitir exclusão para usuários autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conteudos_produzidos' AND policyname = 'Enable delete for authenticated users only'
  ) THEN
    CREATE POLICY "Enable delete for authenticated users only"
    ON public.conteudos_produzidos FOR DELETE 
    USING (auth.role() = 'authenticated');
  END IF;
END
$$;
