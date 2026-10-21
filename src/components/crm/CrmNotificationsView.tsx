import React, { useState } from 'react';
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
  Phone, 
  ExternalLink, 
  Sparkles, 
  Flame, 
  Search,
  Filter,
  CheckCircle2,
  Inbox
} from 'lucide-react';

interface CrmNotificationsViewProps {
  onNavigateToTab?: (tab: 'orders' | 'clients' | 'kanban') => void;
}

export const CrmNotificationsView: React.FC<CrmNotificationsViewProps> = ({ onNavigateToTab }) => {
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

  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'urgent' | 'unread'>('all');
  const [search, setSearch] = useState('');

  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'unread' && !notif.isRead) ||
      (activeFilter === 'orders' && notif.type === 'new_order') ||
      (activeFilter === 'urgent' && (notif.type === 'urgent_interaction' || notif.priority === 'urgent'));

    const matchesSearch = 
      notif.title.toLowerCase().includes(search.toLowerCase()) ||
      notif.message.toLowerCase().includes(search.toLowerCase()) ||
      (notif.metadata?.clientName && notif.metadata.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (notif.metadata?.orderNumber && notif.metadata.orderNumber.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleAction = (notif: CrmNotification) => {
    markNotificationAsRead(notif.id);

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
    <div className="space-y-5">
      
      {/* Top Banner & Title Bar */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-zinc-950 font-display">
              Centro de Notificaciones &amp; Alertas Comerciales
            </h2>
            {urgentNotificationsCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                <span>{urgentNotificationsCount} URGENTES</span>
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Recepción en tiempo real de nuevos pedidos entrantes y comunicaciones prioritarias de clientes
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border ${
              isSoundEnabled 
                ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' 
                : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:text-zinc-800'
            }`}
            title="Activar o silenciar avisos sonoros"
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-orange-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{isSoundEnabled ? 'Sonido Activado' : 'Silenciado'}</span>
          </button>

          {/* Mark all as read */}
          {unreadNotificationsCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Marcar todas leídas</span>
            </button>
          )}

          {/* Clear all */}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-3 py-2 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-700 border border-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Borrar todas las notificaciones"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Simulator Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        <div className="bg-gradient-to-br from-orange-50 to-amber-50/60 p-4 rounded-2xl border border-orange-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-950 uppercase tracking-tight">
                Simulador: Nuevo Pedido Entrante
              </h4>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Simula la confirmación de una orden mayorista con aviso visual y campanada sonora.
              </p>
            </div>
          </div>
          <button
            onClick={() => simulateIncomingOrder()}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simular Pedido</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50/60 p-4 rounded-2xl border border-red-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-950 uppercase tracking-tight">
                Simulador: Interacción Urgente
              </h4>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Dispara una consulta crítica de cliente (comprobante de pago o reclamo de stock).
              </p>
            </div>
          </div>
          <button
            onClick={() => simulateUrgentInteraction()}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simular Urgencia</span>
          </button>
        </div>

      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-zinc-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { key: 'all', label: `Todas (${notifications.length})` },
            { key: 'orders', label: `Nuevos Pedidos (${notifications.filter(n => n.type === 'new_order').length})` },
            { key: 'urgent', label: `Urgentes (${notifications.filter(n => n.priority === 'urgent' || n.type === 'urgent_interaction').length})` },
            { key: 'unread', label: `Sin Leer (${unreadNotificationsCount})` }
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setActiveFilter(pill.key as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                activeFilter === pill.key
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alertas por cliente, pedido..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 outline-hidden focus:border-orange-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Notifications List Cards */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 mx-auto flex items-center justify-center text-zinc-400 mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-zinc-900">
              No hay alertas con estos filtros
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Podés usar los botones simuladores de arriba para probar la recepción en vivo de nuevos pedidos o mensajes urgentes de WhatsApp.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const isUrgent = notif.priority === 'urgent' || notif.type === 'urgent_interaction';
            const isOrder = notif.type === 'new_order';

            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? isUrgent
                      ? 'bg-red-50/70 border-red-200 shadow-xs'
                      : 'bg-orange-50/50 border-orange-200 shadow-xs'
                    : 'bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {/* Left side: Icon + Content */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold mt-0.5 ${
                    isUrgent
                      ? 'bg-red-600 text-white shadow-xs'
                      : isOrder
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-800 text-white'
                  }`}>
                    {isUrgent ? <AlertTriangle className="w-5 h-5" /> : isOrder ? <Package className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                        isUrgent
                          ? 'bg-red-600 text-white'
                          : isOrder
                          ? 'bg-emerald-700 text-white'
                          : 'bg-zinc-200 text-zinc-800'
                      }`}>
                        {isUrgent ? 'URGENTE' : isOrder ? 'NUEVO PEDIDO' : 'AVISO'}
                      </span>

                      {!notif.isRead && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Nuevo
                        </span>
                      )}

                      <span className="text-zinc-400 text-xs font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.createdAt}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-zinc-950 font-display">
                      {notif.title}
                    </h3>
                    <p className="text-xs text-zinc-700 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Metadata details */}
                    {notif.metadata && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        {notif.metadata.orderNumber && (
                          <span className="bg-zinc-100 text-zinc-700 font-mono font-bold px-2 py-0.5 rounded border border-zinc-200 text-[11px]">
                            Orden: {notif.metadata.orderNumber}
                          </span>
                        )}
                        {notif.metadata.total && (
                          <span className="bg-emerald-50 text-emerald-800 font-mono font-black px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                            {formatCurrency(notif.metadata.total)}
                          </span>
                        )}
                        {notif.metadata.clientName && (
                          <span className="text-zinc-600 text-[11px] font-medium">
                            Cliente: <strong>{notif.metadata.clientName}</strong>
                          </span>
                        )}
                        {notif.metadata.phone && (
                          <span className="text-zinc-500 text-[11px]">
                            Tel: {notif.metadata.phone}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60">
                  {isOrder && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="px-3.5 py-2 bg-zinc-950 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Ver Pedido</span>
                    </button>
                  )}

                  {isUrgent && notif.metadata?.phone && (
                    <a
                      href={generateWhatsAppLink(notif.metadata.phone, `Hola ${notif.metadata.clientName || ''}, nos comunicamos desde ${companySettings?.companyName || 'NUVOH'} Mayorista respecto a su consulta prioritaria.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp Inmediato</span>
                    </a>
                  )}

                  {(notif.entityType === 'client' || notif.entityType === 'interaction') && (
                    <button
                      onClick={() => handleAction(notif)}
                      className="px-3 py-2 bg-white hover:bg-zinc-100 text-zinc-800 border border-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Ficha Cliente</span>
                    </button>
                  )}

                  {!notif.isRead ? (
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 border border-zinc-200 transition-colors"
                      title="Marcar como leída"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="p-2 text-emerald-600" title="Leída">
                      <CheckCheck className="w-4 h-4" />
                    </span>
                  )}

                  <button
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-zinc-200 transition-colors"
                    title="Eliminar notificación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
