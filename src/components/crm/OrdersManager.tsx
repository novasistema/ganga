import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { 
  Package, 
  Printer, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  Truck, 
  Search, 
  X,
  FileText
} from 'lucide-react';

export const OrdersManager: React.FC = () => {
  const { orders, updateOrderStatus, selectedEntityForFocus, companySettings } = useStore();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderForRemito, setSelectedOrderForRemito] = useState<Order | null>(null);

  // Auto-focus and open remito when navigating from incoming order notification
  React.useEffect(() => {
    if (selectedEntityForFocus?.type === 'order' && selectedEntityForFocus.id) {
      const targetOrder = orders.find((o) => o.id === selectedEntityForFocus.id);
      if (targetOrder) {
        setSelectedStatus('all');
        setSelectedOrderForRemito(targetOrder);
      }
    }
  }, [selectedEntityForFocus, orders]);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (o.businessName && o.businessName.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">Pendiente de Pago</span>;
      case 'paid':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">Pago Acreditado</span>;
      case 'preparing':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded">En Preparación</span>;
      case 'shipped':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold px-2 py-0.5 rounded">Despachado</span>;
      case 'delivered':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">Entregado</span>;
      case 'cancelled':
        return <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded">Cancelado</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-zinc-950 font-display">
            Gestión de Pedidos &amp; Despachos
          </h3>
          <p className="text-xs text-zinc-500">
            Control de cobros, armado de paquetes y emisión de remitos de entrega
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por orden, cliente..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-white outline-hidden focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: 'Todos los Pedidos' },
          { key: 'pending_payment', label: 'Pendientes' },
          { key: 'paid', label: 'Pagados' },
          { key: 'preparing', label: 'En Depósito' },
          { key: 'shipped', label: 'Despachados' },
          { key: 'delivered', label: 'Entregados' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === tab.key
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 uppercase font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Orden</th>
                <th className="py-3 px-4">Cliente / Comercio</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Artículos</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 italic">
                    No hay pedidos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
                  const waText = `Hola ${order.customerName}, te escribimos de ${companySettings?.companyName || 'NUVOH'} Mayorista por tu pedido *${order.orderNumber}* (${formatCurrency(order.total)}).`;
                  const waUrl = generateWhatsAppLink(order.phone, waText);

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-zinc-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400 capitalize">
                          {order.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-zinc-900 block">
                          {order.customerName}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {order.businessName || order.city}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {order.createdAt}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-zinc-800">{totalUnits} u.</span>
                        <span className="text-zinc-400 text-[11px] ml-1">
                          ({order.items.length} modelos)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-950 tabular-nums">
                        {formatCurrency(order.total)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick WhatsApp update */}
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg"
                            title="Contactar cliente"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* Print remito */}
                          <button
                            onClick={() => setSelectedOrderForRemito(order)}
                            className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center gap-1 text-[11px] font-semibold"
                            title="Generar e imprimir Remito oficial"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Remito</span>
                          </button>

                          {/* Fast stage transition */}
                          {order.status === 'pending_payment' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'paid')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              Acreditar Pago
                            </button>
                          )}

                          {order.status === 'paid' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold"
                            >
                              A Depósito
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'shipped')}
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Despachar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Remito Printable Modal */}
      {selectedOrderForRemito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-6 no-print">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                DOCUMENTO COMERCIAL DE DESPACHO
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Remito</span>
                </button>
                <button
                  onClick={() => setSelectedOrderForRemito(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Header */}
            <div className="border border-zinc-900 p-5 rounded-xl mb-4">
              <div className="flex items-start justify-between border-b border-zinc-300 pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black font-display tracking-tight text-zinc-950">
                    {companySettings?.companyName || 'NUVOH'}
                  </h2>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-600">
                    {companySettings?.legalName || 'IMPORTADOR DIRECTO · TECNOLOGÍA PARA TU HOGAR'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {companySettings?.address || 'Av. Corrientes 3420'}, {companySettings?.city || 'CABA'} · CUIT: {companySettings?.cuit || '30-71889922-4'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-2 border-zinc-900 px-3 py-1 text-center mb-1">
                    <span className="text-xl font-black font-display">R</span>
                    <span className="text-[9px] block uppercase font-bold">Documento no fiscal</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-900">
                    REMITO N° {selectedOrderForRemito.orderNumber}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Fecha: {selectedOrderForRemito.createdAt}
                  </div>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-2 gap-3 text-xs mb-4 pb-3 border-b border-zinc-200">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Destinatario / Razón Social:</span>
                  <strong className="text-zinc-900 font-semibold">{selectedOrderForRemito.customerName} ({selectedOrderForRemito.businessName || 'Comercio'})</strong>
                  <span className="text-zinc-600 block text-[11px]">CUIT/DNI: {selectedOrderForRemito.documentId || 'S/D'}</span>
                  <span className="text-zinc-600 block text-[11px]">Tel: {selectedOrderForRemito.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Lugar de Entrega / Transporte:</span>
                  <span className="text-zinc-900 block font-medium">{selectedOrderForRemito.shippingAddress}</span>
                  <span className="text-zinc-600 block text-[11px]">{selectedOrderForRemito.city}, {selectedOrderForRemito.province}</span>
                  <span className="text-orange-700 font-semibold block text-[11px] capitalize mt-0.5">
                    Modo: {selectedOrderForRemito.shippingMethod.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <table className="w-full text-left text-xs mb-6">
                <thead className="bg-zinc-100 font-bold uppercase text-[10px] text-zinc-700">
                  <tr>
                    <th className="py-1.5 px-2">Código / SKU</th>
                    <th className="py-1.5 px-2">Descripción del Producto</th>
                    <th className="py-1.5 px-2 text-center">Bultos/Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {selectedOrderForRemito.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 font-mono text-[11px]">{i.product.sku}</td>
                      <td className="py-2 px-2 font-semibold text-zinc-900">{i.product.name}</td>
                      <td className="py-2 px-2 text-center font-bold font-mono">{i.quantity} u.</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zinc-300 text-center text-xs">
                <div>
                  <div className="border-t border-dashed border-zinc-400 pt-1 text-[11px] text-zinc-500">
                    Firma y Aclaración Despacho Depósito
                  </div>
                </div>
                <div>
                  <div className="border-t border-dashed border-zinc-400 pt-1 text-[11px] text-zinc-500">
                    Firma, Aclaración y DNI de Recepción Conforme
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
