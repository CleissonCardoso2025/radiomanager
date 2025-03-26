
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Função para solicitar permissão de notificação
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Erro ao solicitar permissão para notificações:', error);
      }
    }
  }
};

// Função para inicializar a aplicação
const initializeApp = () => {
  // Solicitar permissão de notificação ao iniciar o aplicativo
  requestNotificationPermission();
  
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
