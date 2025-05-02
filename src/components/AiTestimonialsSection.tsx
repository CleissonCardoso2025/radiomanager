import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { useToast } from './ui/use-toast';
import { apiKeyService } from '../services/apiKeyService';

interface AiTestimonialsSectionProps {
  onGenerated?: (result: { titulo: string; texto: string }) => void;
}

const tiposConteudo = [
  { value: 'testemunhal', label: 'Testemunhal' },
  { value: 'anuncio', label: 'Anúncio' },
  { value: 'chamada', label: 'Chamada' },
  { value: 'mensagem', label: 'Mensagem' },
];
const tons = [
  { value: 'neutro', label: 'Neutro' },
  { value: 'entusiasmado', label: 'Entusiasmado' },
  { value: 'formal', label: 'Formal' },
  { value: 'emocional', label: 'Emocional' },
  { value: 'humoristico', label: 'Humorístico' },
];

const AiTestimonialsSection: React.FC<AiTestimonialsSectionProps> = ({ onGenerated }) => {
  const [tipo, setTipo] = useState('testemunhal');
  const [qtdPalavras, setQtdPalavras] = useState(60);
  const [tom, setTom] = useState('neutro');
  const [prompt, setPrompt] = useState('');
  const [resultado, setResultado] = useState<{ titulo: string; texto: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setResultado(null);
    try {
      // Prompt estruturado para forçar retorno de título e texto, respeitando o limite de palavras
      const fullPrompt = `Gere um ${tipo} para rádio, com o seguinte contexto: ${prompt}\nO tom deve ser ${tom}.\nO texto deve ter até ${qtdPalavras} palavras.\nRetorne no seguinte formato:\nTÍTULO: <um título criativo>\nTEXTO: <o texto do depoimento, anúncio ou mensagem>`;
      const messages = [
        { role: 'system', content: 'Você é um gerador de depoimentos para rádios.' },
        { role: 'user', content: fullPrompt },
      ];
      const response = await apiKeyService.callOpenAI(messages);
      const generated = response?.choices?.[0]?.message?.content || '';
      // Extrai título e texto do retorno
      let titulo = '', texto = '';
      const tituloMatch = generated.match(/T[ÍI]TULO\s*:\s*(.+)/i);
      const textoMatch = generated.match(/TEXTO\s*:\s*([\s\S]+)/i);
      if (tituloMatch) titulo = tituloMatch[1].trim();
      if (textoMatch) texto = textoMatch[1].trim();
      setResultado({ titulo, texto });
      if (onGenerated) onGenerated({ titulo, texto });
    } catch (error: any) {
      toast({ title: 'Erro ao gerar depoimento', description: error?.message || 'Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="flex items-center justify-center min-w-[320px] min-h-[380px]">
    <Card className="p-6 space-y-4 w-full max-w-[360px]">
      <h2 className="text-xl font-semibold text-center">Gerador de Depoimentos com IA</h2>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Tipo</label>
            <select
              className="w-full border rounded px-2 py-1 text-xs"
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              disabled={loading}
            >
              {tiposConteudo.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Qtd. Palavras</label>
            <input
              type="number"
              min={20}
              max={250}
              className="w-full border rounded px-2 py-1 text-xs"
              value={qtdPalavras}
              onChange={e => setQtdPalavras(Number(e.target.value))}
              disabled={loading}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Tom</label>
            <select
              className="w-full border rounded px-2 py-1 text-xs"
              value={tom}
              onChange={e => setTom(e.target.value)}
              disabled={loading}
            >
              {tons.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <Textarea
          placeholder="Descreva o contexto para o depoimento..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={3}
          disabled={loading}
        />
      </div>
      <Button onClick={handleGenerate} disabled={loading || !prompt} className="w-full">
        {loading ? 'Gerando...' : 'Gerar Depoimento'}
      </Button>
      {resultado && (
        <Card className="mt-4 bg-muted p-4">
          <h3 className="font-medium mb-2">Título Gerado:</h3>
          <p className="font-semibold mb-2">{resultado.titulo}</p>
          <h3 className="font-medium mb-2">Texto Gerado:</h3>
          <p>{resultado.texto}</p>
        </Card>
      )}
    </Card>
  </div>
);
};

export default AiTestimonialsSection;
