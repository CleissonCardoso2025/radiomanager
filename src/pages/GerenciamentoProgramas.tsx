import React, { useState, useEffect } from 'react';
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
import { BadgeCheck, Calendar, CalendarDays, Clock, Pencil, Plus, Repeat, Trash2, User, Loader2, AlertTriangle } from 'lucide-react';
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

interface ConteudoProduzido {
  id: string;
  nome: string;
  conteudo: string;
  programa_id: string;
  data_programada: string;
  horario_programado: string;
  status: string;
  created_at: string;
  updated_at: string;
  programas?: { nome: string };
}

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const GerenciamentoProgramas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('programas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [modalType, setModalType] = useState<'programa' | 'testemunhal' | 'conteudo'>('programa');
  const [selectedItem, setSelectedItem] = useState<Programa | Testemunhal | ConteudoProduzido | null>(null);
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
  });

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [testemunhais, setTestemunhais] = useState<Testemunhal[]>([]);
  const [conteudosProduzidos, setConteudosProduzidos] = useState<ConteudoProduzido[]>([]);

  useEffect(() => {
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

    const fetchConteudosProduzidos = async () => {
      try {
        // Verificar se a tabela existe
        const { error: checkError } = await supabase
          .from('conteudos_produzidos')
          .select('count')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') {
          console.error('Tabela conteudos_produzidos não existe:', checkError);
          // A tabela não existe, então inicializamos com um array vazio
          setConteudosProduzidos([]);
          
          // Mostrar toast informando ao usuário
          toast.warning('Funcionalidade em construção', {
            description: 'A funcionalidade de produção de conteúdo está sendo implementada. Por favor, tente novamente mais tarde.',
            position: 'bottom-right',
            closeButton: true,
            duration: 8000
          });
          return;
        }
        
        // Se a tabela existir, buscar os dados
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .select('*, programas(nome)')
          .order('nome');
          
        if (error) throw error;
        
        const conteudosFormatados = data.map(item => ({
          ...item,
          programas: item.programas || { nome: '' }
        })) as ConteudoProduzido[];
        
        setConteudosProduzidos(conteudosFormatados);
      } catch (error: any) {
        console.error('Erro ao carregar conteúdos produzidos:', error);
        toast.error('Erro ao carregar conteúdos produzidos', {
          description: error.message,
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        setConteudosProduzidos([]);
      }
    };

    fetchProgramas();
    fetchTestemunhais();
    fetchConteudosProduzidos();
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

  const handleAdd = (type: 'programa' | 'testemunhal' | 'conteudo') => {
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
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: Programa | Testemunhal | ConteudoProduzido, type: 'programa' | 'testemunhal' | 'conteudo') => {
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
    } else {
      const conteudo = item as ConteudoProduzido;
      setFormData({
        nome: conteudo.nome,
        conteudo: conteudo.conteudo,
        programa_id: conteudo.programa_id,
        data_programada: conteudo.data_programada ? new Date(conteudo.data_programada) : new Date(),
        horario_programado: conteudo.horario_programado,
      });
    }
    
    setIsModalOpen(true);
  };

  const handleDelete = (item: Programa | Testemunhal | ConteudoProduzido) => {
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
    } else if (modalType === 'conteudo') {
      if (!formData.nome || !formData.conteudo || !formData.programa_id || !formData.data_programada || !formData.horario_programado) {
        toast.error('Preencha todos os campos obrigatórios', {
          description: 'Nome do conteúdo, conteúdo, programa, data e horário são obrigatórios.',
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        return;
      }
      
      try {
        // Verificar se a tabela existe
        const { error: checkError } = await supabase
          .from('conteudos_produzidos')
          .select('count')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') {
          toast.error('Funcionalidade indisponível', {
            description: 'A funcionalidade de produção de conteúdo ainda está sendo implementada. Por favor, tente novamente mais tarde.',
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          return;
        }
        
        const { data, error } = await supabase
          .from('conteudos_produzidos')
          .upsert({
            id: selectedItem?.id,
            nome: formData.nome,
            conteudo: formData.conteudo,
            programa_id: formData.programa_id,
            data_programada: formData.data_programada.toISOString().split('T')[0],
            horario_programado: formData.horario_programado,
            status: 'pendente',
          })
          .select('*, programas(nome)');
          
        if (error) {
          throw error;
        }
        
        const novoConteudo = {
          ...data[0],
          programas: data[0].programas || { nome: '' }
        } as ConteudoProduzido;
        
        if (selectedItem) {
          setConteudosProduzidos(prev => 
            prev.map(c => c.id === selectedItem.id ? novoConteudo : c)
          );
        } else {
          setConteudosProduzidos(prev => [...prev, novoConteudo]);
        }
        
        toast.success('Conteúdo salvo com sucesso!', {
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
        
        setIsModalOpen(false);
      } catch (error: any) {
        toast.error('Erro ao salvar conteúdo', {
          description: error.message,
          position: 'bottom-right',
          closeButton: true,
          duration: 5000
        });
      }
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
      } else if ('conteudo' in selectedItem) {
        // É um conteúdo produzido
        // Verificar se a tabela existe
        const { error: checkError } = await supabase
          .from('conteudos_produzidos')
          .select('count')
          .limit(1);
          
        if (checkError && checkError.code === '42P01') {
          toast.error('Funcionalidade indisponível', {
            description: 'A funcionalidade de produção de conteúdo ainda está sendo implementada. Por favor, tente novamente mais tarde.',
            position: 'bottom-right',
            closeButton: true,
            duration: 5000
          });
          return;
        }
        
        const { error } = await supabase
          .from('conteudos_produzidos')
          .delete()
          .eq('id', selectedItem.id);
          
        if (error) throw error;
        
        setConteudosProduzidos(prev => prev.filter(c => c.id !== selectedItem.id));
        
        toast.success('Conteúdo excluído com sucesso!', {
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

  const filteredTestemunhais = testemunhais.filter(testemunhal =>
    testemunhal.patrocinador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    testemunhal.texto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (testemunhal.programas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastTestemunhal = currentPage * itemsPerPage;
  const indexOfFirstTestemunhal = indexOfLastTestemunhal - itemsPerPage;
  const currentTestemunhais = filteredTestemunhais.slice(indexOfFirstTestemunhal, indexOfLastTestemunhal);
  const totalPages = Math.ceil(filteredTestemunhais.length / itemsPerPage);

  const filteredConteudos = conteudosProduzidos.filter(conteudo =>
    conteudo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteudo.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conteudo.programas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastConteudo = currentPage * itemsPerPage;
  const indexOfFirstConteudo = indexOfLastConteudo - itemsPerPage;
  const currentConteudos = filteredConteudos.slice(indexOfFirstConteudo, indexOfLastConteudo);
  const totalPagesConteudos = Math.ceil(filteredConteudos.length / itemsPerPage);

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
              <TabsTrigger 
                value="conteudos" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Produção de Conteúdo
              </TabsTrigger>
            </TabsList>
            <Button 
              className="gap-2 px-4" 
              onClick={() => handleAdd(activeTab === 'programas' ? 'programa' : activeTab === 'testemunhais' ? 'testemunhal' : 'conteudo')}
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
            <div className="mb-4">
              <Input
                placeholder="Buscar por patrocinador, texto ou programa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-md"
              />
            </div>
            
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
                        <TableHead>Período</TableHead>
                        <TableHead>Leituras</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(currentTestemunhais) && currentTestemunhais.map((testemunhal) => (
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
                            {testemunhal.data_inicio && (
                              <span className="text-xs">
                                De: {formatDate(testemunhal.data_inicio)}
                                {testemunhal.data_fim && (
                                  <> até: {formatDate(testemunhal.data_fim)}</>
                                )}
                              </span>
                            )}
                          </TableCell>
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
                
                {totalPages > 1 && (
                  <div className="flex justify-center py-4">
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
                          <PaginationItem key={`page-${index}`}>
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
                
                <div className="flex justify-between items-center p-4 text-sm text-muted-foreground border-t">
                  <div>
                    Mostrando {indexOfFirstTestemunhal + 1}-{Math.min(indexOfLastTestemunhal, filteredTestemunhais.length)} de {filteredTestemunhais.length} resultados
                  </div>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                    >
                      Limpar busca
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conteudos" className="mt-0">
            <div className="mb-4">
              <Input
                placeholder="Buscar por nome, conteúdo ou programa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="max-w-md"
              />
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Conteúdo</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(currentConteudos) && currentConteudos.map((conteudo) => (
                        <TableRow key={conteudo.id}>
                          <TableCell className="font-medium">
                            {conteudo.nome}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {conteudo.conteudo}
                          </TableCell>
                          <TableCell>{conteudo.programas?.nome || ''}</TableCell>
                          <TableCell>{formatDate(conteudo.data_programada)}</TableCell>
                          <TableCell>{conteudo.horario_programado.slice(0, 5)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              conteudo.status === 'lido' 
                                ? 'bg-green-100 text-green-800' 
                                : conteudo.status === 'atrasado'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {conteudo.status === 'lido' 
                                ? 'Lido' 
                                : conteudo.status === 'atrasado'
                                  ? 'Atrasado'
                                  : 'Pendente'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(conteudo, 'conteudo')}>
                                <Pencil size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(conteudo)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {totalPagesConteudos > 1 && (
                  <div className="flex justify-center py-4">
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
                          <PaginationItem key={`page-${index}`}>
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
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPagesConteudos && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPagesConteudos ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            aria-disabled={currentPage === totalPagesConteudos}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
                
                <div className="flex justify-between items-center p-4 text-sm text-muted-foreground border-t">
                  <div>
                    Mostrando {indexOfFirstConteudo + 1}-{Math.min(indexOfLastConteudo, filteredConteudos.length)} de {filteredConteudos.length} resultados
                  </div>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
                      }}
                    >
                      Limpar busca
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Editar' : 'Adicionar'} {modalType === 'programa' ? 'Programa' : modalType === 'testemunhal' ? 'Testemunhal' : 'Conteúdo'}
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
            ) : modalType === 'testemunhal' ? (
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
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="data_inicio" className="text-right">
                    Data Início
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.data_inicio ? (
                            format(formData.data_inicio, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data de início</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.data_inicio}
                          onSelect={(date) => handleFormChange('data_inicio', date)}
                          initialFocus
                          locale={ptBR}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="data_fim" className="text-right">
                    Data Fim
                  </Label>
                  <div className="col-span-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.data_fim ? (
                            format(formData.data_fim, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione a data de fim (opcional)</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.data_fim}
                          onSelect={(date) => handleFormChange('data_fim', date)}
                          initialFocus
                          locale={ptBR}
                          disabled={(date) => formData.data_inicio ? date < formData.data_inicio : false}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome do Conteúdo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleFormChange('nome', e.target.value)}
                    placeholder="Nome do conteúdo"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="conteudo">Conteúdo</Label>
                  <Textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) => handleFormChange('conteudo', e.target.value)}
                    placeholder="Digite o conteúdo aqui..."
                    rows={5}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="programa">Programa</Label>
                  <Select
                    value={formData.programa_id}
                    onValueChange={(value) => handleFormChange('programa_id', value)}
                  >
                    <SelectTrigger>
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
                
                <div className="grid gap-2">
                  <Label>Data Programada</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.data_programada ? (
                          format(formData.data_programada, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.data_programada}
                        onSelect={(date) => handleFormChange('data_programada', date)}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="horario">Horário Programado</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={formData.horario_programado}
                    onChange={(e) => handleFormChange('horario_programado', e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
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
