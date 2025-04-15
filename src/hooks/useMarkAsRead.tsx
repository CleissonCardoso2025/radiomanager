
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
      
      // Primeiro, vamos verificar o estado atual do array lido_por
      const { data: currentItem, error: fetchError } = await supabase
        .from(tableName)
        .select('lido_por')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Erro ao buscar item:', fetchError);
        toast.error('Erro ao buscar item', {
          description: fetchError.message
        });
        setIsMarkingAsRead(false);
        return false;
      }
      
      // Verificar se temos dados e então acessar lido_por
      if (!currentItem) {
        console.error('Item não encontrado');
        toast.error('Item não encontrado');
        setIsMarkingAsRead(false);
        return false;
      }
      
      // Criar um novo array com o ID do usuário, se ele ainda não estiver presente
      const currentLidoPor = currentItem.lido_por || [];
      if (!currentLidoPor.includes(user.id)) {
        currentLidoPor.push(user.id);
      }
      
      // Atualizar o registro com o novo array
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          lido_por: currentLidoPor,
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
