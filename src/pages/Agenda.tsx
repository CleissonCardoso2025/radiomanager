import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/agenda/Footer';
import TestimonialList from '@/components/agenda/TestimonialList';
import { useMarkAsRead } from '@/hooks/useMarkAsRead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Definição da interface ContentItem
interface ContentItem {
  id: string;
  titulo?: string;
  conteudo?: string;
  horario_programado?: string;
  horario_agendado?: string;
  data_programada?: string;
  data_inicio?: string;
  data_fim?: string;
  programa_id?: string;
  status?: string;
  recorrente?: boolean;
  lido_por?: string[];
  created_at?: string;
  [key: string]: any; // Para outras propriedades que possam existir
}

const Agenda: React.FC = () => {
  const [conteudos, setConteudos] = useState<ContentItem[]>([]);
  const [testemunhais, setTestemunhais] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Função utilitária para garantir datas no timezone local
  function getLocalDateString(date = new Date()) {
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().split('T')[0];
  }

  // Busca conteúdos do dia
  const fetchConteudos = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = getLocalDateString();
      const { data, error } = await supabase
        .from('conteudos_produzidos')
        .select('*')
        .eq('data_programada', today)
        .order('horario_programado', { ascending: true });

      if (error) {
        console.error('Erro ao carregar conteúdos:', error.message);
        toast.error(`Erro ao carregar conteúdos: ${error.message}`);
        setConteudos([]);
        return;
      }
      setConteudos(data || []);
    } catch (err) {
      toast.error('Erro ao carregar conteúdos');
      setConteudos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca testemunhais do dia
  const fetchTestemunhais = useCallback(async () => {
    try {
      const today = getLocalDateString();
      const { data, error } = await supabase
        .from('testemunhais')
        .select('*')
        .lte('data_inicio', today)
        .gte('data_fim', today)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar testemunhais:', error.message);
        toast.error(`Erro ao carregar testemunhais: ${error.message}`);
        setTestemunhais([]);
        return;
      }
      setTestemunhais(data || []);
    } catch (err) {
      toast.error('Erro ao carregar testemunhais');
      setTestemunhais([]);
    }
  }, []);

  useEffect(() => {
    fetchConteudos();
    fetchTestemunhais();
  }, [fetchConteudos, fetchTestemunhais]);

  // Atualização manual (botão)
  const handleRefresh = () => {
    fetchConteudos();
    fetchTestemunhais();
  };

  // --- Filtrar apenas itens dentro da janela do programa atribuído ---
  const [programas, setProgramas] = useState<any[]>([]);
  useEffect(() => {
    const fetchProgramas = async () => {
      const today = getLocalDateString();
      const now = new Date();
      const weekDay = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
      // Buscar programas ativos para o dia da semana
      const { data, error } = await supabase
        .from('programas')
        .select('*');
      if (!error && data) {
        // Filtrar programas ativos para hoje
        const ativosHoje = data.filter((p: any) => {
          if (!Array.isArray(p.dias)) return false;
          return p.dias.map((d: string) => d.normalize('NFD').replace(/[ -]/g, '').toLowerCase()).includes(weekDay.normalize('NFD').replace(/[ -]/g, '').toLowerCase());
        });
        setProgramas(ativosHoje);
      }
    };
    fetchProgramas();
  }, []);

  // Função para verificar se um item está na janela do programa e não foi lido hoje
  function isInProgramWindow(item: any) {
    // Verificar se o item foi lido
    if (item.status === 'lido') {
      // Se o item for recorrente, ainda mostrar mesmo se já foi lido
      if (!item.recorrente) {
        return false; // Item lido e não recorrente - não mostrar
      }
    }
    
    // Para testemunhais (que têm data_inicio e data_fim), não exigir programa_id
    const isTesemunhal = item.data_inicio && item.data_fim;
    if (isTesemunhal) {
      return true; // Mostrar todos os testemunhais válidos
    }
    
    // Para conteúdos, verificar se está na janela do programa
    if (!item.programa_id || !programas.length) return false;
    const programa = programas.find(p => p.id === item.programa_id);
    if (!programa) return false;
    
    // Horário atual
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // 'HH:MM'
    
    // Considerar horario_inicio e horario_fim no formato 'HH:MM'
    return (
      currentTime >= (programa.horario_inicio || '00:00') &&
      currentTime <= (programa.horario_fim || '23:59')
    );
  }

  // Filtrar itens da agenda
  const itensAgenda = [...conteudos, ...testemunhais]
    .filter(isInProgramWindow)
    .sort((a, b) => {
      // Priorizar horario_agendado (testemunhais) ou horario_programado (conteudos)
      const horaA = a.horario_agendado || a.horario_programado || '';
      const horaB = b.horario_agendado || b.horario_programado || '';
      return horaA.localeCompare(horaB);
    });

  // Usar o hook useMarkAsRead para marcar itens como lidos
  const { markAsRead, isMarkingAsRead } = useMarkAsRead();

  // Função para marcar um item como lido
  const handleMarkAsRead = async (id: string, tipo: string = 'testemunhal') => {
    const success = await markAsRead(id, tipo);
    if (success) {
      // Atualizar a lista de itens após marcar como lido
      if (tipo === 'testemunhal') {
        setTestemunhais(prev => prev.map(item => 
          item.id === id ? { ...item, status: 'lido' } : item
        ));
      } else if (tipo === 'conteudo') {
        setConteudos(prev => prev.map(item => 
          item.id === id ? { ...item, status: 'lido' } : item
        ));
      }
      // Reproduzir som de confirmação em dispositivos móveis
      if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.userAgent.match(/Mobile/)) {
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(e => console.log('Erro ao reproduzir som:', e));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-6">
        <button onClick={handleRefresh} className="mb-4 px-4 py-2 bg-primary text-white rounded">
          Atualizar Agenda
        </button>
        <TestimonialList
          testimonials={itensAgenda}
          isLoading={isLoading}
          onMarkAsRead={handleMarkAsRead}
          isPending={isMarkingAsRead}
          onRefresh={handleRefresh}
        />
        <Footer />
      </div>
    </div>
  );
};

export default Agenda;
