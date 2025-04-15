
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useMarkAsRead() {
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const markAsRead = async (id: string, tipo: string = 'testemunhal') => {
    try {
      setIsMarkingAsRead(true);
      
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        toast.error('Você precisa estar logado para marcar itens como lidos');
        setIsMarkingAsRead(false);
        return false;
      }
      
      console.log(`Marcando ${tipo} ${id} como lido por ${user.id}`);
      
      let tableName;
      if (tipo === 'testemunhal') {
        tableName = 'testemunhais';
      } else if (tipo === 'conteudo') {
        tableName = 'conteudos_produzidos';
      } else {
        console.error('Tipo inválido:', tipo);
        toast.error('Tipo inválido');
        setIsMarkingAsRead(false);
        return false;
      }
      
      // Atualizar o registro adicionando o ID do usuário ao array lido_por
      // e atualizando o timestamp de leitura
      const timestamp = new Date().toISOString();
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          lido_por: supabase.sql`array_append(lido_por, ${user.id})`,
          status: 'lido',
          timestamp_leitura: timestamp
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Erro ao atualizar:', updateError);
        toast.error('Erro ao marcar como lido', {
          description: updateError.message
        });
        setIsMarkingAsRead(false);
        return false;
      }
      
      // Notificar sucesso
      toast.success(`${tipo === 'testemunhal' ? 'Testemunhal' : 'Conteúdo'} marcado como lido`);
      
      setIsMarkingAsRead(false);
      return true;
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
      toast.error('Erro ao marcar como lido');
      setIsMarkingAsRead(false);
      return false;
    }
  };

  return { markAsRead, isMarkingAsRead };
}
