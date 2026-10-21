import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { Order } from '../../types';
import { 
  X, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  CreditCard, 
  Truck, 
  MessageCircle, 
  Printer, 
  ArrowRight,
  ShieldCheck,
  Lock,
  Receipt,
  FileCheck2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const { 
    cart, 
    cartTotal, 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    placeOrder, 
    setActiveTab,
    isMinimumReached,
    companySettings
  } = useStore();

  const [form, setForm] = useState({
    customerName: '',
    businessName: '',
    documentId: '',
    phone: '',
    email: '',
    shippingAddress: '',
    city: '',
    province: 'Buenos Aires',
    shippingMethod: 'transporte_expreso' as Order['shippingMethod'],
    paymentMethod: (companySettings?.cardPaymentsEnabled ? 'tarjeta_segura' : 'transferencia') as Order['paymentMethod'],
    invoiceType: 'B' as 'A' | 'B',
    // Card simulation details
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: '',
    installments: '1',
    notes: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!isCheckoutOpen) return null;

  // Shipping costs table
  const getShippingCost = (method: Order['shippingMethod']) => {
    switch (method) {
      case 'transporte_expreso': return 12500;
      case 'correo_argentino': return 8900;
      case 'retiro_deposito': return 0;
    }
  };

  const currentShippingCost = getShippingCost(form.shippingMethod);
  
  // Tax calculation (Factura A has IVA 21% breakdown)
  const taxAmount = form.invoiceType === 'A' ? Math.round(cartTotal * 0.21) : 0;
  const grandTotal = cartTotal + currentShippingCost + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.shippingAddress || !form.city) {
      alert('Por favor complete los campos obligatorios (Nombre, Teléfono, Dirección y Ciudad)');
      return;
    }

    if (form.invoiceType === 'A' && !form.documentId) {
      alert('Para Factura A debe ingresar el CUIT del comercio.');
      return;
    }

    if (form.paymentMethod === 'tarjeta_segura') {
      if (form.cardNumber.replace(/\s/g, '').length < 15 || !form.cardExpiry || !form.cardCvv) {
        alert('Por favor complete los datos de la tarjeta correctamente.');
        return;
      }
    }

    setIsProcessing(true);

    // Simulate secure SSL payment tokenization gateway
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newOrder = await placeOrder({
      customerName: form.customerName,
      businessName: form.businessName,
      documentId: form.documentId,
      phone: form.phone,
      email: form.email,
      shippingAddress: form.shippingAddress,
      city: form.city,
      province: form.province,
      shippingMethod: form.shippingMethod,
      shippingCost: currentShippingCost,
      paymentMethod: form.paymentMethod,
      paymentDetails: form.paymentMethod === 'tarjeta_segura' ? {
        cardLast4: form.cardNumber.replace(/\s/g, '').slice(-4),
        cardBrand: 'Visa / Mastercard',
        transactionId: `TX-${Date.now().toString(36).toUpperCase()}`
      } : undefined,
      invoiceType: form.invoiceType,
      items: cart,
      subtotal: cartTotal,
      discount: 0,
      taxAmount,
      total: grandTotal,
      status: form.paymentMethod === 'tarjeta_segura' ? 'paid' : 'pending_payment',
      notes: form.notes
    });

    setIsProcessing(false);
    setConfirmedOrder(newOrder);
  };

  const getWhatsAppConfirmationLink = (order: Order) => {
    const text = `¡Hola ${companySettings?.companyName || 'NUVOH'}! Acabo de confirmar la compra *#${order.orderNumber}* por un total de *${formatCurrency(order.total)}* a nombre de *${order.customerName}* (${order.businessName || 'Comercio'}).\n\nFactura: Tipo ${order.invoiceType}\nEnvío: ${order.shippingMethod.replace('_', ' ')} a ${order.shippingAddress}, ${order.city}.\nPago: ${order.paymentMethod.replace('_', ' ')} (${order.status === 'paid' ? 'Pago Acreditado Online' : 'Esperando transferencia'}).\n\nPor favor confirmen la preparación del despacho.`;
    return generateWhatsAppLink(companySettings?.phone || '5491149821100', text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-zinc-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div>
            <h3 className="text-lg font-black text-zinc-950 font-display flex items-center gap-2">
              {confirmedOrder ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Compra Confirmada Exitosamente</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-orange-600" />
                  <span>Checkout Mayorista Seguro {companySettings?.companyName || 'NUVOH'}</span>
                </>
              )}
            </h3>
            <p className="text-xs text-zinc-500">
              {confirmedOrder ? 'Comprobante comercial y confirmación al usuario' : 'Despacho directo de importador y facturación oficial'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsCheckoutOpen(false);
              setConfirmedOrder(null);
            }}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          /* Confirmation Screen */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ORDEN #{confirmedOrder.orderNumber}
              </span>
              <h2 className="text-2xl font-black text-zinc-900 font-display mt-3">
                ¡Gracias por tu compra, {confirmedOrder.customerName}!
              </h2>
              <p className="text-xs text-zinc-600 max-w-md mx-auto mt-1">
                {confirmedOrder.status === 'paid' 
                  ? 'Tu pago con tarjeta fue aprobado y procesado con éxito. Tus productos entraron a preparación de despacho.'
                  : 'Tu pedido mayorista fue reservado en depósito. Realizá la transferencia para confirmar la salida.'}
              </p>
            </div>

            {/* Official Receipt Summary */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Documento:</span>
                  <strong className="text-zinc-900 font-bold">Factura Tipo {confirmedOrder.invoiceType}</strong>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Estado:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    confirmedOrder.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {confirmedOrder.status === 'paid' ? 'Pago Acreditado' : 'Pendiente de Transferencia'}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-1.5 py-1">
                {confirmedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-zinc-700">
                    <span>{i.quantity}x {i.product.name} ({i.product.sku})</span>
                    <span className="font-mono tabular-nums font-semibold">{formatCurrency(i.totalPrice, false)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 pt-2 space-y-1">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal productos:</span>
                  <span className="font-mono tabular-nums">{formatCurrency(confirmedOrder.subtotal, false)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Envío ({confirmedOrder.shippingMethod.replace('_', ' ')}):</span>
                  <span className="font-mono tabular-nums">{formatCurrency(confirmedOrder.shippingCost, false)}</span>
                </div>
                {confirmedOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-zinc-500">
                    <span>IVA (21% Factura A):</span>
                    <span className="font-mono tabular-nums">{formatCurrency(confirmedOrder.taxAmount, false)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 text-sm">
                  <strong className="text-zinc-900 font-display">TOTAL ABONADO:</strong>
                  <strong className="text-lg font-black font-mono text-orange-600 tabular-nums">
                    {formatCurrency(confirmedOrder.total)}
                  </strong>
                </div>
              </div>
            </div>

            {/* If wire transfer, display banking info */}
            {confirmedOrder.paymentMethod === 'transferencia' && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span>Datos para la Transferencia Bancaria (CBU / Alias):</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900">
                  <p>Banco: <strong>{companySettings?.bankName || 'Santander Río'}</strong></p>
                  <p>Titular: <strong>{companySettings?.accountHolder || 'NUVOH ARGENTINA S.A.'}</strong></p>
                  <p>Alias: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">{companySettings?.alias || 'NUVOH.MAYORISTA.ARS'}</strong></p>
                  <p>CUIT: <strong className="font-mono">{companySettings?.cuit || '30-71889922-4'}</strong></p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <a
                href={getWhatsAppConfirmationLink(confirmedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Notificación Directa a WhatsApp</span>
              </a>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-200 transition-colors"
                >
                  <Printer className="w-4 h-4 text-zinc-600" />
                  <span>Imprimir Comprobante Oficial</span>
                </button>

                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setConfirmedOrder(null);
                    setActiveTab('crm');
                  }}
                  className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Ver en CRM de Ventas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Minimum check warning if below $100.000 */}
            {!isMinimumReached && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aviso de condición mayorista:</span>
                  <p className="mt-0.5">
                    El mínimo de catálogo es $100.000 ARS. Podés continuar con este pedido o solicitar una cotización especial.
                  </p>
                </div>
              </div>
            )}

            {/* 1. Customer & Tax billing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2 font-display">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  <span>1. Datos del Comprador &amp; Facturación</span>
                </h4>
                {/* Invoice Type selection */}
                <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, invoiceType: 'B' })}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      form.invoiceType === 'B' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    Factura B (Final)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, invoiceType: 'A' })}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      form.invoiceType === 'A' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500'
                    }`}
                  >
                    Factura A (Comercio + IVA)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Comercio o Razón Social
                  </label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="Ej. Distribuidora San Martín"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Teléfono Celular (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 4000-0000"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    {form.invoiceType === 'A' ? 'CUIT (Obligatorio para Factura A) *' : 'DNI o CUIT'}
                  </label>
                  <input
                    type="text"
                    required={form.invoiceType === 'A'}
                    value={form.documentId}
                    onChange={(e) => setForm({ ...form, documentId: e.target.value })}
                    placeholder="Ej. 30-71889922-4"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="compras@comercio.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Options */}
            <div className="space-y-3 pt-3 border-t border-zinc-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center gap-2 font-display">
                <Truck className="w-4 h-4 text-orange-600" />
                <span>2. Opciones de Envío &amp; Despacho</span>
              </h4>

              {/* Shipping methods selection radio cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div 
                  onClick={() => setForm({ ...form, shippingMethod: 'transporte_expreso' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    form.shippingMethod === 'transporte_expreso'
                      ? 'border-orange-500 bg-orange-50/50 shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-900">Transporte Expreso</span>
                    <span className="font-mono text-xs font-bold text-orange-600">$12.500</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Despacho por expreso a tu localidad en 24/48hs.
                  </p>
                </div>

                <div 
                  onClick={() => setForm({ ...form, shippingMethod: 'correo_argentino' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    form.shippingMethod === 'correo_argentino'
                      ? 'border-orange-500 bg-orange-50/50 shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-900">Correo Argentino</span>
                    <span className="font-mono text-xs font-bold text-orange-600">$8.900</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Encomienda a domicilio o sucursal.
                  </p>
                </div>

                <div 
                  onClick={() => setForm({ ...form, shippingMethod: 'retiro_deposito' })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    form.shippingMethod === 'retiro_deposito'
                      ? 'border-orange-500 bg-orange-50/50 shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-900">Retiro en Depósito</span>
                    <span className="font-mono text-xs font-bold text-emerald-600">SIN CARGO</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-tight">
                    Retiro en Depósito Central (CABA).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Dirección de Entrega *</label>
                  <input
                    type="text"
                    required
                    value={form.shippingAddress}
                    onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                    placeholder="Calle, número, piso/depto"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Ciudad / Localidad *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ej. Rosario"
                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 focus:border-orange-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* 3. Payment Methods */}
            <div className="space-y-3 pt-3 border-t border-zinc-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 flex items-center justify-between font-display">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span>3. Método de Pago Seguro</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 font-normal">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> SSL 256-Bit Encriptado
                </span>
              </h4>

              {/* Payment selector buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setForm({ ...form, paymentMethod: 'tarjeta_segura' })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    form.paymentMethod === 'tarjeta_segura'
                      ? 'border-orange-500 bg-orange-50/50 shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-orange-600 shrink-0" />
                  <div>
                    <strong className="block text-xs text-zinc-900">Tarjeta de Crédito / Débito</strong>
                    <span className="text-[10px] text-zinc-500">Pasarela Segura (Visa, Master, Amex)</span>
                  </div>
                </div>

                <div
                  onClick={() => setForm({ ...form, paymentMethod: 'transferencia' })}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    form.paymentMethod === 'transferencia'
                      ? 'border-orange-500 bg-orange-50/50 shadow-2xs'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <Receipt className="w-5 h-5 text-zinc-600 shrink-0" />
                  <div>
                    <strong className="block text-xs text-zinc-900">Transferencia Bancaria Inmediata</strong>
                    <span className="text-[10px] text-zinc-500">CBU / Alias oficial {companySettings?.companyName || 'NUVOH'}</span>
                  </div>
                </div>
              </div>

              {/* If card selected, show secure card inputs */}
              {form.paymentMethod === 'tarjeta_segura' && (
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-zinc-600">
                    <span className="font-bold text-zinc-800">Datos de la Tarjeta</span>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <span>Visa</span> · <span>Mastercard</span> · <span>Cabal</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Número de Tarjeta</label>
                    <input
                      type="text"
                      maxLength={19}
                      value={form.cardNumber}
                      onChange={(e) => {
                        // format in groups of 4
                        const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                        const parts = [];
                        for (let i = 0; i < v.length; i += 4) {
                          parts.push(v.substring(i, i + 4));
                        }
                        setForm({ ...form, cardNumber: parts.join(' ') });
                      }}
                      placeholder="4500 0000 0000 0000"
                      className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 bg-white font-mono font-bold outline-hidden focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Titular como figura en la tarjeta</label>
                      <input
                        type="text"
                        value={form.cardHolder}
                        onChange={(e) => setForm({ ...form, cardHolder: e.target.value.toUpperCase() })}
                        placeholder="JUAN PEREZ"
                        className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Vto. (MM/AA)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={form.cardExpiry}
                        onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                        placeholder="12/28"
                        className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden font-mono text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Código de Seguridad (CVV)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={form.cardCvv}
                        onChange={(e) => setForm({ ...form, cardCvv: e.target.value })}
                        placeholder="•••"
                        className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Cuotas</label>
                      <select
                        value={form.installments}
                        onChange={(e) => setForm({ ...form, installments: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-zinc-300 bg-white outline-hidden"
                      >
                        <option value="1">1 pago sin interés</option>
                        <option value="3">3 cuotas fijas</option>
                        <option value="6">6 cuotas fijas</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total breakdown block */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal ({cart.length} productos):</span>
                <span className="font-mono tabular-nums font-semibold">{formatCurrency(cartTotal, false)}</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Costo de Envío:</span>
                <span className="font-mono tabular-nums font-semibold">{formatCurrency(currentShippingCost, false)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-zinc-600">
                  <span>IVA discriminado (21% Factura A):</span>
                  <span className="font-mono tabular-nums font-semibold">{formatCurrency(taxAmount, false)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 text-sm">
                <strong className="text-zinc-950 font-display">TOTAL A CONFIRMAR:</strong>
                <strong className="text-xl font-black font-mono text-orange-600 tabular-nums">
                  {formatCurrency(grandTotal)}
                </strong>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 px-6 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Procesando Pago Seguro y Guardando Orden...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Confirmar Compra Segura ({formatCurrency(grandTotal, false)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
