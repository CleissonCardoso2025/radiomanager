/**
 * Serviço de notificações para dispositivos móveis
 * Gerencia vibração e manter a tela acesa para testemunhais próximos
 */

// Função para verificar se o dispositivo é móvel
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
  
  // Mostrar notificação se suportado
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('RadioManager', {
      body: `${count} testemunhal${count > 1 ? 'is' : ''} programado${count > 1 ? 's' : ''} nos próximos minutos`,
      icon: '/favicon.ico'
    });
  }
};
