
# Configuração de Chaves de API para o RadioManager

Este documento explica como configurar as chaves de API necessárias para o funcionamento completo do RadioManager, incluindo as chaves do Supabase.

## Chaves do Supabase

As chaves do Supabase são essenciais para o funcionamento do banco de dados e autenticação.

### Configurar via interface do RadioManager

1. Na tela de login, clique em "Configurar chaves do Supabase" (visível apenas no modo de desenvolvimento)
2. Insira sua URL do Supabase e Chave Anônima quando solicitado
3. Recarregue a página para aplicar as alterações

### Configurar manualmente via console do navegador

1. Abra o RadioManager no navegador
2. Abra o console do navegador (F12 ou Ctrl+Shift+I)
3. Cole o seguinte código no console e pressione Enter:

```javascript
localStorage.setItem('supabase_url', 'SUA_URL_DO_SUPABASE');
localStorage.setItem('supabase_anon_key', 'SUA_CHAVE_ANÔNIMA_DO_SUPABASE');
console.log('Chaves do Supabase configuradas com sucesso!');
location.reload();
```

## Segurança

As chaves de API são armazenadas localmente no navegador usando localStorage. Isso significa que:

1. As chaves não são enviadas para o servidor
2. As chaves não são compartilhadas entre navegadores ou dispositivos
3. As chaves persistem mesmo após fechar o navegador, mas podem ser perdidas se você limpar os dados do navegador

**IMPORTANTE**: Nunca compartilhe suas chaves de API.

## Verificar se as chaves estão configuradas

Para verificar se as chaves estão configuradas corretamente:

1. Abra o console do navegador
2. Execute os comandos:
   ```javascript
   console.log('Supabase URL:', localStorage.getItem('supabase_url'));
   console.log('Supabase Anon Key:', localStorage.getItem('supabase_anon_key'));
   ```
