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
        const { data, error } = await supabase
          .from('testemunhais')
          .update({ 
            status: 'lido',
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
        
        return true;
      } else if (tipo === 'conteudo') {
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .update({ 
            status: 'lido',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select();
          
        if (error) throw error;
        
        if (isMobileDevice()) {
          playNotificationSound('success');
        }
        
        toast.success('Conteúdo marcado como lido', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        
        return true;
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
