
import React from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartData {
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

interface ReportChartProps {
  type: 'pie' | 'bar';
  data: PieChartData[] | BarChartData[];
}

const ReportChart: React.FC<ReportChartProps> = ({ type, data }) => {
  if (type === 'pie') {
    const pieData = data as PieChartData[];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  
  if (type === 'bar') {
    const barData = data as BarChartData[];
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={barData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="readOnTime" name="Lidos no Horário" fill="#4ade80" />
          <Bar dataKey="readLate" name="Lidos com Atraso" fill="#f87171" />
          <Bar dataKey="pending" name="Pendentes" fill="#facc15" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  
  return null;
};

export default ReportChart;
