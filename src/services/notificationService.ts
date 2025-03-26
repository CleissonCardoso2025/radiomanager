
/**
 * Serviço de notificações para dispositivos móveis
 * Gerencia vibração e manter a tela acesa para testemunhais próximos
 */

// Função para verificar se o dispositivo é móvel
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Função para reproduzir som de notificação
export const playNotificationSound = (soundType: 'alert' | 'success' = 'alert'): void => {
  if (!isMobileDevice()) return;
  
  try {
    const sound = new Audio();
    
    if (soundType === 'alert') {
      sound.src = '/sounds/notification-alert.mp3';
    } else {
      sound.src = '/sounds/notification-success.mp3';
    }
    
    // Verificar se o áudio está carregado antes de reproduzir
    sound.oncanplaythrough = () => {
      sound.play().catch(error => {
        console.error('Erro ao reproduzir som de notificação:', error);
      });
    };
    
    // Definir um timeout para evitar que o áudio fique carregando indefinidamente
    setTimeout(() => {
      if (sound.readyState < 4) { // 4 = HAVE_ENOUGH_DATA
        console.warn('Timeout ao carregar som de notificação');
      }
    }, 3000);
  } catch (error) {
    console.error('Erro ao criar objeto de áudio:', error);
  }
};

// Função para fazer o dispositivo vibrar
export const vibrateDevice = (pattern?: number | number[]): void => {
  if (!isMobileDevice() || !window.navigator.vibrate) return;
  
  try {
    window.navigator.vibrate(pattern || [200, 100, 200]);
  } catch (error) {
    console.error('Erro ao tentar vibrar o dispositivo:', error);
  }
};

// Variável para armazenar a instância de WakeLock
let wakeLock: any = null;

// Função para manter a tela acesa
export const keepScreenAwake = async (): Promise<void> => {
  if (!isMobileDevice()) return;
  
  try {
    // Verificar se já existe um WakeLock ativo
    if (wakeLock) {
      console.log('WakeLock já está ativo');
      return;
    }
    
    // Verificar se a API WakeLock está disponível
    if (!('wakeLock' in navigator)) {
      console.warn('API WakeLock não está disponível neste navegador');
      // Alternativa: tentar usar notificação para acordar a tela
      showScreenWakeNotification();
      return;
    }
    
    // @ts-ignore - A API WakeLock pode não estar definida em todos os navegadores
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('WakeLock ativado com sucesso');
    
    wakeLock.addEventListener('release', () => {
      console.log('WakeLock foi liberado');
      wakeLock = null;
    });
  } catch (error) {
    console.error('Erro ao tentar manter a tela acesa:', error);
    // Se falhar, tentar método alternativo
    showScreenWakeNotification();
  }
};

// Função para liberar o WakeLock e permitir que a tela apague
export const releaseScreenWakeLock = (): void => {
  if (wakeLock) {
    wakeLock.release()
      .then(() => {
        console.log('WakeLock liberado manualmente');
        wakeLock = null;
      })
      .catch((error: any) => {
        console.error('Erro ao liberar WakeLock:', error);
      });
  }
};

// Função para mostrar notificação que pode acordar a tela
export const showScreenWakeNotification = (): void => {
  if (!isMobileDevice()) return;
  
  // Verificar se API de notificações está disponível
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações');
    return;
  }
  
  // Verificar permissão
  if (Notification.permission === 'granted') {
    sendWakeNotification();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendWakeNotification();
      }
    });
  }
};

// Função para enviar a notificação que acorda a tela
const sendWakeNotification = (): void => {
  try {
    const notification = new Notification('RadioManager - Testemunhal Próximo', {
      body: 'Toque para ver o testemunhal programado',
      icon: '/favicon.ico',
      requireInteraction: true,
      silent: false
    });
    
    // Vibrar o dispositivo ao mostrar a notificação
    vibrateDevice();
    
    // Reproduzir som ao mostrar a notificação
    playNotificationSound('alert');
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};

// Função principal para notificar sobre testemunhais próximos
export const notifyUpcomingTestimonial = (count: number, isExactTime: boolean = false): void => {
  if (!isMobileDevice()) return;
  
  // Vibrar o dispositivo
  vibrateDevice();
  
  // Manter a tela acesa - prioridade máxima para testemunhais no horário exato
  if (isExactTime) {
    // Tentativa mais agressiva de manter a tela acesa
    keepScreenAwake();
    // Além de tentar WakeLock, também usa notificação como fallback
    showScreenWakeNotification();
  } else {
    // Comportamento padrão para testemunhais próximos
    keepScreenAwake();
  }
  
  // Reproduzir som de notificação
  playNotificationSound();
  
  // Mostrar notificação se suportado
  if ('Notification' in window && Notification.permission === 'granted') {
    const message = isExactTime 
      ? `AGORA: ${count} testemunhal${count > 1 ? 'is' : ''} programado${count > 1 ? 's' : ''} para ESTE MOMENTO!` 
      : `${count} testemunhal${count > 1 ? 'is' : ''} programado${count > 1 ? 's' : ''} nos próximos minutos`;
      
    new Notification('RadioManager', {
      body: message,
      icon: '/favicon.ico',
      requireInteraction: isExactTime, // Manter a notificação visível se for no horário exato
      silent: false
    });
  }
};

