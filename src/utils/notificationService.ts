/**
 * Notification Service for Web Push and In-App Notifications
 * Handles browser Permissions, Web Audio Chimes, and Native Notification API
 */

import { Order, Product, PushNotification } from '../types';
import { resolveImageUrl } from './imageUrl';

export const ORDER_STATUS_LABELS: Record<Order['orderStatus'], { label: string; emoji: string; desc: string }> = {
  presupuesto_pendiente: {
    label: 'Presupuesto Pendiente',
    emoji: '📝',
    desc: 'Tu solicitud de presupuesto ha sido registrada y está siendo revisada.'
  },
  presupuesto_enviado: {
    label: 'Presupuesto Listo para Pagar',
    emoji: '💳',
    desc: 'Tu cotización fue verificada por depósito. Puedes proceder con el pago.'
  },
  pagado: {
    label: 'Pago Acreditado',
    emoji: '💰',
    desc: 'Tu pago fue recibido exitosamente. Tu pedido pasa a depósito.'
  },
  en_preparacion: {
    label: 'En Preparación en Depósito',
    emoji: '📦',
    desc: 'Los artículos están siendo embalados y acondicionados para el despacho.'
  },
  enviado: {
    label: 'Despachado en Camino',
    emoji: '🚚',
    desc: 'El paquete ya está en manos del transporte o correo rumbo a tu destino.'
  },
  despachado: {
    label: 'En Reparto a Domicilio',
    emoji: '🛵',
    desc: 'El paquete se encuentra en distribución para ser entregado hoy.'
  },
  entregado: {
    label: '¡Pedido Entregado!',
    emoji: '✅',
    desc: 'Tu pedido fue entregado satisfactoriamente. ¡Esperamos que lo disfrutes!'
  },
  cancelado: {
    label: 'Pedido Cancelado',
    emoji: '❌',
    desc: 'El pedido ha sido cancelado o rechazado por administración.'
  }
};

/**
 * Synthesizes a soft, pleasant notification chime using Web Audio API
 * No external mp3 file required
 */
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First pleasant chime tone (F#5 ~ 740 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(740, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Second harmonic bell tone (A5 ~ 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.62);
  } catch {
    // Audio context may be restricted before user gesture, safely ignore
  }
};

/**
 * Check if the browser supports Notification API
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current browser notification permission
 */
export const getBrowserNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestPushNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
};

/**
 * Sends a native system push notification
 */
export const sendNativePushNotification = (notification: {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}) => {
  if (!isNotificationSupported()) return null;

  if (Notification.permission === 'granted') {
    try {
      const defaultIcon = '/assets/aistudio/LOGO_55e42e2f.jpg';
      const nativeNotif = new Notification(notification.title, {
        body: notification.body,
        icon: resolveImageUrl(notification.icon || defaultIcon),
        tag: notification.tag || `notif-${Date.now()}`,
        badge: resolveImageUrl(defaultIcon),
        silent: false
      });

      if (notification.onClick) {
        nativeNotif.onclick = () => {
          window.focus();
          notification.onClick!();
          nativeNotif.close();
        };
      }

      return nativeNotif;
    } catch (err) {
      console.warn('Could not trigger native notification:', err);
    }
  }
  return null;
};
