// Script para adicionar conteúdo de teste à agenda
const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase configuration values for stability
const SUPABASE_URL = "https://elgvdvhlzjphfjufosmt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZ3ZkdmhsempwaGZqdWZvc210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNzk5NzQsImV4cCI6MjA1Njc1NTk3NH0.fa4NJw2dT42JiIVmCoc2mgg_LcdvXN1pOWLaLCYRBho";

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Data atual formatada como YYYY-MM-DD
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];

// Função para adicionar um testemunhal de teste
async function addTestTestimonial() {
  // Primeiro, vamos obter um programa existente para associar o testemunhal
  const { data: programas, error: programasError } = await supabase
    .from('programas')
    .select('id, nome, dias')
    .limit(1);

  if (programasError) {
    console.error('Erro ao buscar programas:', programasError);
    return;
  }

  if (!programas || programas.length === 0) {
    console.error('Nenhum programa encontrado para associar o testemunhal');
    return;
  }

  const programa = programas[0];
  
  // Horário atual + 10 minutos para garantir que apareça como próximo
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const horarioAgendado = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Adicionar testemunhal de teste
  const { data: testimonial, error: testimonialError } = await supabase
    .from('testemunhais')
    .insert([
      {
        patrocinador: 'Patrocinador de Teste',
        texto: 'Este é um testemunhal de teste para diagnóstico da agenda.',
        horario_agendado: horarioAgendado,
        status: 'pendente',
        programa_id: programa.id,
        data_inicio: formattedDate,
        data_fim: null,
        recorrente: true,
        lido_por: []
      }
    ])
    .select();

  if (testimonialError) {
    console.error('Erro ao adicionar testemunhal de teste:', testimonialError);
  } else {
    console.log('Testemunhal de teste adicionado com sucesso:', testimonial);
  }
}

// Função para adicionar um conteúdo produzido de teste
async function addTestContent() {
  // Primeiro, vamos obter um programa existente para associar o conteúdo
  const { data: programas, error: programasError } = await supabase
    .from('programas')
    .select('id, nome, dias')
    .limit(1);

  if (programasError) {
    console.error('Erro ao buscar programas:', programasError);
    return;
  }

  if (!programas || programas.length === 0) {
    console.error('Nenhum programa encontrado para associar o conteúdo');
    return;
  }

  const programa = programas[0];
  
  // Horário atual + 15 minutos para garantir que apareça como próximo
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  const horarioProgramado = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Adicionar conteúdo de teste
  const { data: content, error: contentError } = await supabase
    .from('conteudos_produzidos')
    .insert([
      {
        nome: 'Conteúdo de Teste',
        conteudo: 'Este é um conteúdo de teste para diagnóstico da agenda.',
        horario_programado: horarioProgramado,
        data_programada: formattedDate,
        programa_id: programa.id,
        status: 'pendente',
        recorrente: true,
        lido_por: []
      }
    ])
    .select();

  if (contentError) {
    console.error('Erro ao adicionar conteúdo de teste:', contentError);
  } else {
    console.log('Conteúdo de teste adicionado com sucesso:', content);
  }
}

// Executar as funções
async function run() {
  try {
    await addTestTestimonial();
    await addTestContent();
    console.log('Conteúdo de teste adicionado com sucesso à agenda!');
  } catch (error) {
    console.error('Erro ao adicionar conteúdo de teste:', error);
  }
}

run();
