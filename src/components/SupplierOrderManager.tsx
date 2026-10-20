import React, { useState } from 'react';
import { SupplierPurchaseOrder, Order, Product } from '../types';
import { useStore } from '../context/StoreContext';
import {
  Truck,
  Search,
  ExternalLink,
  MessageCircle,
  Copy,
  Printer,
  CheckCircle,
  Clock,
  Package,
  Plus,
  Trash2,
  DollarSign,
  ShoppingBag,
  Building2,
  AlertCircle,
  ChevronDown,
  X,
  Send,
  Eye,
  Check
} from 'lucide-react';
import { resolveImageUrl, DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';

export const SupplierOrderManager: React.FC = () => {
  const {
    supplierOrders,
    updateSupplierOrderStatus,
    deleteSupplierOrder,
    createSupplierOrdersFromCustomerOrder,
    orders,
    products,
    settings
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedOrder, setSelectedOrder] = useState<SupplierPurchaseOrder | null>(null);
  const [showGenerateFromOrderModal, setShowGenerateFromOrderModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol || '$'} ${amount.toLocaleString('es-AR')}`;
  };

  // Distinct suppliers
  const supplierNames = Array.from(
    new Set(supplierOrders.map((o) => o.supplierName).filter(Boolean))
  );

  const filteredOrders = supplierOrders.filter((o) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.supplierName || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.customerOrderId || '').toLowerCase().includes(q) ||
      o.items.some((it) => it.title.toLowerCase().includes(q));

    const matchesSupplier = supplierFilter === 'Todos' || o.supplierName === supplierFilter;
    const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;

    return matchesSearch && matchesSupplier && matchesStatus;
  });

  // Financial Stats
  const totalCostToPay = supplierOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => sum + (o.totalCostToPay || 0), 0);

  const totalSaleAmount = supplierOrders
    .filter((o) => o.status !== 'cancelado')
    .reduce((sum, o) => sum + (o.customerSaleTotal || 0), 0);

  const totalProfit = totalSaleAmount - totalCostToPay;

  const pendingCount = supplierOrders.filter((o) => o.status === 'pendiente_encargar').length;
  const orderedCount = supplierOrders.filter((o) => o.status === 'encargado_pagado').length;
  const transitCount = supplierOrders.filter((o) => o.status === 'en_transito').length;
  const receivedCount = supplierOrders.filter((o) => o.status === 'recibido_deposito').length;

  const getStatusBadge = (status: SupplierPurchaseOrder['status']) => {
    switch (status) {
      case 'pendiente_encargar':
        return {
          label: '1. Pendiente de Encargar',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          icon: Clock
        };
      case 'encargado_pagado':
        return {
          label: '2. Encargado / Pagado al Proveedor',
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
          icon: ShoppingBag
        };
      case 'en_transito':
        return {
          label: '3. En Tránsito / Despachado',
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
          icon: Truck
        };
      case 'recibido_deposito':
        return {
          label: '4. Recibido en Depósito / Listo',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          icon: CheckCircle
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
          icon: AlertCircle
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
          icon: Clock
        };
    }
  };

  const generateWhatsAppMessage = (order: SupplierPurchaseOrder): string => {
    let msg = `👋 *Hola ${order.supplierName}!*\n`;
    msg += `Te paso el siguiente pedido de compra (*${order.orderNumber}*):\n\n`;

    order.items.forEach((it, idx) => {
      msg += `📦 *${idx + 1}.* ${it.quantity}x _${it.title}_\n`;
      msg += `   • Costo Unitario: ${formatCurrency(it.unitCost)}\n`;
      msg += `   • Subtotal: ${formatCurrency(it.totalCost)}\n`;
      if (it.supplierUrl) {
        msg += `   • Link artículo: ${it.supplierUrl}\n`;
      }
      msg += `\n`;
    });

    msg += `💰 *TOTAL A ABONAR: ${formatCurrency(order.totalCostToPay)}*\n\n`;
    msg += `📍 *Datos de Facturación / Envío:*\n`;
    msg += `Empresa: ${settings.companyName || 'Distribuidora'}\n`;
    if (settings.cuit) msg += `CUIT: ${settings.cuit}\n`;
    if (settings.address) msg += `Dirección de recepción: ${settings.address}, ${settings.city || ''}\n`;
    if (settings.phone) msg += `Tel: ${settings.phone}\n\n`;
    msg += `Por favor confirmar stock, cuenta bancaria para transferir y plazo de despacho. ¡Muchas gracias!`;

    return msg;
  };

  const handleSendWhatsApp = (order: SupplierPurchaseOrder) => {
    const text = encodeURIComponent(generateWhatsAppMessage(order));
    const phone = (order.supplierPhone || '').replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/${phone.startsWith('54') ? phone : `549${phone}`}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyText = (order: SupplierPurchaseOrder) => {
    const text = generateWhatsAppMessage(order);
    navigator.clipboard.writeText(text);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2500);
    setNotification({ type: 'success', message: '¡Detalle del pedido copiado al portapapeles listo para enviar!' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenAllLinks = (order: SupplierPurchaseOrder) => {
    const urls = order.items.map((i) => i.supplierUrl).filter((u): u is string => Boolean(u && u.startsWith('http')));
    if (urls.length === 0) {
      alert('Los productos de esta orden no tienen enlaces web asignados.');
      return;
    }
    urls.forEach((url) => {
      window.open(url, '_blank');
    });
  };

  const handlePrint = (order: SupplierPurchaseOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orden de Compra - ${order.orderNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0; font-size: 24px; color: #0f172a; }
            .meta { font-size: 13px; color: #64748b; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; font-size: 13px; }
            th { text-align: left; background: #f1f5f9; padding: 10px 14px; font-weight: 700; border-bottom: 1px solid #cbd5e1; }
            td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; }
            .total-box { margin-top: 20px; text-align: right; font-size: 18px; font-weight: 800; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>ORDEN DE COMPRA A PROVEEDOR</h1>
              <div class="meta">
                <strong>${settings.companyName || 'Distribuidora'}</strong><br/>
                CUIT: ${settings.cuit || '-'}<br/>
                Fecha: ${new Date(order.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #4f46e5;">${order.orderNumber}</h2>
              <div class="meta">
                Proveedor: <strong>${order.supplierName}</strong><br/>
                Pedido de Cliente: <strong>${order.customerOrderId}</strong> (${order.customerName})<br/>
                Estado: <span class="badge">${order.status}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Ítem / Producto</th>
                <th style="text-align: center;">Cant.</th>
                <th style="text-align: right;">Costo Unit.</th>
                <th style="text-align: right;">Subtotal a Pagar</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (it) => `
                <tr>
                  <td>
                    <strong>${it.title}</strong>
                    ${it.supplierUrl ? `<br/><span style="font-size: 11px; color: #64748b;">${it.supplierUrl}</span>` : ''}
                  </td>
                  <td style="text-align: center;">${it.quantity}</td>
                  <td style="text-align: right;">$ ${it.unitCost.toLocaleString('es-AR')}</td>
                  <td style="text-align: right; font-weight: 700;">$ ${it.totalCost.toLocaleString('es-AR')}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="total-box">
            TOTAL A ABONAR AL PROVEEDOR: $ ${order.totalCostToPay.toLocaleString('es-AR')}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleGenerateOrdersForCustomerOrder = async (custOrder: Order) => {
    try {
      const generated = await createSupplierOrdersFromCustomerOrder(custOrder);
      setShowGenerateFromOrderModal(false);
      setNotification({
        type: 'success',
        message: `¡Se generaron ${generated.length} órdenes de compra automáticamente para los proveedores asignados!`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Error al generar órdenes de compra: ' + err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              A Pagar a Proveedores
            </span>
            <span className="text-2xl font-black text-rose-400">{formatCurrency(totalCostToPay)}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Costo mercadería vendida</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ganancia Neta Estimada
            </span>
            <span className="text-2xl font-black text-emerald-400">{formatCurrency(totalProfit)}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">
              Margen promedio {totalCostToPay > 0 ? `${Math.round((totalProfit / totalCostToPay) * 100)}%` : '0%'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Pendientes de Encargar
            </span>
            <span className="text-2xl font-black text-amber-400">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {orderedCount} encargados / {transitCount} en viaje
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recibidos en Depósito
            </span>
            <span className="text-2xl font-black text-indigo-300">{receivedCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Listos para despachar al cliente</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <div className="flex-1 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por N° OC, Proveedor, Cliente o Producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Supplier dropdown */}
          <div className="sm:w-48">
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white font-medium focus:border-indigo-500 cursor-pointer"
            >
              <option value="Todos">🏢 Todos los Proveedores</option>
              {supplierNames.map((s) => (
                <option key={s} value={s}>
                  🏢 {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status dropdown */}
          <div className="sm:w-52">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white font-medium focus:border-indigo-500 cursor-pointer"
            >
              <option value="Todos">🏷️ Todos los Estados</option>
              <option value="pendiente_encargar">🟡 1. Pendiente de Encargar</option>
              <option value="encargado_pagado">🔵 2. Encargado / Pagado</option>
              <option value="en_transito">🟣 3. En Tránsito / Despachado</option>
              <option value="recibido_deposito">🟢 4. Recibido en Depósito</option>
              <option value="cancelado">🔴 Cancelado</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowGenerateFromOrderModal(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generar Pedido de Compra desde Venta</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
            <h4 className="text-white font-black text-sm">No hay pedidos a proveedores con este filtro.</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Cada vez que un cliente confirma un pedido, el sistema genera automáticamente la orden de compra agrupando los productos según el proveedor asignado.
            </p>
            <button
              type="button"
              onClick={() => setShowGenerateFromOrderModal(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Generar desde un Pedido de Cliente Existente
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-base">{order.orderNumber}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${badge.bg}`}>
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Proveedor Asignado:{' '}
                        <strong className="text-amber-300 font-bold">{order.supplierName}</strong> • Generado el{' '}
                        {new Date(order.createdAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Pedido Cliente: <strong className="text-white font-mono">{order.customerOrderId}</strong> ({order.customerName})
                    </span>
                  </div>
                </div>

                {/* Items in this purchase order */}
                <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-800/60">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-2">
                    📦 Artículos a encargar al proveedor ({order.items.length})
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800"
                      >
                        <img
                          src={resolveImageUrl(it.imageUrl)}
                          alt={it.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const raw = (it.imageUrl || '').trim();
                            if (raw && !target.src.includes('/api/image-proxy')) {
                              target.src = `/api/image-proxy?url=${encodeURIComponent(raw)}`;
                            } else {
                              target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                            }
                          }}
                          className="w-12 h-12 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-white text-xs block truncate">{it.title}</span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-black text-amber-300">{it.quantity} un.</span>
                            <span>×</span>
                            <span>{formatCurrency(it.unitCost)} (Costo)</span>
                            <span>=</span>
                            <span className="font-bold text-white">{formatCurrency(it.totalCost)}</span>
                          </div>
                        </div>

                        {it.supplierUrl && (
                          <a
                            href={it.supplierUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir página del artículo en la web del proveedor"
                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl transition-colors cursor-pointer shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary & Action Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
                  {/* Financial breakdown */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-extrabold block">A Pagar al Proveedor</span>
                      <span className="font-mono font-black text-rose-400 text-sm">{formatCurrency(order.totalCostToPay)}</span>
                    </div>

                    <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase font-extrabold block">Cobrado al Cliente</span>
                      <span className="font-mono font-bold text-slate-300 text-sm">{formatCurrency(order.customerSaleTotal)}</span>
                    </div>

                    <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-400 uppercase font-extrabold block">Ganancia Neta</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">{formatCurrency(order.estimatedProfit)}</span>
                    </div>
                  </div>

                  {/* Actions & Status Change */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Select */}
                    <div className="relative">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateSupplierOrderStatus(
                            order.id,
                            e.target.value as SupplierPurchaseOrder['status']
                          )
                        }
                        className="px-3 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs text-white font-bold cursor-pointer pr-8"
                      >
                        <option value="pendiente_encargar">🟡 1. Pendiente de Encargar</option>
                        <option value="encargado_pagado">🔵 2. Encargado / Pagado</option>
                        <option value="en_transito">🟣 3. En Tránsito / Despachado</option>
                        <option value="recibido_deposito">🟢 4. Recibido en Depósito</option>
                        <option value="cancelado">🔴 Cancelado</option>
                      </select>
                    </div>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp(order)}
                      title="Enviar pedido por WhatsApp al proveedor"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Proveedor</span>
                    </button>

                    {/* Copy plaintext */}
                    <button
                      type="button"
                      onClick={() => handleCopyText(order)}
                      title="Copiar lista de productos para pegar en email o chat"
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === order.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    {/* Open all links */}
                    {order.items.some((i) => i.supplierUrl) && (
                      <button
                        type="button"
                        onClick={() => handleOpenAllLinks(order)}
                        title="Abrir todos los enlaces de producto en pestañas para comprar rápido"
                        className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir Links</span>
                      </button>
                    )}

                    {/* Print */}
                    <button
                      type="button"
                      onClick={() => handlePrint(order)}
                      title="Imprimir Orden de Compra oficial"
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar la orden de compra ${order.orderNumber}?`)) {
                          deleteSupplierOrder(order.id);
                        }
                      }}
                      title="Eliminar orden de compra"
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Generate Purchase Orders from an existing Customer Order */}
      {showGenerateFromOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Generar Pedido de Compra a Proveedores</h3>
                  <span className="text-[11px] text-slate-400">Selecciona el pedido de cliente a encargar</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateFromOrderModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              El sistema analizará los artículos del pedido del cliente y armará automáticamente una orden de compra para cada proveedor asignado (ej. Inova ARG, Plutotec, etc.), con sus costos de compra calculados y enlaces directos.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No hay pedidos de clientes registrados aún.
                </div>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{o.id}</span>
                        <span className="text-xs text-slate-300 font-bold">{o.customerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {o.items.length} artículos • Total cliente: {formatCurrency(o.totalAmount)} • Fecha:{' '}
                        {new Date(o.createdAt).toLocaleDateString('es-AR')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateOrdersForCustomerOrder(o)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                    >
                      Armar Orden Proveedor
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGenerateFromOrderModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
