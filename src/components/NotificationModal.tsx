import React, { useState } from 'react';
import { Product } from '../types';
import { Bell, AlertTriangle, X, Send, CheckCircle } from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [sentStatus, setSentStatus] = useState<string | null>(null);
  if (!isOpen) return null;

  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  const handleSendEmailAlerts = () => {
    setSentStatus('¡Alertas por email y push enviadas exitosamente al equipo de compras y gerencia!');
    setTimeout(() => {
      setSentStatus(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="glass-card rounded-[2.5rem] max-w-lg w-full p-8 text-white relative shadow-2xl border border-white/20 glow-indigo">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-black">Centro de Alertas & Stock Crítico</h3>
            <p className="text-xs text-slate-400 font-medium">Notificaciones automáticas por stock bajo mínimo</p>
          </div>
        </div>

        {sentStatus && (
          <div className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 p-3.5 rounded-2xl text-xs font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {sentStatus}
          </div>
        )}

        <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
          {lowStockItems.length > 0 ? (
            lowStockItems.map(p => (
              <div key={p.id} className="bg-[#121624] p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">{p.title}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} | Proveedor: {p.supplier}</p>
                </div>
                <span className="bg-rose-950/80 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl text-[10px] font-black font-mono">
                  Stock: {p.stock} / Min: {p.minStock}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No hay alertas pendientes. Todo el inventario se encuentra sobre el stock mínimo.
            </div>
          )}
        </div>

        {lowStockItems.length > 0 && (
          <button
            onClick={handleSendEmailAlerts}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black uppercase tracking-wider shadow-xl transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Disparar Alerta Email / Push a Compras
          </button>
        )}
      </div>
    </div>
  );
};
