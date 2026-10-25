import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Bell,
  BellRing,
  Package,
  Sparkles,
  Tag,
  Check,
  CheckCheck,
  Trash2,
  X,
  ShieldCheck,
  Volume2,
  VolumeX,
  ExternalLink,
  Clock,
  ArrowRight,
  Settings,
  AlertCircle
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import { PushNotification } from '../types';

export const NotificationCenterModal: React.FC = () => {
  const {
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    notifications,
    notificationSettings,
    updateNotificationSettings,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    browserPermission,
    requestPermission,
    triggerPushNotification,
    setTrackingOrderId,
    setIsBudgetTrackingOpen,
    setSelectedProduct,
    products
  } = useStore();

  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'products' | 'settings'>('all');
  const [isRequestingPerm, setIsRequestingPerm] = useState(false);

  if (!isNotificationCenterOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequestingPerm(true);
    try {
      await requestPermission();
    } finally {
      setIsRequestingPerm(false);
    }
  };

  const handleTestNotification = async () => {
    await triggerPushNotification({
      type: 'order_status',
      title: '🚚 ¡Tu pedido #1049 va en camino!',
      message: 'El transporte Andreani ha retirado el paquete de depósito. Llegada estimada en 24-48 hs hábiles.',
      orderId: '1049'
    });
  };

  const handleNotificationClick = (notif: PushNotification) => {
    markNotificationAsRead(notif.id);
    if (notif.orderId) {
      setTrackingOrderId(notif.orderId);
      setIsBudgetTrackingOpen(true);
      setIsNotificationCenterOpen(false);
    } else if (notif.productId) {
      const prod = products.find((p) => p.id === notif.productId);
      if (prod) {
        setSelectedProduct(prod);
        setIsNotificationCenterOpen(false);
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'orders') return n.type === 'order_status';
    if (activeTab === 'products') return n.type === 'new_product';
    return true;
  });

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Hace unos momentos';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl text-slate-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BellRing className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">Notificaciones Push</h3>
                {unreadNotificationsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                    {unreadNotificationsCount} nueva{unreadNotificationsCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Avisos en tiempo real sobre pedidos y novedades
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationCenterOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission Banner */}
        {browserPermission !== 'granted' && (
          <div className="p-4 bg-gradient-to-r from-indigo-950/90 to-blue-950/90 border-b border-indigo-800/60 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-indigo-400 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-white">
                {browserPermission === 'denied'
                  ? 'Notificaciones bloqueadas en el navegador'
                  : 'Habilitar Notificaciones de Escritorio'}
              </h4>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 leading-relaxed">
                {browserPermission === 'denied'
                  ? 'Para recibir avisos en segundo plano, haz clic en el candado de la barra del navegador y permite las notificaciones.'
                  : 'Recibe alertas inmediatas en tu pantalla cuando cambie el estado de tus pedidos o ingresen productos.'}
              </p>
              {browserPermission !== 'denied' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  disabled={isRequestingPerm}
                  className="mt-2.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isRequestingPerm ? 'Solicitando...' : 'Activar en mi Navegador'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2 bg-slate-950/40">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📦 Pedidos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ Novedades
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'settings' ? 'all' : 'settings')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Preferencias de notificaciones"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Actions bar */}
        {activeTab !== 'settings' && notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/20">
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como leídas</span>
            </button>

            <button
              type="button"
              onClick={clearNotifications}
              className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar historial</span>
            </button>
          </div>
        )}

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'settings' ? (
            /* Settings View */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">
                  Preferencias de Alertas
                </span>

                {/* Master toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Notificaciones del Sistema
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Interruptor general de alertas push
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.enabled}
                    onChange={(e) =>
                      updateNotificationSettings({ enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                {/* Order updates toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      📦 Cambios en mis Pedidos
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Avisos cuando el pedido se prepara, despacha o entrega
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.orderUpdates}
                    onChange={(e) =>
                      updateNotificationSettings({ orderUpdates: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                {/* New products toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      ✨ Nuevos Ingresos en Inventario
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Alertas automáticas cuando se añaden nuevos productos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.newProducts}
                    onChange={(e) =>
                      updateNotificationSettings({ newProducts: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>

                {/* Sound toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      {notificationSettings.soundEnabled ? (
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Sonido de Notificación (Campana Chime)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Reproducir tono suave al recibir una alerta
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) =>
                      updateNotificationSettings({ soundEnabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Test Notification Trigger */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                  Prueba de Funcionamiento
                </span>
                <p className="text-xs text-slate-400">
                  Haz clic para simular una notificación push instantánea y verificar el sonido y el mensaje en tu pantalla.
                </p>
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>Probar Notificación de Pedido</span>
                </button>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                No tienes notificaciones aún
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Aquí recibirás avisos automáticos sobre cambios en tus pedidos y nuevos productos disponibles en el catálogo.
              </p>
              <button
                type="button"
                onClick={handleTestNotification}
                className="text-xs text-indigo-400 hover:underline font-bold cursor-pointer pt-2 block mx-auto"
              >
                Enviar notificación de prueba
              </button>
            </div>
          ) : (
            /* Notifications List */
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3 ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/50'
                    : 'bg-slate-950/90 border-indigo-500/30 hover:border-indigo-500/60 shadow-md ring-1 ring-indigo-500/10'
                }`}
              >
                {/* Icon or Thumbnail */}
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                  {notif.imageUrl ? (
                    <img
                      src={resolveImageUrl(notif.imageUrl)}
                      alt=""
                      className="w-7 h-7 object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : notif.type === 'order_status' ? (
                    <Package className="w-5 h-5 text-indigo-400" />
                  ) : notif.type === 'new_product' ? (
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Bell className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
                      {notif.type === 'order_status'
                        ? 'Estado de Pedido'
                        : notif.type === 'new_product'
                        ? 'Nuevo Ingreso'
                        : 'Aviso'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatTimestamp(notif.timestamp)}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {notif.title}
                  </h4>

                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {(notif.orderId || notif.productId) && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-indigo-400 group-hover:text-indigo-300">
                      <span>{notif.orderId ? 'Ver Seguimiento de Pedido' : 'Ver Producto en Catálogo'}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  )}
                </div>

                {/* Unread indicator */}
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1 shadow-sm shadow-indigo-500" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
