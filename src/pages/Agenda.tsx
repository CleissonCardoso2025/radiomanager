
import React, { useState } from 'react';
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

const Agenda: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const queryClient = useQueryClient();
  
  // Fetch testemunhais data from Supabase
  const { data: testemunhais = [], isLoading } = useQuery({
    queryKey: ['testemunhais-agenda'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testemunhais')
        .select('*, programas(nome)')
        .order('horario_agendado', { ascending: true });
      
      if (error) {
        toast.error('Erro ao carregar testemunhais', {
          description: error.message,
        });
        return [];
      }
      
      return data;
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header notificationCount={notificationCount} />
      
      {/* Cabeçalho da página */}
      <div className="bg-white shadow-sm border-b">
        <div className="container px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary rounded-full p-2">
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

      {/* Resumo de status */}
      <div className="container px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">{testemunhais.length}</h3>
                <p className="text-muted-foreground">Total de Testemunhais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-yellow-500">{pendentesCount}</h3>
                <p className="text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-red-500">{atrasadosCount}</h3>
                <p className="text-muted-foreground">Atrasados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-green-500">
                  {testemunhais.filter(t => t.status === 'lido').length}
                </h3>
                <p className="text-muted-foreground">Concluídos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Busca */}
      <div className="container px-6 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por patrocinador..."
            className="pl-10"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Testemunhais */}
      <div className="container px-6 pb-8 flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-muted-foreground">Carregando testemunhais...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTestemunhais.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground">Nenhum testemunhal encontrado</p>
              </div>
            ) : (
              filteredTestemunhais.map((testemunhal) => (
                <Card 
                  key={testemunhal.id}
                  className="hover:shadow-md transition-shadow"
                >
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
                            className="gap-2"
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
              ))
            )}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="bg-white border-t mt-auto">
        <div className="container px-6 py-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
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
