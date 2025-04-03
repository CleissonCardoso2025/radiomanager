
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isMobileDevice, playNotificationSound } from '@/services/notificationService';

export function useMarkAsRead() {
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const markAsRead = async (id: string, tipo: string = 'testemunhal') => {
    setIsMarkingAsRead(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('Usuário não autenticado');
        setIsMarkingAsRead(false);
        return false;
      }
      
      if (tipo === 'testemunhal') {
        const { data: testemunhalData, error: testemunhalError } = await supabase
          .from('testemunhais')
          .select('recorrente, lido_por')
          .eq('id', id)
          .single();
          
        if (testemunhalError) throw testemunhalError;
        
        let lido_por = [];
        
        if (testemunhalData.lido_por && Array.isArray(testemunhalData.lido_por)) {
          lido_por = [...testemunhalData.lido_por];
          if (!lido_por.includes(user.id)) {
            lido_por.push(user.id);
          }
        } else {
          lido_por = [user.id];
        }
        
        const { data, error } = await supabase
          .from('testemunhais')
          .update({ 
            status: 'lido',
            lido_por: lido_por,
            timestamp_leitura: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) throw error;
        
        if (isMobileDevice()) {
          playNotificationSound('success');
        }
        
        toast.success('Testemunhal marcado como lido', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        
        return testemunhalData.recorrente ? 'recorrente' : true;
      } else if (tipo === 'conteudo') {
        console.log(`Marcando conteúdo ${id} como lido`);
        
        const { data: conteudoData, error: conteudoError } = await supabase
          .from('conteudos_produzidos')
          .select('recorrente, lido_por')
          .eq('id', id)
          .single();
          
        if (conteudoError) {
          console.error('Erro ao buscar dados do conteúdo:', conteudoError);
          throw conteudoError;
        }
        
        console.log('Dados do conteúdo recuperados:', conteudoData);
        
        let lido_por = [];
        
        if (conteudoData && conteudoData.lido_por && Array.isArray(conteudoData.lido_por)) {
          lido_por = [...conteudoData.lido_por];
          if (!lido_por.includes(user.id)) {
            lido_por.push(user.id);
          }
        } else {
          lido_por = [user.id];
        }
        
        console.log(`Atualizando conteúdo ${id} com lido_por:`, lido_por);
        
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .update({ 
            status: 'lido',
            lido_por: lido_por,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) {
          console.error('Erro ao atualizar conteúdo:', error);
          throw error;
        }
        
        if (isMobileDevice()) {
          playNotificationSound('success');
        }
        
        toast.success('Conteúdo marcado como lido', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        
        console.log('Conteúdo atualizado, recorrente:', conteudoData && conteudoData.recorrente);
        return conteudoData && conteudoData.recorrente ? 'recorrente' : true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
      toast.error('Erro ao marcar como lido', {
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return false;
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  return { markAsRead, isMarkingAsRead };
}
