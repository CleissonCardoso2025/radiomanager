
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Program {
  id: string;
  name: string;
  time: string;
  presenter: string;
  status: string;
}

interface ProgramsTableProps {
  programs: Program[];
  className?: string;
}

const ProgramsTable: React.FC<ProgramsTableProps> = ({ programs, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter programs based on search term
  const filteredPrograms = programs.filter(program => 
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.presenter.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Programas Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Pesquisar programas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button className="rounded-full gap-2 px-5 bg-primary hover:bg-primary/90 button-hover">
            <Plus size={18} />
            <span>Novo Programa</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <TableHeader>Programa</TableHeader>
                <TableHeader>Horário</TableHeader>
                <TableHeader>Apresentador</TableHeader>
                <TableHeader>Status</TableHeader>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((program) => (
                <tr 
                  key={program.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>{program.time}</TableCell>
                  <TableCell>{program.presenter}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {program.status}
                    </span>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Mostrando {filteredPrograms.length} de {programs.length} programas
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 bg-primary text-white border-primary">
              1
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
              2
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

const TableCell: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <td className={cn("px-4 py-4 text-sm", className)}>
    {children}
  </td>
);

export default ProgramsTable;
