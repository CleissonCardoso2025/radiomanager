
import { useState, useMemo } from 'react';

export function useFilteredItems(testemunhais: any[], conteudos: any[]) {
  const [searchText, setSearchText] = useState('');

  const filteredItems = useMemo(() => {
    return [...(testemunhais || []), ...(conteudos || [])].filter(item => {
      if (!item) return false;
      
      const searchLower = searchText.toLowerCase();
      return (
        (item.texto && typeof item.texto === 'string' && item.texto.toLowerCase().includes(searchLower)) ||
        (item.programas && item.programas.nome && typeof item.programas.nome === 'string' && item.programas.nome.toLowerCase().includes(searchLower)) ||
        (item.patrocinador && typeof item.patrocinador === 'string' && item.patrocinador.toLowerCase().includes(searchLower)) ||
        (item.nome && typeof item.nome === 'string' && item.nome.toLowerCase().includes(searchLower))
      );
    });
  }, [testemunhais, conteudos, searchText]);

  return { filteredItems, searchText, setSearchText };
}
