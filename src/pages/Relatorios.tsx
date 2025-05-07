import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { supabase } from '@/integrations/supabase/client';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  programa: string;
  tempoTotal: number;
}

const Relatorios = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | null, to: Date | null }>({
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
      const { data, error } = await supabase.rpc('relatorio_tempo_programas', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });

      if (error) {
        console.error('Erro ao buscar dados do relatório:', error);
        return;
      }

      if (data) {
        const chartData = processChartData(data);
        setRelatorioData(chartData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = (data: any[]) => {
    const chartData: ChartData[] = [];
    
    if (Array.isArray(data)) {
      data.forEach((item) => {
        chartData.push({
          programa: item.programa,
          tempoTotal: item.tempo_total,
        });
      });
    }
    
    return chartData;
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Tempo Total por Programa',
      },
    },
  };

  const chartData = {
    labels: relatorioData.map((item) => item.programa),
    datasets: [
      {
        label: 'Tempo Total (segundos)',
        data: relatorioData.map((item) => item.tempoTotal),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const handleRefresh = () => {
    if (dateRange.from && dateRange.to) {
      fetchRelatorioData(dateRange.from, dateRange.to);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Relatórios de Programas</h1>
      
      <div className="flex items-center justify-between mb-4">
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        <Button onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? 'Carregando...' : 'Atualizar Relatório'}
        </Button>
      </div>

      {relatorioData.length > 0 ? (
        <Bar options={chartOptions} data={chartData} />
      ) : (
        <p>Nenhum dado disponível para o período selecionado.</p>
      )}
    </div>
  );
};

export default Relatorios;
