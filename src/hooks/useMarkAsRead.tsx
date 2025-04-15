
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isToday, parseISO } from 'date-fns';

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
      
      // Verificar se o item já existe e seu status atual
      const { data: currentItem, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Erro ao buscar item:', fetchError);
        toast.error('Erro ao verificar status do item');
        setIsMarkingAsRead(false);
        return false;
      }

      // Verificar se o item já foi lido por este usuário hoje
      // Fazer uma verificação de tipo antes de acessar as propriedades
      const lidoPorArray = currentItem && Array.isArray(currentItem.lido_por) 
        ? currentItem.lido_por 
        : [];
        
      const timestampLeitura = currentItem && currentItem.timestamp_leitura 
        ? parseISO(currentItem.timestamp_leitura) 
        : null;
      
      // Se o item foi lido por este usuário e foi hoje, não marcar novamente
      if (lidoPorArray.includes(user.id) && timestampLeitura && isToday(timestampLeitura)) {
        console.log(`Item ${id} já foi lido por ${user.id} hoje`);
        toast.info('Este item já foi marcado como lido hoje');
        setIsMarkingAsRead(false);
        return true; // Retornar true porque o item já está no estado desejado
      }
      
      // Atualizar o registro adicionando o ID do usuário ao array lido_por
      // e atualizando o timestamp de leitura para o dia atual
      const timestamp = new Date().toISOString();
      
      // Construir o array lido_por atualizado (sem duplicar o ID do usuário)
      const updatedLidoPor = lidoPorArray.includes(user.id) 
        ? lidoPorArray 
        : [...lidoPorArray, user.id];
      
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ 
          lido_por: updatedLidoPor,
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
