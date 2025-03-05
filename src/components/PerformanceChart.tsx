
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PerformanceChartProps {
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ className }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    const initializeChart = async () => {
      if (!chartRef.current) return;
      
      try {
        // Dynamically import echarts
        const echarts = await import('echarts');
        
        // Initialize chart
        if (chartInstance.current) {
          echarts.dispose(chartInstance.current);
        }
        
        chartInstance.current = echarts.init(chartRef.current);
        
        const option = {
          animation: true,
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            borderColor: 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1,
            padding: [10, 15],
            textStyle: {
              color: '#333',
              fontSize: 12,
            },
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            transitionDuration: 0.4,
          },
          legend: {
            data: ['Leituras Realizadas', 'Leituras Programadas'],
            textStyle: {
              fontSize: 12,
              color: '#666',
            },
            icon: 'circle',
            itemWidth: 8,
            itemHeight: 8,
            itemGap: 15,
            padding: [0, 0, 10, 0],
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true,
          },
          xAxis: {
            type: 'category',
            data: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
            axisLine: {
              lineStyle: {
                color: '#eee',
              },
            },
            axisTick: {
              show: false,
            },
            axisLabel: {
              color: '#999',
              fontSize: 12,
            },
          },
          yAxis: {
            type: 'value',
            splitLine: {
              lineStyle: {
                color: '#f5f5f5',
                type: 'dashed',
              },
            },
            axisLabel: {
              color: '#999',
              fontSize: 12,
            },
          },
          series: [
            {
              name: 'Leituras Realizadas',
              type: 'line',
              data: [120, 132, 101, 134, 90, 230, 210],
              smooth: true,
              symbolSize: 6,
              lineStyle: {
                width: 3,
                color: '#3b82f6',
              },
              itemStyle: {
                color: '#3b82f6',
                borderWidth: 2,
                borderColor: '#fff',
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: 'rgba(59, 130, 246, 0.2)',
                    },
                    {
                      offset: 1,
                      color: 'rgba(59, 130, 246, 0.02)',
                    },
                  ],
                },
              },
              emphasis: {
                scale: true,
              },
              z: 3,
            },
            {
              name: 'Leituras Programadas',
              type: 'line',
              data: [150, 142, 121, 164, 110, 250, 230],
              smooth: true,
              symbolSize: 6,
              lineStyle: {
                width: 3,
                color: '#a78bfa',
              },
              itemStyle: {
                color: '#a78bfa',
                borderWidth: 2,
                borderColor: '#fff',
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    {
                      offset: 0,
                      color: 'rgba(167, 139, 250, 0.2)',
                    },
                    {
                      offset: 1,
                      color: 'rgba(167, 139, 250, 0.02)',
                    },
                  ],
                },
              },
              emphasis: {
                scale: true,
              },
              z: 2,
            },
          ],
        };

        chartInstance.current.setOption(option);
        
        // Add resize listener
        window.addEventListener('resize', () => {
          chartInstance.current?.resize();
        });
      } catch (error) {
        console.error('Failed to initialize chart:', error);
      }
    };

    initializeChart();

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      window.removeEventListener('resize', () => {
        chartInstance.current?.resize();
      });
    };
  }, []);

  return (
    <Card className={cn("overflow-hidden transition-all", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Desempenho Semanal</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
