import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { BadgeCheck, Calendar, CalendarDays, Clock, Pencil, Plus, Repeat, Trash2, User, Loader2, AlertTriangle, Radio, MessageSquare, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";

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
  data_inicio: string | null;
  data_fim: string | null;
}



const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const GerenciamentoProgramas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('programas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [modalType, setModalType] = useState<'programa' | 'testemunhal'>('programa');
  const [selectedItem, setSelectedItem] = useState<Programa | Testemunhal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

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
    data_inicio: new Date(),
    data_fim: undefined,
    conteudo: '',
    data_programada: new Date(),
    horario_programado: '',
    recorrente: false,
  });

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [testemunhais, setTestemunhais] = useState<Testemunhal[]>([]);


  // Declaração das funções de fetch
  const fetchProgramas = async () => {
    const { data, error } = await supabase
      .from('programas')
      .select('*')
      .order('nome');
    
    if (error) {
      toast.error('Erro ao carregar programas', {
        description: error.message,
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return;
    }
    
    setProgramas(data || []);
  };
  
  const fetchTestemunhais = async () => {
    const { data, error } = await supabase
      .from('testemunhais')
      .select('*, programas(nome)')
      .order('patrocinador');
    
    if (error) {
      toast.error('Erro ao carregar testemunhais', {
        description: error.message,
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
      return;
    }
    
    setTestemunhais(data || []);
  };

  // Effect para carregar os dados
  useEffect(() => {
    fetchProgramas();
    fetchTestemunhais();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Erro de autenticação:', error);
          setAuthError(true);
          toast.error('Erro de autenticação', {
            description: 'Você precisa estar autenticado para acessar esta página. Redirecionando para o login...',
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          
          // Redirecionar para o login após 3 segundos
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setAuthError(true);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12">
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12">
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2 max-w-md text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <h3 className="text-lg font-semibold">Erro de autenticação</h3>
              <p className="text-sm text-muted-foreground">
                Você precisa estar autenticado para acessar esta página. 
                Redirecionando para o login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const generateDistributedTimes = (
    startTime: string,
    endTime: string,
    count: number
  ): string[] => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    const duration = endMinutes - startMinutes;
    
    if (duration <= 0 || count <= 0) return [];
    
    const times: string[] = [];
    
    if (count === 1) {
      const middleTime = Math.floor(startMinutes + duration / 2);
      times.push(minutesToTime(middleTime));
    } else {
      const interval = duration / (count + 1);
      
      for (let i = 1; i <= count; i++) {
        const baseTime = Math.floor(startMinutes + interval * i);
        const variation = Math.floor(Math.random() * 11) - 5;
        const adjustedTime = Math.max(startMinutes, Math.min(endMinutes, baseTime + variation));
        
        times.push(minutesToTime(adjustedTime));
      }
      
      times.sort();
    }
    
    return times;
  };

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
      leituras: 1,
      distribuir_automaticamente: true,
      data_inicio: new Date(),
      data_fim: undefined,
      conteudo: '',
      data_programada: new Date(),
      horario_programado: '',
      recorrente: false,
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
    } else if (type === 'testemunhal') {
      const testemunhal = item as Testemunhal;
      setFormData({
        texto: testemunhal.texto,
        patrocinador: testemunhal.patrocinador,
        horario_agendado: testemunhal.horario_agendado,
        programa_id: testemunhal.programa_id,
        leituras: testemunhal.leituras || 1,
        distribuir_automaticamente: false,
        data_inicio: testemunhal.data_inicio ? new Date(testemunhal.data_inicio) : new Date(),
        data_fim: testemunhal.data_fim ? new Date(testemunhal.data_fim) : undefined,
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

  const handleSave = async () => {
    if (modalType === 'programa') {
      if (!formData.nome || !formData.horario_inicio || !formData.horario_fim || formData.dias.length === 0) {
        toast.error('Preencha todos os campos obrigatórios', {
          description: 'Nome, horário de início, horário de fim e dias da semana são obrigatórios.',
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('programas')
        .upsert({
          id: selectedItem?.id,
          nome: formData.nome,
          horario_inicio: formData.horario_inicio,
          horario_fim: formData.horario_fim,
          apresentador: formData.apresentador,
          dias: formData.dias,
        })
        .select();
        
      if (error) {
        toast.error('Erro ao salvar programa', {
          description: error.message,
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return;
      }
      
      if (selectedItem) {
        setProgramas(prev => prev.map(p => p.id === selectedItem.id ? data[0] : p));
      } else {
        setProgramas(prev => [...prev, data[0]]);
      }
      setIsModalOpen(false);
    } else if (modalType === 'testemunhal') {
      if (!formData.patrocinador || !formData.texto || !formData.programa_id || !formData.data_inicio) {
        toast.error('Preencha todos os campos obrigatórios', {
          description: 'Patrocinador, texto, programa e data de início são obrigatórios.',
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return;
      }
      
      if (!formData.distribuir_automaticamente && !formData.horario_agendado) {
        toast.error('Preencha o horário agendado ou utilize a distribuição automática', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return;
      }
      
      const programa = programas.find(p => p.id === formData.programa_id);
      
      let horarios: string[] = [];
      
      if (formData.distribuir_automaticamente && programa) {
        horarios = generateDistributedTimes(
          programa.horario_inicio,
          programa.horario_fim,
          formData.leituras
        );
      } else {
        horarios = [formData.horario_agendado];
      }
      
      const inserts = horarios.map(horario => ({
        patrocinador: formData.patrocinador,
        texto: formData.texto,
        horario_agendado: horario,
        programa_id: formData.programa_id,
        leituras: 1,
        status: 'pendente',
        data_inicio: formData.data_inicio ? formData.data_inicio.toISOString().split('T')[0] : null,
        data_fim: formData.data_fim ? formData.data_fim.toISOString().split('T')[0] : null,
      }));
      
      const { data, error } = await supabase
        .from('testemunhais')
        .insert(inserts)
        .select('*, programas(nome)');
        
      if (error) {
        toast.error('Erro ao salvar testemunhal', {
          description: error.message,
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return;
      }
      
      const novosTestemunhais = data.map(item => ({
        ...item,
        programas: item.programas || { nome: '' },
        nome: item.programas?.nome || ''
      })) as Testemunhal[];
      
      setTestemunhais(prev => [...prev, ...novosTestemunhais]);
      setIsModalOpen(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    
    try {
      if ('nome' in selectedItem && 'apresentador' in selectedItem) {
        // É um programa
        const { data: testemunhaisAssociados, error: errorCheck } = await supabase
          .from('testemunhais')
          .select('id')
          .eq('programa_id', selectedItem.id);
          
        if (errorCheck) {
          toast.error('Erro ao verificar testemunhais associados', {
            description: errorCheck.message,
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          return;
        }
        
        if (testemunhaisAssociados && testemunhaisAssociados.length > 0) {
          toast.error('Não é possível excluir o programa', {
            description: 'Existem testemunhais associados a este programa.',
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          return;
        }
        
        const { error } = await supabase
          .from('programas')
          .delete()
          .eq('id', selectedItem.id);
          
        if (error) throw error;
        
        setProgramas(prev => prev.filter(p => p.id !== selectedItem.id));
        
        toast.success('Programa excluído com sucesso!', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      } else if ('patrocinador' in selectedItem) {
        // É um testemunhal
        const { error } = await supabase
          .from('testemunhais')
          .delete()
          .eq('id', selectedItem.id);
          
        if (error) throw error;
        
        setTestemunhais(prev => prev.filter(t => t.id !== selectedItem.id));
        
        toast.success('Testemunhal excluído com sucesso!', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      }
    } catch (error: any) {
      toast.error('Erro ao excluir item', {
        description: error.message,
        position: 'bottom-right',
        closeButton: true,
        duration: 5000
      });
    } finally {
      setIsAlertOpen(false);
    }
  };

  const notificationCount = Array.isArray(testemunhais) 
    ? testemunhais.filter(t => t.status === 'pendente' || t.status === 'atrasado').length 
    : 0;

  const isTimeWithinProgram = (programaId: string, horario: string): boolean => {
    const programa = programas.find(p => p.id === programaId);
    if (!programa) return false;
    
    const horarioMinutes = timeToMinutes(horario);
    const inicioMinutes = timeToMinutes(programa.horario_inicio);
    const fimMinutes = timeToMinutes(programa.horario_fim);
    
    return horarioMinutes >= inicioMinutes && horarioMinutes <= fimMinutes;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  const formatEndDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sem data fim';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      return 'Sem data fim';
    }
  };

  const filteredProgramas = programas.filter(programa =>
    programa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programa.apresentador.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastPrograma = currentPage * itemsPerPage;
  const indexOfFirstPrograma = indexOfLastPrograma - itemsPerPage;
  const currentProgramas = filteredProgramas.slice(indexOfFirstPrograma, indexOfLastPrograma);
  const totalPages = Math.ceil(filteredProgramas.length / itemsPerPage);

  const filteredTestemunhais = testemunhais.filter(testemunhal =>
    testemunhal.patrocinador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testemunhal.texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (testemunhal.programas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastTestemunhal = currentPage * itemsPerPage;
  const indexOfFirstTestemunhal = indexOfLastTestemunhal - itemsPerPage;
  const currentTestemunhais = filteredTestemunhais.slice(indexOfFirstTestemunhal, indexOfLastTestemunhal);
  const totalPagesTestemunhais = Math.ceil(filteredTestemunhais.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={notificationCount} />

      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Gerenciamento de Programas e Testemunhais</h1>
        </div>

        <Tabs 
          defaultValue="programas" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="flex flex-col gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-1 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <TabsList className="w-full sm:w-auto h-auto p-1 bg-transparent grid grid-cols-2 gap-2">
                  <TabsTrigger 
                    value="programas" 
                    onClick={() => setActiveTab('programas')}
                    className="py-3 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md rounded-md transition-all duration-200 hover:bg-blue-100 hover:text-blue-800 font-medium"
                  >
                    <Radio className="mr-2 h-4 w-4" />
                    Programas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="testemunhais" 
                    onClick={() => setActiveTab('testemunhais')}
                    className="py-3 px-4 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md rounded-md transition-all duration-200 hover:bg-blue-100 hover:text-blue-800 font-medium"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Testemunhais
                  </TabsTrigger>
                </TabsList>
                
                <Button 
                  className="gap-2 px-4 bg-white text-blue-700 hover:bg-blue-50 shadow-md border border-blue-100 m-1" 
                  onClick={() => handleAdd(activeTab === 'programas' ? 'programa' : 'testemunhal')}
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">Adicionar {activeTab === 'programas' ? 'Programa' : 'Testemunhal'}</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="programas" className="mt-0">
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Input
                placeholder="Buscar por nome ou apresentador..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-full sm:max-w-md"
              />
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto"
                >
                  Limpar busca
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Array.isArray(currentProgramas) && currentProgramas.length > 0 ? (
                currentProgramas.map((programa) => (
                  <Card 
                    key={programa.id} 
                    className="opacity-0 animate-[fadeIn_0.4s_ease-out_forwards] hover:shadow-lg transition-all duration-200 border-t-4 border-t-blue-500 overflow-hidden group"
                  >
                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-transparent">
                      <CardTitle className="text-lg sm:text-xl line-clamp-2 flex items-start gap-2">
                        <Radio className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <span>{programa.nome}</span>
                      </CardTitle>
                      <CardDescription className="line-clamp-1 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {programa.apresentador}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{programa.horario_inicio.slice(0, 5)} - {programa.horario_fim.slice(0, 5)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{programa.dias.join(', ')}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(programa, 'programa')} className="h-8 w-8 p-0" title="Editar">
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => handleDelete(programa)} title="Excluir">
                        <Trash2 size={16} />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center p-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Radio className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg text-gray-500 mb-2">Nenhum programa encontrado</p>
                  <p className="text-sm text-gray-400 mb-6 text-center">
                    {searchTerm ? "Tente ajustar sua busca ou" : "Comece"} adicionando um novo programa
                  </p>
                  <Button 
                    onClick={() => handleAdd('programa')}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Adicionar Programa
                  </Button>
                </div>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center py-4 overflow-x-auto">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={`page-${index}`} className="hidden sm:block">
                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink 
                            isActive={currentPage === page} 
                            onClick={() => typeof page === 'number' && handlePageChange(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem className="sm:hidden">
                      <span className="px-2">{currentPage} / {totalPages}</span>
                    </PaginationItem>
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        aria-disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            
            {Array.isArray(currentProgramas) && currentProgramas.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 text-xs sm:text-sm text-muted-foreground border-t gap-2">
                <div>
                  Mostrando {indexOfFirstPrograma + 1}-{Math.min(indexOfLastPrograma, filteredProgramas.length)} de {filteredProgramas.length} resultados
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="testemunhais" className="mt-0">
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <Input
                placeholder="Buscar por patrocinador, texto ou programa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-full sm:max-w-md"
              />
              {searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto"
                >
                  Limpar busca
                </Button>
              )}
            </div>
            
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Patrocinador</TableHead>
                        <TableHead className="whitespace-nowrap">Horário</TableHead>
                        <TableHead className="whitespace-nowrap">Programa</TableHead>
                        <TableHead className="whitespace-nowrap hidden md:table-cell">Período</TableHead>
                        <TableHead className="whitespace-nowrap hidden sm:table-cell">Leituras</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(currentTestemunhais) && currentTestemunhais.length > 0 ? (
                        currentTestemunhais.map((testemunhal) => (
                          <TableRow key={testemunhal.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium max-w-[200px] truncate" title={testemunhal.patrocinador}>
                              {testemunhal.patrocinador}
                            </TableCell>
                            <TableCell className={
                              isTimeWithinProgram(testemunhal.programa_id, testemunhal.horario_agendado)
                              ? '' : 'text-red-600'
                            }>
                              {testemunhal.horario_agendado.slice(0, 5)}
                              {!isTimeWithinProgram(testemunhal.programa_id, testemunhal.horario_agendado) && (
                                <span className="text-xs ml-1 text-red-600 hidden sm:inline">(Fora do horário)</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={testemunhal.programas?.nome || ''}>
                              {testemunhal.programas?.nome || ''}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {testemunhal.data_inicio && (
                                <span className="text-xs">
                                  De: {formatDate(testemunhal.data_inicio)}
                                  {testemunhal.data_fim && (
                                    <> até: {formatDate(testemunhal.data_fim)}</>
                                  )}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
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
                              <div className="flex justify-end gap-1 sm:gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(testemunhal, 'testemunhal')} className="h-8 w-8 p-0" title="Editar">
                                  <Pencil size={16} />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => handleDelete(testemunhal)} title="Excluir">
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <CalendarDays className="h-8 w-8 text-muted-foreground opacity-30" />
                              <p className="text-sm text-muted-foreground">
                                {searchTerm ? "Nenhum testemunhal encontrado para esta busca" : "Nenhum testemunhal cadastrado"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPagesTestemunhais > 1 && (
                  <div className="flex justify-center py-4 overflow-x-auto">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            aria-disabled={currentPage === 1}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, index) => (
                          <PaginationItem key={`page-${index}`} className="hidden sm:block">
                            {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink 
                                isActive={currentPage === page} 
                                onClick={() => typeof page === 'number' && handlePageChange(page)}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem className="sm:hidden">
                          <span className="px-2">{currentPage} / {totalPagesTestemunhais}</span>
                        </PaginationItem>
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPagesTestemunhais && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPagesTestemunhais ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            aria-disabled={currentPage === totalPagesTestemunhais}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 text-xs sm:text-sm text-muted-foreground border-t gap-2">
                  <div>
                    Mostrando {indexOfFirstTestemunhal + 1}-{Math.min(indexOfLastTestemunhal, filteredTestemunhais.length)} de {filteredTestemunhais.length} resultados
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Editar' : 'Adicionar'} {modalType === 'programa' ? 'Programa' : 'Testemunhal'}
              </DialogTitle>
            </DialogHeader>
            
            {modalType === 'programa' ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="nome" className="sm:text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleFormChange('nome', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="horario_inicio" className="sm:text-right">
                    Horário Início
                  </Label>
                  <Input
                    id="horario_inicio"
                    type="time"
                    value={formData.horario_inicio}
                    onChange={(e) => handleFormChange('horario_inicio', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="horario_fim" className="sm:text-right">
                    Horário Fim
                  </Label>
                  <Input
                    id="horario_fim"
                    type="time"
                    value={formData.horario_fim}
                    onChange={(e) => handleFormChange('horario_fim', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="apresentador" className="sm:text-right">
                    Apresentador
                  </Label>
                  <Input
                    id="apresentador"
                    value={formData.apresentador}
                    onChange={(e) => handleFormChange('apresentador', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                  <Label className="sm:text-right mt-2">
                    Dias da Semana
                  </Label>
                  <div className="flex flex-wrap gap-2 col-span-1 sm:col-span-3">
                    {diasSemana.map(dia => (
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
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="patrocinador" className="sm:text-right">
                    Patrocinador
                  </Label>
                  <Input
                    id="patrocinador"
                    value={formData.patrocinador}
                    onChange={(e) => handleFormChange('patrocinador', e.target.value)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="texto" className="sm:text-right">
                    Texto
                  </Label>
                  <Textarea
                    id="texto"
                    value={formData.texto}
                    onChange={(e) => handleFormChange('texto', e.target.value)}
                    className="col-span-1 sm:col-span-3 min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="programa_id" className="sm:text-right">
                    Programa
                  </Label>
                  <Select
                    value={formData.programa_id}
                    onValueChange={(value) => handleFormChange('programa_id', value)}
                  >
                    <SelectTrigger className="col-span-1 sm:col-span-3">
                      <SelectValue placeholder="Selecione um programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {programas.map((programa) => (
                        <SelectItem key={programa.id} value={programa.id}>
                          {programa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="data_inicio" className="sm:text-right">
                    Data Início
                  </Label>
                  <div className="col-span-1 sm:col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {formData.data_inicio ? (
                            format(formData.data_inicio, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.data_inicio}
                          onSelect={(date) => handleFormChange('data_inicio', date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="data_fim" className="sm:text-right">
                    Data Fim (opcional)
                  </Label>
                  <div className="col-span-1 sm:col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {formData.data_fim ? (
                            format(formData.data_fim, 'PPP', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.data_fim}
                          onSelect={(date) => handleFormChange('data_fim', date)}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label htmlFor="leituras" className="sm:text-right">
                    Quantidade de Leituras
                  </Label>
                  <Input
                    id="leituras"
                    type="number"
                    min="1"
                    value={formData.leituras}
                    onChange={(e) => handleFormChange('leituras', parseInt(e.target.value) || 1)}
                    className="col-span-1 sm:col-span-3"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <div className="sm:text-right">
                    <Label>Distribuição</Label>
                  </div>
                  <div className="col-span-1 sm:col-span-3 flex items-center space-x-2">
                    <Checkbox 
                      id="distribuir_automaticamente" 
                      checked={formData.distribuir_automaticamente} 
                      onCheckedChange={(checked) => handleFormChange('distribuir_automaticamente', checked)}
                    />
                    <label
                      htmlFor="distribuir_automaticamente"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Distribuir automaticamente durante o programa
                    </label>
                  </div>
                </div>
                {!formData.distribuir_automaticamente && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                    <Label htmlFor="horario_agendado" className="sm:text-right">
                      Horário Agendado
                    </Label>
                    <Input
                      id="horario_agendado"
                      type="time"
                      value={formData.horario_agendado}
                      onChange={(e) => handleFormChange('horario_agendado', e.target.value)}
                      className="col-span-1 sm:col-span-3"
                    />
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                Salvar
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
              <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteItem}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};


export default GerenciamentoProgramas;
