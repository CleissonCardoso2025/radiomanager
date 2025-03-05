
import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { 
  Checkbox, 
  CheckboxIndicator
} from '@/components/ui/checkbox';
import { BadgeCheck, Clock, Pencil, Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

// Interfaces para tipagem
interface Programa {
  id: string;
  nome: string;
  horario: string;
  dias: number[];
  apresentadores: string;
}

interface Testemunhal {
  id: string;
  texto: string;
  patrocinador: string;
  leituras: number;
  intervalo: number;
  programa: string;
}

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const GerenciamentoProgramas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('programas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [modalType, setModalType] = useState<'programa' | 'testemunhal'>('programa');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Exemplo de dados
  const [programas, setProgramas] = useState<Programa[]>([
    {
      id: '1',
      nome: 'Manhã Especial',
      horario: '08:00',
      dias: [0, 1, 2, 3, 4],
      apresentadores: 'Ricardo Santos, Maria Oliveira',
    },
    {
      id: '2',
      nome: 'Tarde Musical',
      horario: '14:00',
      dias: [0, 2, 4],
      apresentadores: 'João Silva',
    },
  ]);

  const [testemunhais, setTestemunhais] = useState<Testemunhal[]>([
    {
      id: '1',
      texto: 'Supermercado Bom Preço - As melhores ofertas da cidade!',
      patrocinador: 'Supermercado Bom Preço',
      leituras: 3,
      intervalo: 30,
      programa: 'Manhã Especial',
    },
    {
      id: '2',
      texto: 'Farmácia Saúde Total - Cuidando de você e sua família',
      patrocinador: 'Farmácia Saúde Total',
      leituras: 4,
      intervalo: 45,
      programa: 'Tarde Musical',
    },
  ]);

  // Estados para o formulário
  const [formData, setFormData] = useState<any>({
    nome: '',
    horario: '',
    dias: [],
    apresentadores: '',
    texto: '',
    patrocinador: '',
    leituras: 1,
    intervalo: 30,
    programa: '',
  });

  const handleAdd = (type: 'programa' | 'testemunhal') => {
    setModalType(type);
    setSelectedItem(null);
    setFormData({
      nome: '',
      horario: '',
      dias: [],
      apresentadores: '',
      texto: '',
      patrocinador: '',
      leituras: 1,
      intervalo: 30,
      programa: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: any, type: 'programa' | 'testemunhal') => {
    setModalType(type);
    setSelectedItem(item);
    setFormData(type === 'programa' ? {
      nome: item.nome,
      horario: item.horario,
      dias: item.dias,
      apresentadores: item.apresentadores,
    } : {
      texto: item.texto,
      patrocinador: item.patrocinador,
      leituras: item.leituras,
      intervalo: item.intervalo,
      programa: item.programa,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      if ('nome' in selectedItem) {
        // É um programa
        setProgramas(prev => prev.filter(p => p.id !== selectedItem.id));
      } else {
        // É um testemunhal
        setTestemunhais(prev => prev.filter(t => t.id !== selectedItem.id));
      }
      toast.success('Item excluído com sucesso!');
    }
    setIsAlertOpen(false);
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (day: number) => {
    const newDays = formData.dias.includes(day)
      ? formData.dias.filter((d: number) => d !== day)
      : [...formData.dias, day];
    
    setFormData(prev => ({ ...prev, dias: newDays }));
  };

  const handleSave = () => {
    if (modalType === 'programa') {
      const newPrograma: Programa = {
        id: selectedItem ? selectedItem.id : String(Date.now()),
        nome: formData.nome,
        horario: formData.horario,
        dias: formData.dias,
        apresentadores: formData.apresentadores,
      };

      if (selectedItem) {
        // Editar existente
        setProgramas(prev => prev.map(p => p.id === newPrograma.id ? newPrograma : p));
      } else {
        // Adicionar novo
        setProgramas(prev => [...prev, newPrograma]);
      }
    } else {
      const newTestemunhal: Testemunhal = {
        id: selectedItem ? selectedItem.id : String(Date.now()),
        texto: formData.texto,
        patrocinador: formData.patrocinador,
        leituras: formData.leituras,
        intervalo: formData.intervalo,
        programa: formData.programa,
      };

      if (selectedItem) {
        // Editar existente
        setTestemunhais(prev => prev.map(t => t.id === newTestemunhal.id ? newTestemunhal : t));
      } else {
        // Adicionar novo
        setTestemunhais(prev => [...prev, newTestemunhal]);
      }
    }

    toast.success('Item salvo com sucesso!');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header notificationCount={3} />

      <main className="container px-4 sm:px-6 pt-6 pb-16 mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciamento de Programas e Testemunhais</h1>
        </div>

        <Tabs defaultValue="programas" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center border-b mb-6">
            <TabsList className="bg-transparent p-0">
              <TabsTrigger 
                value="programas" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Programas
              </TabsTrigger>
              <TabsTrigger 
                value="testemunhais" 
                className="py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
              >
                Testemunhais
              </TabsTrigger>
            </TabsList>
            <Button className="gap-2 px-4" onClick={() => handleAdd(activeTab === 'programas' ? 'programa' : 'testemunhal')}>
              <Plus size={18} />
              <span>Adicionar Novo</span>
            </Button>
          </div>

          <TabsContent value="programas" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programas.map((programa) => (
                <Card key={programa.id} className="opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{programa.nome}</CardTitle>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(programa, 'programa')}>
                          <Pencil size={18} />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(programa)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{programa.horario}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>{programa.apresentadores}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {programa.dias.map((dia) => (
                          <span
                            key={dia}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {diasSemana[dia]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testemunhais" className="mt-0">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Texto</TableHead>
                        <TableHead>Patrocinador</TableHead>
                        <TableHead>Leituras</TableHead>
                        <TableHead>Intervalo (min)</TableHead>
                        <TableHead>Programa</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testemunhais.map((testemunhal) => (
                        <TableRow key={testemunhal.id}>
                          <TableCell className="font-medium max-w-xs truncate">
                            {testemunhal.texto}
                          </TableCell>
                          <TableCell>{testemunhal.patrocinador}</TableCell>
                          <TableCell>{testemunhal.leituras}</TableCell>
                          <TableCell>{testemunhal.intervalo}</TableCell>
                          <TableCell>{testemunhal.programa}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(testemunhal, 'testemunhal')}>
                                <Pencil size={16} />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(testemunhal)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para adicionar/editar */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Editar' : 'Adicionar'} {modalType === 'programa' ? 'Programa' : 'Testemunhal'}
              </DialogTitle>
            </DialogHeader>

            {modalType === 'programa' ? (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleFormChange('nome', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="horario" className="text-right">
                    Horário
                  </Label>
                  <Input
                    id="horario"
                    value={formData.horario}
                    onChange={(e) => handleFormChange('horario', e.target.value)}
                    placeholder="Ex: 08:00"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Dias
                  </Label>
                  <div className="col-span-3 flex flex-wrap gap-2">
                    {diasSemana.map((dia, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dia-${idx}`}
                          checked={formData.dias.includes(idx)}
                          onCheckedChange={() => handleCheckboxChange(idx)}
                        >
                          <CheckboxIndicator />
                        </Checkbox>
                        <label htmlFor={`dia-${idx}`} className="text-sm font-medium">
                          {dia}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="apresentadores" className="text-right">
                    Apresentadores
                  </Label>
                  <Input
                    id="apresentadores"
                    value={formData.apresentadores}
                    onChange={(e) => handleFormChange('apresentadores', e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="texto" className="text-right">
                    Texto
                  </Label>
                  <Textarea
                    id="texto"
                    value={formData.texto}
                    onChange={(e) => handleFormChange('texto', e.target.value)}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="patrocinador" className="text-right">
                    Patrocinador
                  </Label>
                  <Input
                    id="patrocinador"
                    value={formData.patrocinador}
                    onChange={(e) => handleFormChange('patrocinador', e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="leituras" className="text-right">
                    Leituras
                  </Label>
                  <Input
                    id="leituras"
                    type="number"
                    min="1"
                    value={formData.leituras}
                    onChange={(e) => handleFormChange('leituras', parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="intervalo" className="text-right">
                    Intervalo (min)
                  </Label>
                  <Input
                    id="intervalo"
                    type="number"
                    min="1"
                    value={formData.intervalo}
                    onChange={(e) => handleFormChange('intervalo', parseInt(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="programa" className="text-right">
                    Programa
                  </Label>
                  <Select 
                    value={formData.programa} 
                    onValueChange={(value) => handleFormChange('programa', value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione um programa" />
                    </SelectTrigger>
                    <SelectContent>
                      {programas.map((programa) => (
                        <SelectItem key={programa.id} value={programa.nome}>
                          {programa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" onClick={handleSave}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação para excluir */}
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default GerenciamentoProgramas;
