
-- Criar políticas de segurança para a tabela user_roles
-- Esta migração adiciona políticas RLS (Row Level Security) para permitir operações na tabela user_roles

-- Habilitar RLS na tabela user_roles (caso ainda não esteja habilitado)
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados" 
ON public.user_roles FOR SELECT 
TO authenticated 
USING (true);

-- Política para permitir INSERT para usuários autenticados
CREATE POLICY "Permitir INSERT para usuários autenticados" 
ON public.user_roles FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir UPDATE para usuários autenticados" 
ON public.user_roles FOR UPDATE 
TO authenticated 
USING (true);

-- Política para permitir DELETE para usuários autenticados
CREATE POLICY "Permitir DELETE para usuários autenticados" 
ON public.user_roles FOR DELETE 
TO authenticated 
USING (true);

-- Garantir que o serviço possa acessar a tabela
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.user_roles TO postgres;
GRANT ALL ON public.user_roles TO anon;
GRANT ALL ON public.user_roles TO authenticated;
