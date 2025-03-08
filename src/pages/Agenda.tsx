
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Check, Clock, Search, Bell, User, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const Agenda: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  
  // Fetch testemunhais data from Supabase
  const { data: testemunhais = [], isLoading } = useQuery({
    queryKey: ['testemunhais-agenda', selectedDate],
    queryFn: async () => {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('testemunhais')
        .select('*, programas(nome, dias)')
        .order('horario_agendado', { ascending: true });
      
      if (error) {
        toast.error('Erro ao carregar testemunhais', {
          description: error.message,
        });
        return [];
      }
      
      // Filter by selected day of week
      const dayOfWeek = format(selectedDate, 'EEEE', { locale: ptBR });
      
      return data.filter(t => {
        // Check if the testemunhal's program has the selected day in its days array
        const programDays = t.programas?.dias || [];
        return programDays.some((day: string) => 
          day.toLowerCase() === dayOfWeek.toLowerCase()
        );
      });
    }
  });

  // Mutation to mark a testemunhal as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('testemunhais')
        .update({ 
          status: 'lido',
          timestamp_leitura: new Date().toISOString()
        })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testemunhais-agenda'] });
      toast.success('Testemunhal marcado como lido');
    },
    onError: (error) => {
      toast.error('Erro ao marcar testemunhal como lido', {
        description: error.message,
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lido':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'atrasado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return '';
    }
  };

  const getRandomGradient = () => {
    const gradients = [
      'bg-gradient-to-r from-pink-100 to-purple-100',
      'bg-gradient-to-r from-blue-100 to-teal-100',
      'bg-gradient-to-r from-yellow-100 to-orange-100',
      'bg-gradient-to-r from-green-100 to-teal-100',
      'bg-gradient-to-r from-indigo-100 to-purple-100',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'lido':
        return 'Lido';
      case 'atrasado':
        return 'Atrasado';
      case 'pendente':
        return 'Pendente';
      default:
        return '';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const filteredTestemunhais = testemunhais.filter(t => 
    t.patrocinador.toLowerCase().includes(searchText.toLowerCase())
  );

  const pendentesCount = testemunhais.filter(t => t.status === 'pendente').length;
  const atrasadosCount = testemunhais.filter(t => t.status === 'atrasado').length;
  const notificationCount = pendentesCount + atrasadosCount;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header notificationCount={notificationCount} />
      
      {/* Cabeçalho da página */}
      <div className="bg-white shadow-sm border-b">
        <div className="container px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
                <User className="text-white h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Carlos Roberto Silva</h2>
                <p className="text-muted-foreground">Locutor Principal</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seletor de data e Calendário */}
      <div className="container px-6 py-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Selecione uma data:</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-4 rounded-lg shadow"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                locale={ptBR}
              />
            </motion.div>
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg shadow p-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">{testemunhais.length}</h3>
                    <p className="text-muted-foreground">Total de Testemunhais</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg shadow p-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-yellow-700">{pendentesCount}</h3>
                    <p className="text-muted-foreground">Pendentes</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="bg-gradient-to-r from-red-100 to-red-200 rounded-lg shadow p-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-red-700">{atrasadosCount}</h3>
                    <p className="text-muted-foreground">Atrasados</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg shadow p-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-green-700">
                      {testemunhais.filter(t => t.status === 'lido').length}
                    </h3>
                    <p className="text-muted-foreground">Concluídos</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="container px-6 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por patrocinador..."
            className="pl-10 bg-white shadow-sm transition-all focus:shadow"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Testemunhais */}
      <div className="container px-6 pb-8 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {filteredTestemunhais.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <p className="text-lg text-muted-foreground">Nenhum testemunhal encontrado para esta data e filtro</p>
                <p className="text-sm text-muted-foreground mt-2">Tente selecionar outra data ou ajustar sua busca</p>
              </motion.div>
            ) : (
              filteredTestemunhais.map((testemunhal, index) => (
                <motion.div 
                  key={testemunhal.id}
                  variants={item}
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className={cn(
                    "overflow-hidden hover:shadow-lg transition-all", 
                    getRandomGradient()
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <Badge variant="outline" className={getStatusColor(testemunhal.status)}>
                              {getStatusText(testemunhal.status)}
                            </Badge>
                            <span className="text-muted-foreground flex items-center">
                              <Clock className="mr-1 h-4 w-4" />
                              {testemunhal.horario_agendado.slice(0, 5)}
                            </span>
                            <Badge className="bg-primary/20 text-primary border-primary/30">
                              {testemunhal.programas?.nome || "Sem programa"}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{testemunhal.patrocinador}</h3>
                          <div className="text-muted-foreground">
                            {testemunhal.texto}
                          </div>
                          {testemunhal.timestamp_leitura && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              Lido às {new Date(testemunhal.timestamp_leitura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {testemunhal.status !== 'lido' && (
                            <Button
                              className="gap-2 animate-pulse hover:animate-none"
                              onClick={() => handleMarkAsRead(testemunhal.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="h-4 w-4" />
                              {markAsReadMutation.isPending ? 'Processando...' : 'Marcar como Lido'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* Rodapé */}
      <div className="bg-white border-t mt-auto">
        <div className="container px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground">
            <div>
              Última atualização: {format(new Date(), 'HH:mm')}
            </div>
            <div>
              Suporte técnico: (11) 4002-8922
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;
