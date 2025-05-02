import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast"

interface Testimonial {
  id: string;
  texto: string;
  horario_agendado: string;
  programa_id: string;
  status: 'pendente' | 'lido' | 'arquivado';
  created_at: string;
  updated_at: string;
}

interface Program {
  id: string;
  nome: string;
  horario_inicio: string;
  horario_fim: string;
  dia_semana: string;
  created_at: string;
}

const getCurrentTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getCurrentDay = (): string => {
  const daysOfWeek = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const now = new Date();
  return daysOfWeek[now.getDay()];
};

export const useTestimonialProcessor = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const { data: testimonialsData, error: testimonialsError } = await supabase
          .from('testemunhais')
          .select('*');

        if (testimonialsError) {
          console.error('Erro ao buscar testemunhais:', testimonialsError);
        } else if (testimonialsData) {
          setTestimonials(testimonialsData);
        }

        const { data: programsData, error: programsError } = await supabase
          .from('programas')
          .select('*');

        if (programsError) {
          console.error('Erro ao buscar programas:', programsError);
        } else if (programsData) {
          setPrograms(programsData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const processTestimonials = (testimonials: any[] = [], programs: any[] = [], currentTime: string, currentDay: string) => {
    const processedItems: any[] = [];

    testimonials.forEach(testimonial => {
      const program = programs.find(p => p.id === testimonial.programa_id);

      if (program) {
        const [programStartHour, programStartMinute] = program.horario_inicio.split(':').map(Number);
        const [programEndHour, programEndMinute] = program.horario_fim.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);

        const programStartTime = new Date();
        programStartTime.setHours(programStartHour, programStartMinute, 0, 0);

        const programEndTime = new Date();
        programEndTime.setHours(programEndHour, programEndMinute, 0, 0);

        const nowTime = new Date();
        nowTime.setHours(currentHour, currentMinute, 0, 0);

        const isSameDay = program.dia_semana === currentDay;
        const isBetween = nowTime >= programStartTime && nowTime <= programEndTime;

        if (isSameDay && isBetween) {
          processedItems.push({
            ...testimonial,
            programName: program.nome
          });
        }
      }
    });

    if (processedItems.length === 0) {
      console.log('Nenhum testemunhal encontrado para o horário atual:', currentTime);
      toast.success('Verificação concluída', {
        description: 'Não há testemunhais para o horário atual.'
      });
      return [];
    }

    console.log('Testemunhais processados:', processedItems);
    return processedItems;
  };

  const updateTestimonialStatus = async (id: string, status: 'pendente' | 'lido' | 'arquivado') => {
    try {
      const { error } = await supabase
        .from('testemunhais')
        .update({ status })
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar o status do testemunhal:', error);
        toast({
          variant: "destructive",
          title: "Erro!",
          description: "Erro ao atualizar o status do testemunhal."
        })
      } else {
        setTestimonials(prevTestimonials =>
          prevTestimonials.map(testimonial =>
            testimonial.id === id ? { ...testimonial, status } : testimonial
          )
        );
        toast({
          title: "Sucesso!",
          description: "Status do testemunhal atualizado com sucesso."
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar o status do testemunhal:', error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Erro ao atualizar o status do testemunhal."
      })
    }
  };

  return {
    testimonials,
    programs,
    isLoading,
    processTestimonials,
    updateTestimonialStatus,
    getCurrentTime,
    getCurrentDay
  };
};
