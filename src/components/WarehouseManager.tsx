import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Truck, CheckCircle2, Clock, PackageCheck, AlertCircle, Bell, Search } from 'lucide-react';

interface WarehouseManagerProps {
  orders: Order[];
  onRefresh: () => void;
}

export const WarehouseManager: React.FC<WarehouseManagerProps> = ({ orders, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');

  const statuses: OrderStatus[] = ['Pendiente de Pago', 'Pagado', 'En Preparación', 'Listo para Despacho', 'Despachado', 'Entregado', 'Cancelado'];

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'Todos' || o.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      onRefresh();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" /> Gestión de Almacén & Preparación (Picking & Packing)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Órdenes entrantes en tiempo real para preparación de bultos y notificaciones automáticas de despacho.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-950/50 border border-indigo-800/60 px-4 py-2 rounded-2xl text-xs text-indigo-300">
          <Bell className="w-4 h-4 animate-bounce text-indigo-400" />
          <span>Notificaciones automáticas activas</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por N° de Orden o cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedStatus('Todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedStatus === 'Todos' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            Todos
          </button>
          {statuses.map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === st ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-white font-mono">{order.orderNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'Listo para Despacho' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' :
                    order.status === 'En Preparación' ? 'bg-amber-950/60 text-amber-400 border border-amber-800' :
                    order.status === 'Pagado' ? 'bg-sky-950/60 text-sky-400 border border-sky-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Cliente: <span className="text-white font-semibold">{order.customerName}</span> ({order.customerEmail}) | Tel: {order.customerPhone}
                </p>
                <p className="text-xs text-slate-400">
                  Dirección: <span className="text-white">{order.shippingAddress}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Orden</span>
                <span className="text-xl font-extrabold text-white">${order.total.toLocaleString('es-AR')}</span>
                <span className="block text-[10px] text-cyan-400 mt-0.5">Pago: {order.paymentMethod}</span>
              </div>
            </div>

            {/* Items packing list */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Items a Preparar (Packing List):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="text-slate-400 font-mono text-[10px]">SKU: {item.sku}</p>
                    </div>
                    <span className="bg-indigo-600/20 text-indigo-300 font-bold px-2.5 py-1 rounded-xl border border-indigo-500/30">
                      Cant: {item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons to progress status */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Creado: {new Date(order.createdAt).toLocaleString('es-AR')}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Cambiar Estado:</span>
                <select
                  value={order.status}
                  onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                >
                  {statuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl">
          <PackageCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No hay órdenes en este estado</h3>
          <p className="text-slate-400 text-sm mt-1">Las órdenes creadas en la tienda aparecerán aquí automáticamente.</p>
        </div>
      )}
    </div>
  );
};
