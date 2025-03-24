-- Adicionar campo de recorrência à tabela conteudos_produzidos
ALTER TABLE public.conteudos_produzidos 
ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lido_por UUID[] DEFAULT '{}';

-- Atualizar a função de trigger para manter o array lido_por
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
