
import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BadgeCheck, Calendar, CalendarDays, Clock, Pencil, Plus, Repeat, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Programa {
  id: string;
  nome: string;
  horario_inicio: string;
  horario_fim: string;
  apresentador: string;
  status: string;
  created_at: string;
  updated_at: string;
  dias: string[];
}

interface Testemunhal {
  id: string;
  patrocinador: string;
  texto: string;
  horario_agendado: string;
  programa_id: string;
  status: string;
  timestamp_leitura: string;
  created_at: string;
  updated_at: string;
  programas: { nome: string };
  leituras: number;
}

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const GerenciamentoProgramas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('programas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [modalType, setModalType] = useState<'programa' | 'testemunhal'>('programa');
  const [selectedItem, setSelectedItem] = useState<Programa | Testemunhal | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    nome: '',
    horario_inicio: '',
    horario_fim: '',
    dias: [],
    apresentador: '',
    texto: '',
    patrocinador: '',
    leituras: 1,
    intervalo: 30,
    programa_id: '',
    distribuir_automaticamente: true,
  });

  const { data: programas = [] } = useQuery<Programa[]>({
    queryKey: ['programas-gerenciamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programas')
        .select('*')
        .order('nome');
      
      if (error) {
        toast.error('Erro ao carregar programas', {
          description: error.message,
        });
        return [];
      }
      
      return data || [];
    },
  });

  const { data: testemunhais = [] } = useQuery<Testemunhal[]>({
    queryKey: ['testemunhais-gerenciamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testemunhais')
        .select('*, programas(nome)')
        .order('patrocinador');
      
      if (error) {
        toast.error('Erro ao carregar testemunhais', {
          description: error.message,
        });
        return [];
      }
      
      return data || [];
    },
  });

  // Função para converter horário no formato HH:MM para minutos desde meia-noite
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Função para converter minutos desde meia-noite para HH:MM
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Função para gerar horários distribuídos para as leituras
  const generateDistributedTimes = (
    startTime: string,
    endTime: string,
    count: number
  ): string[] => {
    // Converter horários para minutos
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    // Calcular duração total do programa em minutos
    const duration = endMinutes - startMinutes;
    
    if (duration <= 0 || count <= 0) return [];
    
    // Distribuir leituras uniformemente
    const times: string[] = [];
    
    if (count === 1) {
      // Se tiver apenas uma leitura, colocar no meio do programa
      const middleTime = Math.floor(startMinutes + duration / 2);
      times.push(minutesToTime(middleTime));
    } else {
      // Calcular intervalo entre leituras
      const interval = duration / (count + 1);
      
      // Gerar os horários distribuídos
      for (let i = 1; i <= count; i++) {
        // Adicionar uma variação aleatória de até 5 minutos para cada horário
        const baseTime = Math.floor(startMinutes + interval * i);
        const variation = Math.floor(Math.random() * 11) - 5; // -5 a +5 minutos
        const adjustedTime = Math.max(startMinutes, Math.min(endMinutes, baseTime + variation));
        
        times.push(minutesToTime(adjustedTime));
      }
      
      // Ordenar os horários
      times.sort();
    }
    
    return times;
  };

  const programaMutation = useMutation({
    mutationFn: async (programa: any) => {
      if (selectedItem) {
        const { data, error } = await supabase
          .from('programas')
          .update({
            nome: programa.nome,
            horario_inicio: programa.horario_inicio,
            horario_fim: programa.horario_fim,
            apresentador: programa.apresentador,
            dias: programa.dias,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedItem.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('programas')
          .insert({
            nome: programa.nome,
            horario_inicio: programa.horario_inicio,
            horario_fim: programa.horario_fim,
            apresentador: programa.apresentador,
            dias: programa.dias,
          })
          .select();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-gerenciamento'] });
      toast.success(
        selectedItem 
          ? 'Programa atualizado com sucesso!' 
          : 'Programa adicionado com sucesso!'
      );
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar programa', {
        description: error.message,
      });
    }
  });

  const testemunhalMutation = useMutation({
    mutationFn: async (testemunhal: any) => {
      // Buscar programa selecionado
      const programa = programas.find(p => p.id === testemunhal.programa_id);
      
      // Verificar se deve gerar horários aleatórios ou usar o horário específico
      let horarios: string[] = [];
      
      if (testemunhal.distribuir_automaticamente && programa) {
        horarios = generateDistributedTimes(
          programa.horario_inicio,
          programa.horario_fim,
          testemunhal.leituras
        );
      } else {
        // Usar o horário fornecido manualmente
        horarios = [testemunhal.horario_agendado];
      }
      
      if (selectedItem) {
        // Atualizar um testemunhal existente
        const { data, error } = await supabase
          .from('testemunhais')
          .update({
            patrocinador: testemunhal.patrocinador,
            texto: testemunhal.texto,
            horario_agendado: horarios[0] || testemunhal.horario_agendado,
            programa_id: testemunhal.programa_id,
            leituras: testemunhal.leituras,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedItem.id)
          .select();
          
        if (error) throw error;
        return data;
      } else {
        // Para novos testemunhais, criar múltiplas entradas se houver múltiplas leituras e distribuição automática
        if (testemunhal.distribuir_automaticamente && testemunhal.leituras > 1) {
          const inserts = horarios.map(horario => ({
            patrocinador: testemunhal.patrocinador,
            texto: testemunhal.texto,
            horario_agendado: horario,
            programa_id: testemunhal.programa_id,
            leituras: 1, // cada inserção representa uma leitura
            status: 'pendente',
          }));
          
          const { data, error } = await supabase
            .from('testemunhais')
            .insert(inserts)
            .select();
            
          if (error) throw error;
          return data;
        } else {
          // Inserir um único testemunhal com o número total de leituras
          const { data, error } = await supabase
            .from('testemunhais')
            .insert({
              patrocinador: testemunhal.patrocinador,
              texto: testemunhal.texto,
              horario_agendado: horarios[0] || testemunhal.horario_agendado,
              programa_id: testemunhal.programa_id,
              leituras: testemunhal.leituras,
              status: 'pendente',
            })
            .select();
            
          if (error) throw error;
          return data;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testemunhais-gerenciamento'] });
      toast.success(
        selectedItem 
          ? 'Testemunhal atualizado com sucesso!' 
          : 'Testemunhal adicionado com sucesso!'
      );
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao salvar testemunhal', {
        description: error.message,
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return null;
      
      const table = 'nome' in selectedItem ? 'programas' : 'testemunhais';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedItem.id);
        
      if (error) throw error;
      return null;
    },
    onSuccess: () => {
      if (selectedItem && 'nome' in selectedItem) {
        queryClient.invalidateQueries({ queryKey: ['programas-gerenciamento'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['testemunhais-gerenciamento'] });
      }
      toast.success('Item excluído com sucesso!');
      setIsAlertOpen(false);
    },
    onError: (error) => {
      toast.error('Erro ao excluir item', {
        description: error.message,
      });
    }
  });

  const handleAdd = (type: 'programa' | 'testemunhal') => {
    setModalType(type);
    setSelectedItem(null);
    setFormData({
      nome: '',
      horario_inicio: '',
      horario_fim: '',
      dias: [],
      apresentador: '',
      texto: '',
      patrocinador: '',
      horario_agendado: '',
      programa_id: '',
      leituras: 1,
      distribuir_automaticamente: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Programa | Testemunhal, type: 'programa' | 'testemunhal') => {
    setModalType(type);
    setSelectedItem(item);
    
    if (type === 'programa') {
      const programa = item as Programa;
      setFormData({
        nome: programa.nome,
        horario_inicio: programa.horario_inicio,
        horario_fim: programa.horario_fim,
        apresentador: programa.apresentador,
        dias: programa.dias || [],
      });
    } else {
      const testemunhal = item as Testemunhal;
      setFormData({
        texto: testemunhal.texto,
        patrocinador: testemunhal.patrocinador,
        horario_agendado: testemunhal.horario_agendado,
        programa_id: testemunhal.programa_id,
        leituras: testemunhal.leituras || 1,
        distribuir_automaticamente: false,
      });
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = (item: Programa | Testemunhal) => {
    setSelectedItem(item);
    setIsAlertOpen(true);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => {
      const currentDays = prev.dias || [];
      if (currentDays.includes(day)) {
        return { ...prev, dias: currentDays.filter((d: string) => d !== day) };
      } else {
        return { ...prev, dias: [...currentDays, day] };
      }
    });
  };

  const handleSave = () => {
    if (modalType === 'programa') {
      if (!formData.nome || !formData.horario_inicio || !formData.horario_fim || formData.dias.length === 0) {
        toast.error('Preencha todos os campos obrigatórios', {
          description: 'Nome, horário de início, horário de fim e dias da semana são obrigatórios.',
        });
        return;
      }
      programaMutation.mutate(formData);
    } else {
      if (!formData.patrocinador || !formData.texto || !formData.programa_id) {
        toast.error('Preencha todos os campos obrigatórios', {
          description: 'Patrocinador, texto e programa são obrigatórios.',
        });
        return;
      }
      
      // Se a distribuição automática estiver ativada, o horário agendado não é obrigatório
      if (!formData.distribuir_automaticamente && !formData.horario_agendado) {
        toast.error('Preencha o horário agendado ou utilize a distribuição automática', {
          description: 'É necessário definir um horário ou ativar a distribuição automática.',
        });
        return;
      }
      
      testemunhalMutation.mutate(formData);
    }
  };

  const notificationCount = Array.isArray(testemunhais) 
    ? testemunhais.filter(t => t.status === 'pendente' || t.status === 'atrasado').length 
    : 0;

  // Função para verificar se o horário de um testemunhal está dentro do horário do programa
  const isTimeWithinProgram = (programaId: string, horario: string): boolean => {
    const programa = programas.find(p => p.id === programaId);
    if (!programa) return false;
    
    const horarioMinutes = timeToMinutes(horario);
    const inicioMinutes = timeToMinutes(programa.horario_inicio);
    const fimMinutes = timeToMinutes(programa.horario_fim);
    
    return horarioMinutes >= inicioMinutes && horarioMinutes <= fimMinutes;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={notificationCount} />

      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciamento de Programas e Testemunhais</h1>
        </div>

        <Tabs defaultValue="programas" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center border-b mb-6">
            <TabsList className="bg-transparent p-0">
              <TabsTrigger 
                value="programas" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Programas
              </TabsTrigger>
              <TabsTrigger 
                value="testemunhais" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Testemunhais
              </TabsTrigger>
            </TabsList>
            <Button 
              className="gap-2 px-4" 
              onClick={() => handleAdd(activeTab === 'programas' ? 'programa' : 'testemunhal')}
              disabled={programaMutation.isPending || testemunhalMutation.isPending}
            >
              <Plus size={18} />
              <span>Adicionar Novo</span>
            </Button>
          </div>

          <TabsContent value="programas" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(programas) && programas.map((programa) => (
                <Card key={programa.id} className="opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{programa.nome}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(programa, 'programa')}>
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(programa)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{programa.horario_inicio.slice(0, 5)} - {programa.horario_fim.slice(0, 5)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>{programa.apresentador}</span>
                      </div>
                      {programa.dias && programa.dias.length > 0 && (
                        <div className="flex items-start text-gray-600">
                          <CalendarDays className="h-4 w-4 mr-2 mt-0.5" />
                          <span className="flex flex-wrap gap-1">
                            {programa.dias.map((dia: string) => (
                              <span key={dia} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">
                                {dia}
                              </span>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testemunhais" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Texto</TableHead>
                        <TableHead>Patrocinador</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Leituras</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(testemunhais) && testemunhais.map((testemunhal) => (
                        <TableRow key={testemunhal.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {testemunhal.texto}
                          </TableCell>
                          <TableCell>{testemunhal.patrocinador}</TableCell>
                          <TableCell className={
                            isTimeWithinProgram(testemunhal.programa_id, testemunhal.horario_agendado)
                            ? '' : 'text-red-600'
                          }>
                            {testemunhal.horario_agendado.slice(0, 5)}
                            {!isTimeWithinProgram(testemunhal.programa_id, testemunhal.horario_agendado) && (
                              <span className="text-xs ml-1 text-red-600">(Fora do horário)</span>
                            )}
                          </TableCell>
                          <TableCell>{testemunhal.programas?.nome || ''}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Repeat className="h-4 w-4 mr-1 text-gray-500" />
                              <span>{testemunhal.leituras || 1}x</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              testemunhal.status === 'lido' 
                                ? 'bg-green-100 text-green-800' 
                                : testemunhal.status === 'atrasado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {testemunhal.status === 'lido' 
                                ? 'Lido' 
                                : testemunhal.status === 'atrasado'
                                  ? 'Atrasado'
                                  : 'Pendente'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(testemunhal, 'testemunhal')}>
                                <Pencil size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(testemunhal)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Editar' : 'Adicionar'} {modalType === 'programa' ? 'Programa' : 'Testemunhal'}
              </DialogTitle>
            </DialogHeader>

            {modalType === 'programa' ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleFormChange('nome', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="horario_inicio" className="text-right">
                    Horário Início
                  </Label>
                  <Input
                    id="horario_inicio"
                    type="time"
                    value={formData.horario_inicio}
                    onChange={(e) => handleFormChange('horario_inicio', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="horario_fim" className="text-right">
                    Horário Fim
                  </Label>
                  <Input
                    id="horario_fim"
                    type="time"
                    value={formData.horario_fim}
                    onChange={(e) => handleFormChange('horario_fim', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apresentador" className="text-right">
                    Apresentadores
                  </Label>
                  <Input
                    id="apresentador"
                    value={formData.apresentador}
                    onChange={(e) => handleFormChange('apresentador', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">
                    Dias da Semana
                  </Label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {diasSemana.map((dia) => (
                      <div key={dia} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`dia-${dia}`} 
                          checked={formData.dias?.includes(dia)} 
                          onCheckedChange={() => handleDayToggle(dia)}
                        />
                        <label
                          htmlFor={`dia-${dia}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {dia}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="texto" className="text-right">
                    Texto
                  </Label>
                  <Textarea
                    id="texto"
                    value={formData.texto}
                    onChange={(e) => handleFormChange('texto', e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="patrocinador" className="text-right">
                    Patrocinador
                  </Label>
                  <Input
                    id="patrocinador"
                    value={formData.patrocinador}
                    onChange={(e) => handleFormChange('patrocinador', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="programa_id" className="text-right">
                    Programa
                  </Label>
                  <Select 
                    value={formData.programa_id} 
                    onValueChange={(value) => handleFormChange('programa_id', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(programas) && programas.map((programa) => (
                        <SelectItem key={programa.id} value={programa.id}>
                          {programa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leituras" className="text-right">
                    Qtd. Leituras
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Input
                      id="leituras"
                      type="number"
                      min="1"
                      value={formData.leituras}
                      onChange={(e) => handleFormChange('leituras', parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                    <span className="ml-2 text-gray-500">vezes durante o programa</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Distribuição
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="distribuir_automaticamente" 
                      checked={formData.distribuir_automaticamente} 
                      onCheckedChange={(checked) => handleFormChange('distribuir_automaticamente', !!checked)}
                    />
                    <label
                      htmlFor="distribuir_automaticamente"
                      className="text-sm font-medium leading-none"
                    >
                      Distribuir leituras automaticamente no horário do programa
                    </label>
                  </div>
                </div>
                {!formData.distribuir_automaticamente && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="horario_agendado" className="text-right">
                      Horário
                    </Label>
                    <Input
                      id="horario_agendado"
                      type="time"
                      value={formData.horario_agendado}
                      onChange={(e) => handleFormChange('horario_agendado', e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={programaMutation.isPending || testemunhalMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                onClick={handleSave}
                disabled={programaMutation.isPending || testemunhalMutation.isPending}
              >
                {programaMutation.isPending || testemunhalMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default GerenciamentoProgramas;
