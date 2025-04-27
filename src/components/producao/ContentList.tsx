
import React from 'react';
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface ContentListProps {
  currentConteudos: any[];
  handleEdit: (item: any) => void;
  handleDelete: (item: any) => void;
  handleAdd: () => void;
}

export function ContentList({ 
  currentConteudos,
  handleEdit,
  handleDelete,
  handleAdd
}: ContentListProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  if (currentConteudos.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum conteúdo encontrado</h3>
        <p className="mt-1 text-gray-500">Comece adicionando um novo conteúdo para seus programas.</p>
        <div className="mt-6">
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Conteúdo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Programa</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recorrente</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentConteudos.map((conteudo) => (
            <TableRow key={conteudo.id}>
              <TableCell className="font-medium">{conteudo.nome}</TableCell>
              <TableCell>{conteudo.programas?.nome || 'N/A'}</TableCell>
              <TableCell>{formatDate(conteudo.data_programada)}</TableCell>
              <TableCell>{conteudo.horario_programado?.substring(0, 5) || 'N/A'}</TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  conteudo.status === 'lido' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {conteudo.status === 'lido' ? 'Lido' : 'Pendente'}
                </span>
              </TableCell>
              <TableCell>
                {conteudo.recorrente ? 'Sim' : 'Não'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(conteudo)}
                  >
                    Editar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDelete(conteudo)}
                  >
                    Excluir
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
