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

// Função para manter a tela acesa
let wakeLock: any = null;

export const keepScreenAwake = async (): Promise<void> => {
  if (!isMobileDevice() || !('wakeLock' in navigator)) return;
  
  try {
    // @ts-ignore - A API WakeLock pode não estar definida em todos os navegadores
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('WakeLock ativado');
    
    wakeLock.addEventListener('release', () => {
      console.log('WakeLock foi liberado');
      wakeLock = null;
    });
  } catch (error) {
    console.error('Erro ao tentar manter a tela acesa:', error);
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

// Função para notificar sobre testemunhais próximos
export const notifyUpcomingTestimonial = (count: number): void => {
  if (!isMobileDevice()) return;
  
  // Vibrar o dispositivo
  vibrateDevice();
  
  // Manter a tela acesa
  keepScreenAwake();
  
  // Reproduzir som de notificação
  playNotificationSound();
  
  // Mostrar notificação se suportado
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('RadioManager', {
      body: `${count} testemunhal${count > 1 ? 'is' : ''} programado${count > 1 ? 's' : ''} nos próximos minutos`,
      icon: '/favicon.ico'
    });
  }
};
