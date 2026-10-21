import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { CrmNotification } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Package, 
  AlertTriangle, 
  Clock, 
  Volume2, 
  VolumeX, 
  X, 
  ExternalLink, 
  Sparkles, 
  Phone,
  Flame,
  Filter
} from 'lucide-react';

interface CrmNotificationCenterProps {
  onNavigateToTab?: (tab: 'orders' | 'clients' | 'kanban') => void;
}

export const CrmNotificationCenter: React.FC<CrmNotificationCenterProps> = ({ onNavigateToTab }) => {
  const { 
    notifications, 
    unreadNotificationsCount, 
    urgentNotificationsCount,
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearAllNotifications,
    isSoundEnabled,
    toggleSound,
    simulateIncomingOrder,
    simulateUrgentInteraction,
    setSelectedEntityForFocus,
    companySettings
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'orders' | 'urgent' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'orders') return notif.type === 'new_order';
    if (filter === 'urgent') return notif.type === 'urgent_interaction' || notif.priority === 'urgent';
    return true;
  });

  const handleActionClick = (notif: CrmNotification) => {
    markNotificationAsRead(notif.id);
    setIsOpen(false);

    if (notif.entityType === 'order') {
      if (notif.entityId) {
        setSelectedEntityForFocus({ type: 'order', id: notif.entityId });
      }
      onNavigateToTab?.('orders');
    } else if (notif.entityType === 'interaction' || notif.entityType === 'client') {
      if (notif.entityId) {
        setSelectedEntityForFocus({ type: 'client', id: notif.entityId });
      }
      onNavigateToTab?.('clients');
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center border ${
          isOpen
            ? 'bg-zinc-800 text-white border-zinc-600'
            : unreadNotificationsCount > 0
            ? 'bg-zinc-800/90 text-white hover:bg-zinc-700/80 border-zinc-700'
            : 'bg-white/10 hover:bg-white/20 text-zinc-300 border-white/10'
        }`}
        title="Centro de Notificaciones y Alertas del CRM"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className={`w-4 h-4 ${urgentNotificationsCount > 0 ? 'text-red-400 animate-bounce' : 'text-zinc-200'}`} />
        
        {unreadNotificationsCount > 0 && (
          <span className={`absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4.5 h-4.5 rounded-full text-[10px] font-black flex items-center justify-center text-white shadow-sm ring-2 ring-zinc-900 ${
            urgentNotificationsCount > 0 ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
          }`}>
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-105 max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="bg-zinc-950 text-white p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-600/30 text-orange-400 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black tracking-tight text-white uppercase font-display">
                    Alertas Comerciales
                  </h3>
                  {unreadNotificationsCount > 0 && (
                    <span className="bg-red-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadNotificationsCount} pendientes
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pedidos entrantes &amp; atención prioritaria
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                className={`p-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isSoundEnabled 
                    ? 'bg-zinc-800 text-orange-400 border-zinc-700 hover:bg-zinc-700' 
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
                title={isSoundEnabled ? 'Sonido de alertas activado (clic para silenciar)' : 'Sonido silenciado (clic para activar)'}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Test / Simulator Banner */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3.5 py-2 border-b border-orange-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-700 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              <span>Simulador en vivo:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => simulateIncomingOrder()}
                className="px-2 py-1 bg-white hover:bg-orange-600 hover:text-white text-zinc-800 border border-orange-200 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1"
                title="Generar un pedido mayorista simulado en tiempo real"
              >
                <Package className="w-3 h-3 text-orange-500" />
                <span>+ Nuevo Pedido</span>
              </button>
              <button
                onClick={() => simulateUrgentInteraction()}
                className="px-2 py-1 bg-red-100 hover:bg-red-600 hover:text-white text-red-900 border border-red-200 rounded-lg text-[10px] font-bold transition-all shadow-2xs flex items-center gap-1"
                title="Generar consulta urgente de cliente en tiempo real"
              >
                <Flame className="w-3 h-3 text-red-600" />
                <span>+ Alerta Urgente</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'orders', label: 'Pedidos' },
                { key: 'urgent', label: 'Urgentes' },
                { key: 'unread', label: 'No leídas' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as any)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                    filter === item.key
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {notifications.length > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[10px] text-zinc-500 hover:text-zinc-900 font-semibold flex items-center gap-1 shrink-0 px-1 py-0.5"
                title="Marcar todas las alertas como leídas"
              >
                <CheckCheck className="w-3 h-3 text-emerald-600" />
                <span>Leer todas</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 max-h-96">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 mx-auto flex items-center justify-center text-zinc-400 mb-2">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-zinc-800">
                  No hay notificaciones en esta vista
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  Las nuevas órdenes entrantes y las consultas urgentes de clientes aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUrgent = notif.priority === 'urgent' || notif.type === 'urgent_interaction';
                const isOrder = notif.type === 'new_order';

                return (
                  <div
                    key={notif.id}
                    className={`p-3 sm:p-3.5 transition-colors relative flex items-start gap-3 ${
                      !notif.isRead 
                        ? isUrgent 
                          ? 'bg-red-50/50 hover:bg-red-50' 
                          : 'bg-orange-50/40 hover:bg-orange-50/70' 
                        : 'bg-white hover:bg-zinc-50/80'
                    }`}
                  >
                    {/* Unread dot indicator */}
                    {!notif.isRead && (
                      <span className={`absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-red-600 animate-ping' : 'bg-orange-500'}`} />
                    )}

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                      isUrgent
                        ? 'bg-red-100 text-red-600'
                        : isOrder
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {isUrgent ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isOrder ? (
                        <Package className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                            isUrgent
                              ? 'bg-red-600 text-white'
                              : isOrder
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-200 text-zinc-800'
                          }`}>
                            {isUrgent ? 'URGENTE' : isOrder ? 'NUEVO PEDIDO' : 'AVISO'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {notif.createdAt}
                          </span>
                        </div>

                        {/* Mark read / Delete controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          {!notif.isRead ? (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-zinc-400 hover:text-emerald-600 p-1"
                              title="Marcar como leída"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          ) : null}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-zinc-300 hover:text-red-500 p-1"
                            title="Eliminar notificación"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-zinc-950 leading-tight">
                        {notif.title}
                      </h4>
                      <p className="text-[11px] text-zinc-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Metadata pills / CTAs */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {isOrder && (
                          <button
                            onClick={() => handleActionClick(notif)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-orange-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Package className="w-3 h-3" />
                            <span>Ver en Pedidos</span>
                          </button>
                        )}

                        {isUrgent && notif.metadata?.phone && (
                          <a
                            href={generateWhatsAppLink(notif.metadata.phone, `Hola ${notif.metadata.clientName || ''}, nos comunicamos desde ${companySettings?.companyName || 'NUVOH'} Mayorista respecto a su consulta prioritaria.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Responder WhatsApp</span>
                          </a>
                        )}

                        {(notif.entityType === 'client' || notif.entityType === 'interaction') && (
                          <button
                            onClick={() => handleActionClick(notif)}
                            className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3 text-zinc-500" />
                            <span>Ficha Cliente</span>
                          </button>
                        )}

                        {notif.metadata?.total && (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {formatCurrency(notif.metadata.total)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <span className="text-[10px]">
                Total: {notifications.length} registros
              </span>
              <button
                onClick={clearAllNotifications}
                className="text-[10px] text-zinc-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Vaciar historial</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

/**
 * Floating Toast Banner Alert shown whenever a new incoming order or urgent client alert arrives
 */
export const CrmToastAlert: React.FC<{ onNavigateToTab?: (tab: 'orders' | 'clients' | 'kanban') => void }> = ({ onNavigateToTab }) => {
  const { 
    activeToastNotification, 
    dismissToast, 
    markNotificationAsRead, 
    setSelectedEntityForFocus 
  } = useStore();

  if (!activeToastNotification) return null;

  const isUrgent = activeToastNotification.priority === 'urgent' || activeToastNotification.type === 'urgent_interaction';
  const isOrder = activeToastNotification.type === 'new_order';

  const handleAction = () => {
    markNotificationAsRead(activeToastNotification.id);
    dismissToast();

    if (activeToastNotification.entityType === 'order') {
      if (activeToastNotification.entityId) {
        setSelectedEntityForFocus({ type: 'order', id: activeToastNotification.entityId });
      }
      onNavigateToTab?.('orders');
    } else if (activeToastNotification.entityType === 'interaction' || activeToastNotification.entityType === 'client') {
      if (activeToastNotification.entityId) {
        setSelectedEntityForFocus({ type: 'client', id: activeToastNotification.entityId });
      }
      onNavigateToTab?.('clients');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-60 max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-5 duration-200">
      <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-md ${
        isUrgent
          ? 'bg-red-950/95 text-white border-red-700 shadow-red-950/50'
          : 'bg-zinc-900/95 text-white border-zinc-700 shadow-zinc-950/50'
      }`}>
        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center font-bold ${
          isUrgent ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'
        }`}>
          {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
              isUrgent ? 'bg-red-600 text-white' : 'bg-orange-600 text-white'
            }`}>
              {isUrgent ? 'ALERTA URGENTE' : '¡NUEVO PEDIDO ENTRANTE!'}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {activeToastNotification.createdAt}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
            {activeToastNotification.title}
          </h4>
          <p className="text-[11px] text-zinc-300 mt-1 line-clamp-2">
            {activeToastNotification.message}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAction}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-sm ${
                isUrgent
                  ? 'bg-white text-red-950 hover:bg-zinc-100'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              <span>{isOrder ? 'Ver Pedido Ahora' : 'Atender Urgencia'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={dismissToast}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Descartar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
