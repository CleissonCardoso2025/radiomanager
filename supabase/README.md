# Instruções para o Banco de Dados Supabase

## Tabela de Produção de Conteúdo

Para implementar a nova funcionalidade de "Produção de Conteúdo", é necessário criar uma nova tabela no banco de dados Supabase. Siga as instruções abaixo:

### Opção 1: Usando o Editor SQL do Supabase

1. Acesse o painel de controle do Supabase (https://app.supabase.io)
2. Selecione seu projeto
3. Navegue até "SQL Editor" no menu lateral
4. Crie uma nova query
5. Cole o conteúdo do arquivo `migrations/create_conteudos_produzidos.sql`
6. Execute a query

### Opção 2: Usando a CLI do Supabase

Se você tem a CLI do Supabase configurada, pode executar:

```bash
supabase db push
```

## Estrutura da Tabela

A tabela `conteudos_produzidos` possui a seguinte estrutura:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (chave primária) |
| nome | TEXT | Nome do conteúdo |
| conteudo | TEXT | Texto do conteúdo |
| programa_id | UUID | Referência ao programa relacionado |
| data_programada | DATE | Data em que o conteúdo será apresentado |
| horario_programado | TIME | Horário em que o conteúdo será apresentado |
| status | TEXT | Status do conteúdo (pendente, lido, atrasado) |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data da última atualização |

## Relacionamentos

A tabela `conteudos_produzidos` tem um relacionamento com a tabela `programas` através da coluna `programa_id`.

## Políticas de Segurança (RLS)

As políticas de segurança configuradas permitem que qualquer usuário autenticado possa ler, inserir, atualizar e excluir registros na tabela `conteudos_produzidos`.
