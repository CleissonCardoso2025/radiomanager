-- Criar a tabela conteudos_produzidos
CREATE TABLE IF NOT EXISTS public.conteudos_produzidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  programa_id UUID REFERENCES public.programas(id),
  data_programada DATE NOT NULL,
  horario_programado TIME NOT NULL,
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar permissões RLS (Row Level Security)
ALTER TABLE public.conteudos_produzidos ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Permitir leitura para todos os usuários autenticados" 
ON public.conteudos_produzidos FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir inserção para todos os usuários autenticados" 
ON public.conteudos_produzidos FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos os usuários autenticados" 
ON public.conteudos_produzidos FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Permitir exclusão para todos os usuários autenticados" 
ON public.conteudos_produzidos FOR DELETE 
TO authenticated 
USING (true);

-- Adicionar função de trigger para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.conteudos_produzidos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
