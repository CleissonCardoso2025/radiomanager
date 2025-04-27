
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiKeyService } from '@/services/apiKeyService';

interface ContentFormProps {
  formData: any;
  handleFormChange: (field: string, value: any) => void;
  programas: any[];
  isGeneratingContent: boolean;
  setIsGeneratingContent: (value: boolean) => void;
  showAiOptions: boolean;
  setShowAiOptions: (value: boolean) => void;
}

export function ContentForm({
  formData,
  handleFormChange,
  programas,
  isGeneratingContent,
  setIsGeneratingContent,
  showAiOptions,
  setShowAiOptions
}: ContentFormProps) {
  const [contentType, setContentType] = React.useState<string>("");
  const [customContentType, setCustomContentType] = React.useState<string>("");
  const [contentTone, setContentTone] = React.useState<string>("");
  const [keyInfo, setKeyInfo] = React.useState<string>("");

  const handleContentGenerated = async (content: string) => {
    handleFormChange('conteudo', content);
  };

  return (
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
              handleContentGenerated('');
              try {
                const tipo = contentType === 'Outro' ? customContentType : contentType;
                const prompt = `Gere um título curto e um texto pronto para locução, sem explicações, instruções, marcações ou estrutura de produção.\nRetorne o título na primeira linha, e o texto a partir da segunda linha.\nTipo: ${tipo}.\nO texto deve ter aproximadamente ${formData.wordCount} palavras, não ultrapasse esse limite.\nSeja objetivo e priorize o conteúdo essencial.\nTom: ${contentTone || 'Neutro'}.\nFinalidade/detalhes: ${keyInfo}`;
                
                const response = await apiKeyService.callOpenAI([
                  { role: 'system', content: 'Você é um assistente especializado em criação de conteúdo para rádio.' },
                  { role: 'user', content: prompt }
                ]);
                
                if (response.error) {
                  toast.error('Erro da IA: ' + (response.error.message || JSON.stringify(response.error)));
                  handleContentGenerated('');
                  return;
                }
                
                let content = '';
                if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
                  content = response.choices[0].message.content;
                }
                
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
                
                if (titulo) {
                  handleFormChange('nome', titulo);
                }
                handleContentGenerated(content);
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
  );
}
