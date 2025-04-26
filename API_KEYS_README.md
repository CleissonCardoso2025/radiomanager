# Configuração de Chaves de API para o RadioManager

Este documento explica como configurar as chaves de API necessárias para o funcionamento completo do RadioManager.

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
