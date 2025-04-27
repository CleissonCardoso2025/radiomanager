
import React, { useState, useEffect } from 'react';
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import Header from '@/components/Header';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { ContentForm } from '@/components/producao/ContentForm';
import { ContentList } from '@/components/producao/ContentList';
import { Pagination } from '@/components/producao/Pagination';

function Producao() {
  const [programas, setProgramas] = useState<any[]>([]);
  const [conteudosProduzidos, setConteudosProduzidos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [showAiOptions, setShowAiOptions] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  useEffect(() => {
    fetchProgramas();
    fetchConteudosProduzidos();
  }, []);

  const fetchProgramas = async () => {
    const { data, error } = await supabase
      .from('programas')
      .select('*')
      .order('nome');
    if (error) {
      toast.error('Erro ao carregar programas', { description: error.message });
      return;
    }
    setProgramas(data || []);
  };

  const fetchConteudosProduzidos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('conteudos_produzidos')
        .select('*, programas(id, nome)')
        .order('data_programada', { ascending: true });
        
      if (error) {
        console.error('Erro ao carregar conteúdos produzidos:', error);
        toast.error('Erro ao carregar conteúdos produzidos');
        setConteudosProduzidos([]);
        return;
      }
      
      setConteudosProduzidos(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar conteúdos produzidos:', error);
      toast.error('Erro ao carregar conteúdos produzidos');
      setConteudosProduzidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({});
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setFormData({
      ...item,
      programa_id: item.programa_id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      const { error } = await supabase
        .from('conteudos_produzidos')
        .delete()
        .eq('id', selectedItem.id);
      
      if (error) {
        throw error;
      }
      
      setConteudosProduzidos(prev => prev.filter(c => c.id !== selectedItem.id));
      toast.success('Conteúdo excluído com sucesso!');
    } catch (error: any) {
      toast.error(`Erro ao excluir item: ${error.message}`);
    } finally {
      setIsAlertOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.conteudo || !formData.programa_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      setIsLoading(true);
      const { wordCount, ...formDataRest } = formData;
      const isRecorrente = formData.data_fim && formData.data_programada && 
                          new Date(formData.data_fim) > new Date(formData.data_programada);
      
      const { programas, ...cleanFormData } = formDataRest;
      
      const payload = {
        ...cleanFormData,
        programa_id: formData.programa_id,
        nome: formData.nome,
        conteudo: formData.conteudo,
        data_programada: formData.data_programada || null,
        data_fim: formData.data_fim || null,
        horario_programado: formData.horario_programado || null,
        recorrente: isRecorrente,
        status: 'pendente',
        lido_por: [],
      };
      
      const { error } = await supabase
        .from('conteudos_produzidos')
        .upsert(payload);
        
      if (error) {
        throw error;
      }
      
      toast.success('Conteúdo salvo com sucesso!');
      setIsModalOpen(false);
      fetchConteudosProduzidos();
    } catch (err: any) {
      toast.error('Erro ao salvar conteúdo', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredConteudos = conteudosProduzidos.filter(conteudo =>
    conteudo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteudo.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conteudo.programas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastConteudo = currentPage * itemsPerPage;
  const indexOfFirstConteudo = indexOfLastConteudo - itemsPerPage;
  const currentConteudos = filteredConteudos.slice(indexOfFirstConteudo, indexOfLastConteudo);
  const totalPages = Math.ceil(filteredConteudos.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={notificationCount} />

      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-7xl">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Produção de Conteúdo</h1>
              <p className="text-gray-500 mt-1">Gerencie todos os conteúdos produzidos para os programas</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Buscar conteúdo..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button 
                className="gap-2 px-4" 
                onClick={handleAdd}
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Adicionar Conteúdo</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Conteúdos Produzidos</CardTitle>
              <CardDescription>
                Lista de todos os conteúdos produzidos para os programas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  <span className="ml-3">Carregando...</span>
                </div>
              ) : (
                <>
                  <ContentList
                    currentConteudos={currentConteudos}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleAdd={handleAdd}
                  />
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-full p-4 md:max-w-3xl overflow-y-auto max-h-[80vh] rounded-lg shadow-lg bg-white dark:bg-gray-900" style={{scrollBehavior:'smooth'}}>
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}</DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Edite os detalhes do conteúdo selecionado.' : 'Preencha os detalhes para adicionar um novo conteúdo.'}
            </DialogDescription>
          </DialogHeader>
          
          <ContentForm
            formData={formData}
            handleFormChange={handleFormChange}
            programas={programas}
            isGeneratingContent={isGeneratingContent}
            setIsGeneratingContent={setIsGeneratingContent}
            showAiOptions={showAiOptions}
            setShowAiOptions={setShowAiOptions}
          />
          
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {selectedItem ? 'Salvar Alterações' : 'Adicionar Conteúdo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAlertOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Producao;
