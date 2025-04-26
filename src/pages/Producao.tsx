import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, FileText, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface ConteudoProduzido {
  id: string;
  nome: string;
  conteudo: string;
  data_programada: string;
  horario_programado: string;
  programa_id: string;
  status: string;
  recorrente: boolean;
  lido_por: string[] | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  programas?: {
    id: string;
    nome: string;
  };
  [key: string]: any;
}

function Producao() {
  const [programas, setProgramas] = useState<any[]>([]);
  const [openAiModel, setOpenAiModel] = useState<string>('gpt-3.5-turbo-0125');

  useEffect(() => {
    fetchProgramas();
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
  
  const [conteudosProduzidos, setConteudosProduzidos] = useState<ConteudoProduzido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ConteudoProduzido | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [notificationCount, setNotificationCount] = useState(0);
  
  // Estados para assistente de conteúdo
  const [contentType, setContentType] = useState<string>("");
  const [customContentType, setCustomContentType] = useState<string>("");
  const [contentTone, setContentTone] = useState<string>("");
  const [keyInfo, setKeyInfo] = useState<string>("");
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [showAiOptions, setShowAiOptions] = useState(false);

  useEffect(() => {
    fetchConteudosProduzidos();
  }, []);

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
        setIsLoading(false);
        return;
      }
      
      const conteudosFormatados = (data?.map(item => ({
        ...item,
        nome: item.nome || 'Sem título',
        conteudo: item.conteudo || 'Sem conteúdo',
        data_programada: item.data_programada || '',
        horario_programado: item.horario_programado || '',
        programa_id: item.programa_id || '',
        status: item.status || 'pendente',
        recorrente: item.recorrente || false,
        lido_por: item.lido_por || []
      })) as unknown as ConteudoProduzido[]) || [];
      
      setConteudosProduzidos(conteudosFormatados);
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

  const handleEdit = (item: ConteudoProduzido) => {
    setSelectedItem(item);
    setFormData({
      ...item,
      programa_id: item.programa_id || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item: ConteudoProduzido) => {
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
    // Validação básica
    if (!formData.nome || !formData.conteudo || !formData.programa_id) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    try {
      setIsLoading(true);
      // Remove campos que não existem no schema do banco
      const { wordCount, ...formDataRest } = formData;
      // Determina se o conteúdo é recorrente com base nas datas de início e fim
      const isRecorrente = formData.data_fim && formData.data_programada && 
                          new Date(formData.data_fim) > new Date(formData.data_programada);
      
      // Remover campos que não pertencem ao schema da tabela
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

  const handleContentGenerated = (content: string) => {
    setFormData(prev => ({
      ...prev,
      conteudo: content
    }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Filtragem e paginação
  const filteredConteudos = conteudosProduzidos.filter(conteudo =>
    conteudo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conteudo.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conteudo.programas?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastConteudo = currentPage * itemsPerPage;
  const indexOfFirstConteudo = indexOfLastConteudo - itemsPerPage;
  const currentConteudos = filteredConteudos.slice(indexOfFirstConteudo, indexOfLastConteudo);
  const totalPages = Math.ceil(filteredConteudos.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre mostrar a primeira página
      pages.push(1);
      
      // Calcular páginas do meio
      const startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
      const endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);
      
      // Adicionar elipse se necessário
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Adicionar páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Adicionar elipse se necessário
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Sempre mostrar a última página
      pages.push(totalPages);
    }
    
    return pages;
  };

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
              ) : currentConteudos.length > 0 ? (
                <>
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
                </>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal para adicionar/editar conteúdo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl w-full p-4 md:max-w-3xl overflow-y-auto max-h-[80vh] rounded-lg shadow-lg bg-white dark:bg-gray-900" style={{scrollBehavior:'smooth'}}>
          <DialogHeader>
            <DialogTitle>{selectedItem ? 'Editar Conteúdo' : 'Adicionar Conteúdo'}</DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Edite os detalhes do conteúdo selecionado.' : 'Preencha os detalhes para adicionar um novo conteúdo.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Button 
              variant="outline" 
              className="w-full mb-4"
              onClick={() => setShowAiOptions(!showAiOptions)}
            >
              {showAiOptions ? "Ocultar opções" : "Gerar conteúdo com IA"}
            </Button>

            {showAiOptions && (
              <div className="mb-6 space-y-4 border p-4 rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contentType" className="block mb-2">Tipo de conteúdo</Label>
                    <select
                      id="contentType"
                      className="w-full border rounded px-2 py-1"
                      value={contentType}
                      onChange={e => setContentType(e.target.value)}
                      disabled={isGeneratingContent}
                    >
                      <option value="">Selecione</option>
                      <option value="Boletim esportivo para Rádio">Boletim esportivo para Rádio</option>
                      <option value="Notícia Para Rádio">Notícia Para Rádio</option>
                      <option value="Texto testemunhal">Texto testemunhal</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  
                  {contentType === 'Outro' && (
                    <div>
                      <Label htmlFor="customContentType" className="block mb-2">Especifique</Label>
                      <Input
                        id="customContentType"
                        value={customContentType}
                        onChange={e => setCustomContentType(e.target.value)}
                        disabled={isGeneratingContent}
                        placeholder="Tipo personalizado"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="wordCount" className="block mb-2">Qtd. palavras</Label>
                    <Input
                      id="wordCount"
                      type="number"
                      min={50}
                      max={2000}
                      placeholder="300 palavras = 1.30'"
                      value={formData.wordCount || ''}
                      onChange={e => handleFormChange('wordCount', e.target.value)}
                      disabled={isGeneratingContent}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contentTone" className="block mb-2">Tom</Label>
                    <select
                      id="contentTone"
                      className="w-full border rounded px-2 py-1"
                      value={contentTone}
                      onChange={e => setContentTone(e.target.value)}
                      disabled={isGeneratingContent}
                    >
                      <option value="">Selecione o tom</option>
                      <option value="Neutro">Neutro</option>
                      <option value="Jornalístico">Jornalístico</option>
                      <option value="Engraçado">Engraçado</option>
                      <option value="Informal">Informal</option>
                      <option value="Inspirador">Inspirador</option>
                      <option value="Urgente">Urgente</option>
                      <option value="Criativo">Criativo</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="keyInfo" className="block mb-2">Detalhes</Label>
                  <Textarea
                    id="keyInfo"
                    className="w-full min-h-[80px]"
                    placeholder="O que, por que, onde, qual, quantos, quando, quem..."
                    value={keyInfo}
                    onChange={e => setKeyInfo(e.target.value)}
                    disabled={isGeneratingContent}
                  />
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={async () => {
                    if (!contentType && !customContentType) {
                      toast.error('Selecione o tipo de conteúdo');
                      return;
                    }
                    if (!formData.wordCount) {
                      toast.error('Informe a quantidade de palavras');
                      return;
                    }
                    setIsGeneratingContent(true);
                    // Limpa o campo antes de gerar nova sugestão
                    setGeneratedContent('');
                    handleContentGenerated('');
                    try {
                      const tipo = contentType === 'Outro' ? customContentType : contentType;
                      const prompt = `Gere um título curto e um texto pronto para locução, sem explicações, instruções, marcações ou estrutura de produção.\nRetorne o título na primeira linha, e o texto a partir da segunda linha.\nTipo: ${tipo}.\nO texto deve ter aproximadamente ${formData.wordCount} palavras, não ultrapasse esse limite.\nSeja objetivo e priorize o conteúdo essencial.\nTom: ${contentTone || 'Neutro'}.\nFinalidade/detalhes: ${keyInfo}`;
                      const response = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': 'Bearer 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'
                        },
                        body: JSON.stringify({
                          model: 'gpt-3.5-turbo',
                          messages: [
                            { role: 'system', content: 'Você é um assistente especializado em criação de conteúdo para rádio.' },
                            { role: 'user', content: prompt }
                          ],
                          max_tokens: 1024,
                          temperature: 0.7
                        })
                      });
                      const data = await response.json();
                      console.log('Resposta OpenAI:', data);
                      if (data.error) {
                        toast.error('Erro da IA: ' + (data.error.message || JSON.stringify(data.error)));
                        setGeneratedContent('');
                        handleContentGenerated('');
                        return;
                      }
                      let content = '';
                      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                        content = data.choices[0].message.content;
                      }
                      // Extrai título e corpo
                      let titulo = '';
                      if (content) {
                        const lines = content.split('\n');
                        if (lines.length > 1) {
                          titulo = lines[0].replace(/^\s*[-–—•\d\.)\s]*/, '').trim();
                          content = lines.slice(1).join('\n').trim();
                        } else {
                          titulo = content.slice(0, 60);
                        }
                      }
                      setGeneratedContent(content);
                      handleContentGenerated(content);
                      if (titulo) {
                        setFormData((prev: any) => ({ ...prev, nome: titulo }));
                      }
                      if (content) {
                        toast.success('Conteúdo gerado com sucesso!');
                      } else {
                        toast.error('Não foi possível gerar o conteúdo. Verifique o console para detalhes.');
                      }
                    } catch (err: any) {
                      toast.error('Erro ao gerar conteúdo com IA: ' + (err?.message || err));
                    } finally {
                      setIsGeneratingContent(false);
                    }
                  }}
                  disabled={isGeneratingContent}
                >
                  {isGeneratingContent ? 'Gerando...' : 'Gerar conteúdo'}
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4 modal-grid mt-4">
              <Label htmlFor="nome" className="text-right modal-label">
                Nome
              </Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => handleFormChange('nome', e.target.value)}
                className="col-span-3"
                placeholder="Título do conteúdo"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4 modal-grid">
              <Label htmlFor="conteudo" className="text-right pt-2 modal-label">
                Conteúdo
              </Label>
              <Textarea
                id="conteudo"
                value={formData.conteudo || ''}
                onChange={(e) => handleFormChange('conteudo', e.target.value)}
                className="col-span-3 min-h-[120px]"
                style={{ resize: 'vertical' }}
                placeholder="Texto do conteúdo"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 modal-grid">
              <Label htmlFor="programa_id" className="text-right modal-label">Programa</Label>
              <select
                id="programa_id"
                className="col-span-3 border rounded px-2 py-1"
                value={formData.programa_id || ''}
                onChange={e => handleFormChange('programa_id', e.target.value)}
                required
              >
                <option value="">Selecione um programa</option>
                {Array.isArray(programas) && programas.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 modal-grid">
              <Label htmlFor="data_programada" className="text-right modal-label">Data de início</Label>
              <Input
                id="data_programada"
                type="date"
                className="col-span-3"
                value={formData.data_programada || ''}
                onChange={e => handleFormChange('data_programada', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4 modal-grid">
              <Label htmlFor="data_fim" className="text-right modal-label">Data de fim</Label>
              <div className="col-span-3">
                <Input
                  id="data_fim"
                  type="date"
                  className="w-full"
                  value={formData.data_fim || ''}
                  onChange={e => handleFormChange('data_fim', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se a data de fim for posterior à data de início, o conteúdo será recorrente e aparecerá na agenda todos os dias neste período.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4 modal-grid">
              <Label htmlFor="horario_programado" className="text-right modal-label">Hora agendamento</Label>
              <Input
                id="horario_programado"
                type="time"
                className="col-span-3"
                value={formData.horario_programado || ''}
                onChange={e => handleFormChange('horario_programado', e.target.value)}
                required
              />
            </div>

          </div>
          
          <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="modal-btn" style={{color: '#222', background: '#fff', border: '1px solid #ccc'}}>Cancelar</Button>
            <Button onClick={handleSave} className="modal-btn" style={{color: '#fff', background: '#2563eb'}}>
              {selectedItem ? 'Salvar Alterações' : 'Adicionar Conteúdo'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para exclusão */}
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
