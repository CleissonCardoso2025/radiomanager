
import React, { useState } from 'react';
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

// Mock data for testimonials
const testimonials = [
  {
    id: 1,
    text: 'Supermercado Bom Preço - As melhores ofertas da cidade!',
    sponsor: 'Supermercado Bom Preço',
    program: 'Manhã Total',
    scheduledTime: '10:30',
    readTime: '10:32',
    status: 'read',
    date: '2023-11-10'
  },
  {
    id: 2,
    text: 'Farmácia Saúde Total - Cuidando de você e sua família',
    sponsor: 'Farmácia Saúde Total',
    program: 'Tarde Show',
    scheduledTime: '14:15',
    readTime: null,
    status: 'pending',
    date: '2023-11-10'
  },
  {
    id: 3,
    text: 'Auto Center Pneus - Troca de óleo com 20% de desconto',
    sponsor: 'Auto Center Pneus',
    program: 'Manhã Total',
    scheduledTime: '09:45',
    readTime: '10:10',
    status: 'late',
    date: '2023-11-09'
  },
  {
    id: 4,
    text: 'Restaurante Sabor Caseiro - Almoço executivo por apenas R$29,90',
    sponsor: 'Restaurante Sabor Caseiro',
    program: 'Manhã Total',
    scheduledTime: '11:00',
    readTime: '11:00',
    status: 'read',
    date: '2023-11-09'
  },
  {
    id: 5,
    text: 'Livraria Cultura - 30% de desconto em livros de literatura nacional',
    sponsor: 'Livraria Cultura',
    program: 'Tarde Show',
    scheduledTime: '15:30',
    readTime: null,
    status: 'pending',
    date: '2023-11-08'
  }
];

// Stats data
const stats = {
  total: testimonials.length,
  read: testimonials.filter(t => t.status === 'read').length,
  pending: testimonials.filter(t => t.status === 'pending').length,
  late: testimonials.filter(t => t.status === 'late').length,
};

// Data for the read/unread pie chart
const pieChartData = [
  { name: 'Lidos', value: stats.read, color: '#4ade80' },
  { name: 'Pendentes', value: stats.pending, color: '#facc15' },
  { name: 'Atrasados', value: stats.late, color: '#f87171' },
];

// Data for programs bar chart
const programsData = [
  { name: 'Manhã Total', readOnTime: 1, readLate: 1, pending: 0 },
  { name: 'Tarde Show', readOnTime: 0, readLate: 0, pending: 2 },
];

const Relatorios: React.FC = () => {
  const [activeTab, setActiveTab] = useState('execucao');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = (format: 'pdf' | 'excel') => {
    toast({
      title: `Relatório exportado com sucesso`,
      description: `O arquivo foi exportado no formato ${format.toUpperCase()}.`,
    });
  };

  const filteredTestimonials = testimonials.filter(item => {
    const matchesSearch = item.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sponsor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.program.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesProgram = !programFilter || item.program === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'read':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Lido</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'late':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Atrasado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <Header notificationCount={stats.pending + stats.late} />
      
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
              <ReportChart type="pie" data={pieChartData} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Programa</CardTitle>
              <CardDescription>Testemunhais lidos, atrasados e pendentes por programa</CardDescription>
            </CardHeader>
            <CardContent>
              <ReportChart type="bar" data={programsData} />
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
                    {filteredTestimonials.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sponsor}</TableCell>
                        <TableCell>{item.program}</TableCell>
                        <TableCell>{item.scheduledTime}</TableCell>
                        <TableCell>{item.readTime || "-"}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <TableHead>Patrocinador</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Horário Programado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTestimonials
                      .filter(item => item.status === 'pending' || item.status === 'late')
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.sponsor}</TableCell>
                          <TableCell>{item.program}</TableCell>
                          <TableCell>{item.scheduledTime}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
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
                      <TableHead>Patrocinador</TableHead>
                      <TableHead>Texto</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Leituras</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTestimonials.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sponsor}</TableCell>
                        <TableCell className="max-w-xs truncate">{item.text}</TableCell>
                        <TableCell>{item.program}</TableCell>
                        <TableCell>{item.scheduledTime}</TableCell>
                        <TableCell>3 de 5</TableCell>
                        <TableCell>30 min</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Ajustar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Relatorios;
