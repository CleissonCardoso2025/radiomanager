# Configuração de Chaves de API para o RadioManager

Este documento explica como configurar as chaves de API necessárias para o funcionamento completo do RadioManager, incluindo as chaves do Supabase e da OpenAI.

## Chave da OpenAI

A chave da OpenAI é necessária para o assistente de criação de conteúdo na página de Produção. Sem esta chave, o assistente de conteúdo não funcionará.

### Opção 1: Configurar pela interface do usuário (Recomendado)

1. Faça login no RadioManager como administrador
2. Acesse a página de Configurações
3. Vá para a aba "APIs"
4. Clique em "Adicionar Chave"
5. Preencha os campos:
   - **Nome da Chave**: `openai` (exatamente como escrito)
   - **Valor da Chave**: `[INSIRA SUA CHAVE DA OPENAI AQUI]`
6. Clique em "Salvar Chave"

### Opção 2: Configurar via console do navegador

1. Abra o RadioManager no navegador
2. Abra o console do navegador (F12 ou Ctrl+Shift+I)
3. Cole o seguinte código no console e pressione Enter:

```javascript
localStorage.setItem('api_key_openai', '[INSIRA SUA CHAVE DA OPENAI AQUI]');
console.log('Chave da OpenAI configurada com sucesso!');
```

### Opção 3: Usar o script fornecido

1. Abra o arquivo `set_api_key.js` no editor de código
2. Copie todo o conteúdo do arquivo
3. Abra o console do navegador no RadioManager
4. Cole o código no console e pressione Enter

## Segurança

As chaves de API são armazenadas localmente no navegador usando localStorage. Isso significa que:

1. As chaves não são enviadas para o servidor
2. As chaves não são compartilhadas entre navegadores ou dispositivos
3. As chaves persistem mesmo após fechar o navegador, mas podem ser perdidas se você limpar os dados do navegador

**IMPORTANTE**: Nunca compartilhe suas chaves de API. O arquivo `set_api_key.js` está configurado para ser ignorado pelo Git, então não será enviado para o repositório.

## Verificar se a chave está configurada

Para verificar se a chave da OpenAI está configurada corretamente:

1. Abra o console do navegador
2. Execute o comando: `console.log(localStorage.getItem('api_key_openai'))`
3. Você deve ver a chave da API impressa no console

## Chaves do Supabase

As chaves do Supabase são essenciais para o funcionamento do banco de dados e autenticação. O RadioManager agora usa variáveis de ambiente para gerenciar essas chaves de forma segura.

### Opção 1: Configurar via arquivo .env (Desenvolvimento)

1. Crie um arquivo `.env` na raiz do projeto (este arquivo já está no .gitignore)
2. Adicione as seguintes variáveis:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```
3. Reinicie o servidor de desenvolvimento

### Opção 2: Configurar via Docker/VPS (Produção)

Se estiver usando Docker ou uma VPS, configure as variáveis de ambiente no container:

1. No arquivo `docker-compose.yml`:
   ```yaml
   environment:
     - VITE_SUPABASE_URL=sua_url_do_supabase
     - VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

2. Ou diretamente no comando docker run:
   ```bash
   docker run -e VITE_SUPABASE_URL=sua_url_do_supabase -e VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase ...
   ```

### Opção 3: Configurar em serviços de hospedagem

Se estiver usando Vercel, Netlify ou similar:

1. Configure as variáveis de ambiente no painel de administração do serviço
2. Certifique-se de usar os mesmos nomes: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

## Hierarquia de busca de chaves

O RadioManager busca as chaves na seguinte ordem:

1. Variáveis de ambiente no Docker/VPS
2. Variáveis de ambiente Vite (.env)
3. localStorage (desenvolvimento local)

Esta hierarquia garante flexibilidade em diferentes ambientes de execução.
