import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import ReportChart from '@/components/ReportChart';
import { 
  FileText, 
  Download, 
  FileDown, 
  Filter, 
  Search, 
  Calendar as CalendarIcon, 
  BarChart3,
  PieChart,
  X,
  Check
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// Interfaces para os dados
interface Testemunhal {
  id: string;
  texto: string;
  patrocinador: string;
  programa: {
    nome: string;
  };
  horario_agendado: string;
  timestamp_leitura: string | null;
  status: string;
  created_at: string;
}

interface ProgramStats {
  name: string;
  readOnTime: number;
  readLate: number;
  pending: number;
}

// Estatísticas iniciais vazias
const initialStats = {
  total: 0,
  read: 0,
  pending: 0,
  late: 0,
  onTime: 0,
  programs: [] as ProgramStats[]
};

// Configurações de paginação
const ITEMS_PER_PAGE = 10;

const Relatorios: React.FC = () => {
  const [activeTab, setActiveTab] = useState('execucao');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testemunhal[]>([]);
  const [stats, setStats] = useState(initialStats);
  const [programas, setProgramas] = useState<{id: string, nome: string}[]>([]);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Formatar datas para a consulta
      const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;
      const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : undefined;

      // Buscar testemunhais
      const { data: testemunhaisData, error: testemunhaisError } = await supabase
        .from('testemunhais')
        .select('id, texto, patrocinador, horario_agendado, timestamp_leitura, status, created_at, programas(id, nome)')
        .gte('created_at', startDateStr ? `${startDateStr}T00:00:00` : undefined)
        .lte('created_at', endDateStr ? `${endDateStr}T23:59:59` : undefined)
        .order('created_at', { ascending: false });

      if (testemunhaisError) {
        console.error('Erro ao buscar testemunhais:', testemunhaisError);
        toast({
          title: 'Erro ao carregar dados',
          description: testemunhaisError.message,
          variant: 'destructive'
        });
        return;
      }

      // Buscar programas para o filtro
      const { data: programasData, error: programasError } = await supabase
        .from('programas')
        .select('id, nome')
        .order('nome');

      if (programasError) {
        console.error('Erro ao buscar programas:', programasError);
      } else {
        setProgramas(programasData || []);
      }

      // Processar os dados
      const formattedTestimonials = testemunhaisData?.map(item => ({
        id: item.id,
        texto: item.texto,
        patrocinador: item.patrocinador,
        programa: item.programas,
        horario_agendado: item.horario_agendado,
        timestamp_leitura: item.timestamp_leitura,
        status: item.status,
        created_at: item.created_at
      })) || [];

      setTestimonials(formattedTestimonials);

      // Calcular estatísticas
      const total = formattedTestimonials.length;
      const read = formattedTestimonials.filter(t => t.status === 'lido').length;
      const pending = formattedTestimonials.filter(t => t.status === 'pendente').length;
      const late = formattedTestimonials.filter(t => 
        t.status === 'lido' && 
        t.timestamp_leitura && 
        t.horario_agendado && 
        t.timestamp_leitura > t.horario_agendado
      ).length;
      const onTime = read - late;

      // Estatísticas por programa
      const programStats: Record<string, ProgramStats> = {};
      
      formattedTestimonials.forEach(t => {
        const programName = t.programa?.nome || 'Sem programa';
        
        if (!programStats[programName]) {
          programStats[programName] = {
            name: programName,
            readOnTime: 0,
            readLate: 0,
            pending: 0
          };
        }
        
        if (t.status === 'pendente') {
          programStats[programName].pending += 1;
        } else if (t.status === 'lido') {
          if (t.timestamp_leitura && t.horario_agendado && t.timestamp_leitura > t.horario_agendado) {
            programStats[programName].readLate += 1;
          } else {
            programStats[programName].readOnTime += 1;
          }
        }
      });

      setStats({
        total,
        read,
        pending,
        late,
        onTime,
        programs: Object.values(programStats)
      });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Relatório de Testemunhais', 10, 10);
      doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy')}`, 10, 20);
      doc.text(`Total de Testemunhais: ${stats.total}`, 10, 30);
      doc.text(`Testemunhais Lidos: ${stats.read}`, 10, 40);
      doc.text(`Testemunhais Pendentes: ${stats.pending}`, 10, 50);
      doc.text(`Testemunhais Atrasados: ${stats.late}`, 10, 60);
      doc.save('relatorio.pdf');
    } else if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([
        ['ID', 'Texto', 'Patrocinador', 'Programa', 'Horário Agendado', 'Horário de Leitura', 'Status', 'Data'],
        ...testimonials.map(t => [
          t.id,
          t.texto,
          t.patrocinador,
          t.programa?.nome,
          t.horario_agendado,
          t.timestamp_leitura,
          t.status,
          format(new Date(t.created_at), 'dd/MM/yyyy')
        ])
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
      XLSX.writeFile(workbook, 'relatorio.xlsx');
    }
  };

  const filteredTestimonials = testimonials.filter(item => {
    const matchesSearch = 
      item.texto.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.patrocinador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.programa?.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesProgram = !programFilter || item.programa?.nome === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Calcular total de páginas com base nos itens filtrados
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredTestimonials.length / ITEMS_PER_PAGE)));
    // Resetar para a primeira página quando os filtros mudam
    setCurrentPage(1);
  }, [filteredTestimonials.length]);

  // Obter os itens da página atual
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTestimonials.slice(startIndex, endIndex);
  };

  // Navegar para a próxima página
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Navegar para a página anterior
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Ir para uma página específica
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'lido':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Lido</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Atrasado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2"
            >
              <FileDown size={16} />
              Exportar PDF
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="Total de Testemunhais" 
            value={stats.total}
            color="blue"
          />
          <StatCard 
            title="Testemunhais Lidos" 
            value={stats.read}
            color="green"
          />
          <StatCard 
            title="Testemunhais Pendentes" 
            value={stats.pending}
            color="blue"
          />
          <StatCard 
            title="Testemunhais Atrasados" 
            value={stats.late}
            color="red"
          />
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Status de Leitura</CardTitle>
              <CardDescription>Distribuição de testemunhais por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportChart type="pie" data={[
                { name: 'Lidos', value: stats.read, color: '#4ade80' },
                { name: 'Pendentes', value: stats.pending, color: '#facc15' },
                { name: 'Atrasados', value: stats.late, color: '#f87171' },
              ]} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Programa</CardTitle>
              <CardDescription>Testemunhais lidos, atrasados e pendentes por programa</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportChart type="bar" data={stats.programs} />
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Tabs 
          defaultValue="execucao" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <TabsList className="bg-white">
              <TabsTrigger value="execucao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-4 h-4 mr-2" />
                Execução
              </TabsTrigger>
              <TabsTrigger value="pendencias" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <X className="w-4 h-4 mr-2" />
                Pendências
              </TabsTrigger>
              <TabsTrigger value="programacao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Programação
              </TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-2">
              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy') : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span>até</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy') : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por patrocinador, programa..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="program-filter">Programa</Label>
                <select
                  id="program-filter"
                  className="w-full p-2 border rounded-md mt-1"
                  value={programFilter || ''}
                  onChange={(e) => setProgramFilter(e.target.value || null)}
                >
                  <option value="">Todos os programas</option>
                  {programas.map(programa => (
                    <option key={programa.id} value={programa.nome}>
                      {programa.nome}
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>

          <TabsContent value="execucao" className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Relatório de Execução de Testemunhais</CardTitle>
                <CardDescription>
                  Visualize o histórico de leituras e status dos testemunhais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texto</TableHead>
                      <TableHead>Patrocinador</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Horário Programado</TableHead>
                      <TableHead>Horário de Leitura</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.texto.substring(0, 50)}...</TableCell>
                        <TableCell>{item.patrocinador}</TableCell>
                        <TableCell>{item.programa?.nome}</TableCell>
                        <TableCell>{item.horario_agendado?.substring(0, 5)}</TableCell>
                        <TableCell>{item.timestamp_leitura ? new Date(item.timestamp_leitura).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '-'}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTestimonials.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          Nenhum testemunhal encontrado com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Paginação */}
                {filteredTestimonials.length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {Math.min(filteredTestimonials.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} a {Math.min(filteredTestimonials.length, currentPage * ITEMS_PER_PAGE)} de {filteredTestimonials.length} registros
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Lógica para mostrar páginas ao redor da página atual
                        let pageToShow;
                        if (totalPages <= 5) {
                          pageToShow = i + 1;
                        } else if (currentPage <= 3) {
                          pageToShow = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageToShow = totalPages - 4 + i;
                        } else {
                          pageToShow = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button 
                            key={pageToShow}
                            variant={currentPage === pageToShow ? "default" : "outline"} 
                            size="sm"
                            onClick={() => goToPage(pageToShow)}
                          >
                            {pageToShow}
                          </Button>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pendencias" className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Relatório de Pendências</CardTitle>
                <CardDescription>
                  Testemunhais não lidos ou lidos fora do horário programado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texto</TableHead>
                      <TableHead>Patrocinador</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Horário Programado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageItems()
                      .filter(item => item.status === 'pendente' || item.status === 'atrasado')
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.texto.substring(0, 50)}...</TableCell>
                          <TableCell>{item.patrocinador}</TableCell>
                          <TableCell>{item.programa?.nome}</TableCell>
                          <TableCell>{item.horario_agendado?.substring(0, 5)}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    {filteredTestimonials.filter(item => item.status === 'pendente' || item.status === 'atrasado').length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhuma pendência encontrada com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Paginação */}
                {filteredTestimonials.filter(item => item.status === 'pendente' || item.status === 'atrasado').length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando pendências {Math.min(filteredTestimonials.filter(item => item.status === 'pendente' || item.status === 'atrasado').length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} a {Math.min(filteredTestimonials.filter(item => item.status === 'pendente' || item.status === 'atrasado').length, currentPage * ITEMS_PER_PAGE)} de {filteredTestimonials.filter(item => item.status === 'pendente' || item.status === 'atrasado').length} registros
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageToShow;
                        if (totalPages <= 5) {
                          pageToShow = i + 1;
                        } else if (currentPage <= 3) {
                          pageToShow = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageToShow = totalPages - 4 + i;
                        } else {
                          pageToShow = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button 
                            key={pageToShow}
                            variant={currentPage === pageToShow ? "default" : "outline"} 
                            size="sm"
                            onClick={() => goToPage(pageToShow)}
                          >
                            {pageToShow}
                          </Button>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programacao" className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Relatório de Programação de Testemunhais</CardTitle>
                <CardDescription>
                  Visualize todos os testemunhais programados para leitura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Texto</TableHead>
                      <TableHead>Patrocinador</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Leituras</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageItems().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.texto.substring(0, 50)}...</TableCell>
                        <TableCell>{item.patrocinador}</TableCell>
                        <TableCell>{item.programa?.nome}</TableCell>
                        <TableCell>{item.horario_agendado?.substring(0, 5)}</TableCell>
                        <TableCell>0 de 0</TableCell>
                        <TableCell>0 min</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTestimonials.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhum testemunhal encontrado com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                
                {/* Paginação */}
                {filteredTestimonials.length > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Mostrando {Math.min(filteredTestimonials.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} a {Math.min(filteredTestimonials.length, currentPage * ITEMS_PER_PAGE)} de {filteredTestimonials.length} registros
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageToShow;
                        if (totalPages <= 5) {
                          pageToShow = i + 1;
                        } else if (currentPage <= 3) {
                          pageToShow = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageToShow = totalPages - 4 + i;
                        } else {
                          pageToShow = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button 
                            key={pageToShow}
                            variant={currentPage === pageToShow ? "default" : "outline"} 
                            size="sm"
                            onClick={() => goToPage(pageToShow)}
                          >
                            {pageToShow}
                          </Button>
                        );
                      })}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Relatorios;
