
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, Search, Bell, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Agenda: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const today = new Date();
  const queryClient = useQueryClient();
  
  // Fetch testemunhais data from Supabase for today
  const { data: testemunhais = [], isLoading } = useQuery({
    queryKey: ['testemunhais-agenda', format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
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
      
      // Filter by today's day of week
      const dayOfWeek = format(today, 'EEEE', { locale: ptBR });
      
      return data.filter(t => {
        // Check if the testemunhal's program has today's day in its days array
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

  // Calculate notification count for the Header component
  const notificationCount = testemunhais.filter(t => 
    t.status === 'pendente' || t.status === 'atrasado'
  ).length;

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

  // Filter out already read testimonials and apply search filter
  const filteredTestemunhais = testemunhais
    .filter(t => t.status !== 'lido') // Remove read items from display
    .filter(t => 
      t.patrocinador.toLowerCase().includes(searchText.toLowerCase())
    );

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

  const exit = {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header notificationCount={notificationCount} />
      
      {/* Cabeçalho da página */}
      <div className="bg-white shadow-sm border-b">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2">
                <User className="text-white h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Agenda Diária</h2>
                <p className="text-muted-foreground">
                  {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="container px-4 py-4">
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
      <div className="container px-4 pb-8 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <AnimatePresence>
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
                  <p className="text-lg text-muted-foreground">Não há testemunhais pendentes para hoje</p>
                  <p className="text-sm text-muted-foreground mt-2">Todos os testemunhais foram lidos ou não há agendamentos para hoje</p>
                </motion.div>
              ) : (
                filteredTestemunhais.map((testemunhal) => (
                  <AnimatePresence key={testemunhal.id} mode="wait">
                    <motion.div 
                      key={testemunhal.id}
                      variants={item}
                      exit={exit}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card className={cn(
                        "overflow-hidden hover:shadow-lg transition-all", 
                        getRandomGradient()
                      )}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-3">
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
                              <div className="text-muted-foreground mb-4 sm:mb-0">
                                {testemunhal.texto}
                              </div>
                            </div>
                            <div className="w-full sm:w-auto">
                              {testemunhal.status !== 'lido' && (
                                <Button
                                  className="w-full sm:w-auto gap-2 animate-pulse hover:animate-none"
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
                  </AnimatePresence>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Rodapé */}
      <div className="bg-white border-t mt-auto">
        <div className="container px-4 py-3">
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
