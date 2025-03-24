import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Função para inicializar a aplicação
const initializeApp = () => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

// Inicializar a aplicação
if (document.readyState === 'loading') {
  // Se o documento ainda está carregando, aguardar o evento DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Se o documento já foi carregado, inicializar imediatamente
  initializeApp();
}
