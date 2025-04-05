
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReportChart from '@/components/ReportChart';
import PerformanceChart from '@/components/PerformanceChart';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Calendar as CalendarIcon, 
  BarChart4, 
  PieChart 
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define types for our data
interface StatusCount {
  status: string;
  count: number;
  start_date: string | null;
  end_date: string | null;
}

interface ProgramStatusCount {
  programa_id: string;
  programa_nome: string;
  status: string;
  count: number;
  start_date: string | null;
  end_date: string | null;
}

// Type for chart data
interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface BarChartData {
  name: string;
  readOnTime: number;
  readLate: number;
  pending: number;
}

const Relatorios = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState<ChartData[]>([]);
  const [programData, setProgramData] = useState<BarChartData[]>([]);
  const [dailyData, setDailyData] = useState<BarChartData[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      
      try {
        // Format date for queries
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        
        // Query for status statistics from the view
        const { data: statusStats, error: statusError } = await supabase
          .from('count_content_by_status')
          .select('*')
          .eq('start_date', startDate)
          .eq('end_date', endDate);
          
        if (statusError) throw statusError;
        
        // Transform status data for pie chart
        const pieData = statusStats ? (statusStats as StatusCount[]).map((item) => {
          const getColor = (status: string) => {
            switch(status) {
              case 'lido': return '#4ade80'; // green
              case 'atrasado': return '#f87171'; // red
              case 'pendente': return '#facc15'; // yellow
              default: return '#94a3b8'; // gray
            }
          };
          
          const getLabel = (status: string) => {
            switch(status) {
              case 'lido': return 'Lidos';
              case 'atrasado': return 'Atrasados';
              case 'pendente': return 'Pendentes';
              default: return status;
            }
          };
          
          return {
            name: getLabel(item.status),
            value: parseInt(item.count.toString()),
            color: getColor(item.status)
          };
        }) : [];
        
        setStatusData(pieData);
        
        // Query for program statistics from the view
        const { data: programStats, error: programError } = await supabase
          .from('count_content_by_program_status')
          .select('*')
          .eq('start_date', startDate)
          .eq('end_date', endDate);
          
        if (programError) throw programError;
        
        // Transform program data
        const programsMap: Record<string, BarChartData> = {};
        
        if (programStats) {
          (programStats as ProgramStatusCount[]).forEach(item => {
            const programName = item.programa_nome || 'Sem Programa';
            
            if (!programsMap[programName]) {
              programsMap[programName] = {
                name: programName,
                readOnTime: 0,
                readLate: 0,
                pending: 0
              };
            }
            
            switch(item.status) {
              case 'lido':
                programsMap[programName].readOnTime += parseInt(item.count.toString());
                break;
              case 'atrasado':
                programsMap[programName].readLate += parseInt(item.count.toString());
                break;
              case 'pendente':
                programsMap[programName].pending += parseInt(item.count.toString());
                break;
            }
          });
        }
        
        setProgramData(Object.values(programsMap));
        
        // Generate daily data (simplified mock data for now)
        // In a real scenario, you'd query per day and aggregate
        const daysInMonth = eachDayOfInterval({
          start: startOfMonth(date),
          end: endOfMonth(date)
        });
        
        const mockDailyData = daysInMonth.map(day => {
          // Random values for demonstration
          const total = Math.floor(Math.random() * 50) + 20;
          const read = Math.floor(Math.random() * total);
          
          return {
            date: format(day, 'dd/MM'),
            name: format(day, 'EEE', { locale: ptBR }),
            readOnTime: read,
            readLate: Math.floor(Math.random() * (total - read) / 2),
            pending: total - read - Math.floor(Math.random() * (total - read) / 2)
          };
        });
        
        setDailyData(mockDailyData);
      } catch (error) {
        console.error('Erro ao carregar dados de relatórios:', error);
        toast.error('Erro ao carregar relatórios', {
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReportData();
  }, [date]);
  
  const handleExportReport = () => {
    // This would be implemented to generate a PDF or Excel report
    toast.success('Relatório exportado com sucesso!');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1">
            Visualize estatísticas de leitura de conteúdos da rádio
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(date, 'MMMM yyyy', { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                defaultMonth={date}
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={handleExportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid place-items-center h-80">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Carregando relatórios...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Status Geral</CardTitle>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ReportChart type="pie" data={statusData} />
                ) : (
                  <div className="h-[300px] grid place-items-center">
                    <p className="text-muted-foreground">Sem dados para exibir</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Desempenho por Programa</CardTitle>
              </CardHeader>
              <CardContent>
                {programData.length > 0 ? (
                  <ReportChart type="bar" data={programData} />
                ) : (
                  <div className="h-[300px] grid place-items-center">
                    <p className="text-muted-foreground">Sem dados para exibir</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="chart">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Análise Diária</h2>
              <TabsList>
                <TabsTrigger value="chart" className="gap-2">
                  <BarChart4 className="h-4 w-4" />
                  Gráfico
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-2">
                  <PieChart className="h-4 w-4" />
                  Performance
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chart">
              <Card>
                <CardContent className="pt-6">
                  {dailyData.length > 0 ? (
                    <ReportChart type="bar" data={dailyData} />
                  ) : (
                    <div className="h-[300px] grid place-items-center">
                      <p className="text-muted-foreground">Sem dados para exibir</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="performance">
              <PerformanceChart />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
