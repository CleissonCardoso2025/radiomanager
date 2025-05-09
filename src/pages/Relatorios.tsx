
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface ChartData {
  programa: string;
  tempoTotal: number;
}

const Relatorios = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [relatorioData, setRelatorioData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      fetchRelatorioData(dateRange.from, dateRange.to);
    }
  }, [dateRange]);

  const fetchRelatorioData = async (startDate: Date, endDate: Date) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('count_content_by_program_status', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (error) {
        console.error('Erro ao buscar dados do relatório:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        const chartData = processChartData(data);
        setRelatorioData(chartData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = (data: any[]): ChartData[] => {
    const chartData: ChartData[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((item) => {
        chartData.push({
          programa: item.program_name || 'Sem nome',
          tempoTotal: parseInt(item.count) || 0,
        });
      });
    }
    
    return chartData;
  };

  const handleRefresh = () => {
    if (dateRange.from && dateRange.to) {
      fetchRelatorioData(dateRange.from, dateRange.to);
    }
  };

  const handleDateChange = (range: DateRange) => {
    setDateRange(range);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatórios de Programas</h1>
      
      <div className="flex items-center justify-between mb-4">
        <DateRangePicker date={dateRange} onDateChange={handleDateChange} />
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar Relatório'}
        </Button>
      </div>

      {relatorioData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={relatorioData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="programa" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tempoTotal" name="Total de conteúdos" fill="rgba(53, 162, 235, 0.5)" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p>Nenhum dado disponível para o período selecionado.</p>
      )}
    </div>
  );
};

export default Relatorios;
