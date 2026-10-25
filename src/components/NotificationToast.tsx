import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Bell,
  Package,
  Sparkles,
  Tag,
  Info,
  X,
  ArrowRight
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

export const NotificationToast: React.FC = () => {
  const {
    activeToastNotification,
    dismissToastNotification,
    setTrackingOrderId,
    setIsBudgetTrackingOpen,
    setSelectedProduct,
    products,
    setIsNotificationCenterOpen
  } = useStore();

  if (!activeToastNotification) return null;

  const notif = activeToastNotification;

  const handleAction = () => {
    if (notif.orderId) {
      setTrackingOrderId(notif.orderId);
      setIsBudgetTrackingOpen(true);
    } else if (notif.productId) {
      const prod = products.find((p) => p.id === notif.productId);
      if (prod) {
        setSelectedProduct(prod);
      }
    } else {
      setIsNotificationCenterOpen(true);
    }
    dismissToastNotification();
  };

  const getIcon = () => {
    switch (notif.type) {
      case 'order_status':
        return <Package className="w-5 h-5 text-indigo-400" />;
      case 'new_product':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'promo':
        return <Tag className="w-5 h-5 text-rose-400" />;
      default:
        return <Bell className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <aside
      aria-label="Notificación en tiempo real"
      className="fixed bottom-5 left-4 sm:left-6 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white animate-fade-in flex items-start gap-3.5 ring-1 ring-white/10"
    >
      <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 shrink-0 mt-0.5">
        {notif.imageUrl ? (
          <img
            src={resolveImageUrl(notif.imageUrl)}
            alt=""
            className="w-6 h-6 object-cover rounded-md"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          getIcon()
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
            {notif.type === 'order_status'
              ? 'ESTADO DE PEDIDO'
              : notif.type === 'new_product'
              ? 'NUEVO INGRESO'
              : 'AVISO EN TIENDA'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
          {notif.title}
        </h4>

        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
          {notif.message}
        </p>

        <div className="flex items-center gap-2 mt-2.5">
          <button
            type="button"
            onClick={handleAction}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>{notif.orderId ? 'Ver Estado' : notif.productId ? 'Ver Producto' : 'Ver Detalle'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={dismissToastNotification}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-2 py-1"
          >
            Descartar
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={dismissToastNotification}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};
