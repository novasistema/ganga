import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  CreditCard,
  Copy,
  Check,
  Truck,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Package,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { resolveImageUrl } from '../utils/imageUrl';

export const BudgetTrackingModal: React.FC = () => {
  const {
    orders,
    settings,
    isBudgetTrackingOpen,
    setIsBudgetTrackingOpen,
    trackingOrderId,
    setTrackingOrderId,
    markOrderAsPaid
  } = useStore();

  const [inputOrderId, setInputOrderId] = useState(trackingOrderId || '');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  if (!isBudgetTrackingOpen) return null;

  const currentOrder = orders.find(
    (o) =>
      o.id.toLowerCase() === (inputOrderId || trackingOrderId).toLowerCase().trim() ||
      o.customerPhone.includes(inputOrderId.trim())
  );

  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol || '$'} ${val.toLocaleString('es-AR')}`;
  };

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(settings.mercadoPagoAliasCvu || settings.bankCbuAlias || 'GANGA.DROP.PAGOS');
    setCopiedAlias(true);
    setTimeout(() => setCopiedAlias(false), 2000);
  };

  // Open Mercado Pago App / Web link
  const handleOpenMercadoPago = () => {
    if (!currentOrder) return;
    const paymentUrl = currentOrder.mercadoPagoPaymentLink ||
      `https://www.mercadopago.com.ar/checkout/v1/payment/redirect/?preference-id=PREF-${currentOrder.id}`;
    
    // In mobile devices, opening this URL prompts the Mercado Pago native app
    window.open(paymentUrl, '_blank');
  };

  const handleSimulatePaymentApproval = async () => {
    if (!currentOrder) return;
    setSimulatingPayment(true);
    await new Promise((r) => setTimeout(r, 1200));
    await markOrderAsPaid(currentOrder.id, 'mercadopago');
    setSimulatingPayment(false);
    confetti({ particleCount: 70, spread: 60 });
  };

  const totalToPay = currentOrder?.adjustedTotal || currentOrder?.totalAmount || 0;
  const transferDiscount = Math.round(totalToPay * 0.10);
  const totalTransfer = totalToPay - transferDiscount;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Seguimiento de Presupuesto y Pago</h3>
              <p className="text-[11px] text-slate-300">Consulta el estado de tu pedido en tiempo real</p>
            </div>
          </div>
          <button
            onClick={() => setIsBudgetTrackingOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Search order input if not already preselected */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ingresa tu N° de Orden (ej. ORD-123456-789)"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
              />
            </div>
          </div>

          {!currentOrder ? (
            <div className="p-8 text-center text-gray-400 text-xs space-y-2">
              <Package className="w-8 h-8 mx-auto text-gray-300" />
              <p className="font-bold text-gray-700">Ingresa tu número de orden</p>
              <p className="text-[11px]">
                Encuentras tu N° de Orden en la confirmación de compra o en el mensaje que te enviamos.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Header Badge */}
              <div className="p-4 rounded-2xl border flex items-center justify-between bg-slate-50 border-slate-200">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">
                    Orden #{currentOrder.id}
                  </span>
                  <span className="text-sm font-extrabold text-gray-900">
                    Cliente: {currentOrder.customerName}
                  </span>
                </div>

                <div>
                  {currentOrder.paymentStatus === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                      PAGADO Y EN PREPARACIÓN
                    </span>
                  ) : currentOrder.orderStatus === 'presupuesto_enviado' || currentOrder.budgetStatus === 'budget_ready' ? (
                    <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                      <CheckCircle2 className="w-4 h-4" />
                      PRESUPUESTO CONFIRMADO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-black px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4" />
                      VERIFICANDO STOCK
                    </span>
                  )}
                </div>
              </div>

              {/* STAGE 1: STOCK VERIFICATION IN PROGRESS */}
              {currentOrder.paymentStatus !== 'paid' && currentOrder.budgetStatus !== 'budget_ready' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Estamos verificando el stock de tu pedido</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Nuestro equipo comercial se encuentra comprobando la disponibilidad física de cada artículo con los distribuidores para asegurar que no haya faltantes. Tan pronto esté listo, te contactaremos por WhatsApp con el presupuesto final aprobado y los accesos de pago.
                  </p>
                  <div className="pt-1">
                    <a
                      href={`https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hola ${settings.companyName}, consulto por el presupuesto de mi orden #${currentOrder.id}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Consultar estado por WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* STAGE 2: BUDGET VERIFIED & READY FOR PAYMENT */}
              {currentOrder.paymentStatus !== 'paid' && currentOrder.budgetStatus === 'budget_ready' && (
                <div className="space-y-4">
                  {/* Verification Notice */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs text-emerald-950">
                    <div className="flex items-center gap-2 font-black text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Stock 100% verificado sin faltantes!</span>
                    </div>
                    {currentOrder.budgetNotes && (
                      <p className="text-[11px] text-emerald-800 italic bg-white/70 p-2 rounded-lg border border-emerald-200/50">
                        Nota del distribuidor: "{currentOrder.budgetNotes}"
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-800">
                      Puedes proceder al pago mediante la aplicación de <strong>Mercado Pago</strong> o por <strong>Transferencia Bancaria Inmediata</strong>.
                    </p>
                  </div>

                  {/* Payment Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: MERCADO PAGO APP */}
                    <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-sky-600" />
                            Mercado Pago
                          </span>
                          <span className="bg-sky-200/80 text-sky-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            App o Tarjetas
                          </span>
                        </div>
                        <p className="text-[11px] text-sky-800 mt-1">
                          Abre la app en tu celular para pagar con dinero en cuenta, Débito o hasta 3 cuotas.
                        </p>
                        <div className="mt-2 text-sm font-black text-sky-950">
                          {formatCurrency(totalToPay)}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <button
                          onClick={handleOpenMercadoPago}
                          className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Pagar con Mercado Pago</span>
                        </button>

                        <button
                          onClick={handleSimulatePaymentApproval}
                          disabled={simulatingPayment}
                          className="w-full text-center text-[10px] text-sky-700 hover:text-sky-900 underline font-medium cursor-pointer"
                        >
                          {simulatingPayment ? 'Verificando con Mercado Pago...' : 'Simular acreditación automática'}
                        </button>
                      </div>
                    </div>

                    {/* Option 2: TRANSFERENCIA BANCARIA */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-amber-600" />
                            Transferencia
                          </span>
                          <span className="bg-amber-200/80 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                            10% OFF
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          Paga por transferencia o CVU/Alias de Mercado Pago directo.
                        </p>
                        <div className="mt-2 text-sm font-black text-emerald-700">
                          {formatCurrency(totalTransfer)}{' '}
                          <span className="text-[10px] text-gray-500 line-through">{formatCurrency(totalToPay)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="bg-white p-2 rounded-xl border border-amber-200 text-[11px] flex items-center justify-between">
                          <span className="font-mono font-bold text-gray-800 truncate mr-2">
                            {settings.mercadoPagoAliasCvu || settings.bankCbuAlias || 'GANGA.DROP.PAGOS'}
                          </span>
                          <button
                            onClick={handleCopyAlias}
                            className="p-1 text-gray-500 hover:text-gray-900"
                            title="Copiar Alias"
                          >
                            {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <a
                          href={`https://wa.me/${(settings.whatsappNumber || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hola ${settings.companyName}, adjunto el comprobante de transferencia para la orden #${currentOrder.id} por ${formatCurrency(
                              totalTransfer
                            )}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar Comprobante WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 3: PAID & SHIPPING */}
              {currentOrder.paymentStatus === 'paid' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-xs text-emerald-950">
                  <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>¡Pago Acreditado Exitosamente!</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Tu pago ha sido registrado por la pasarela de Mercado Pago / Banco. El paquete se encuentra embalado y en camino al centro de distribución.
                  </p>
                  {currentOrder.trackingNumber && (
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 font-mono text-xs flex justify-between items-center">
                      <span className="text-gray-500">N° de Envío / Guía:</span>
                      <span className="font-bold text-gray-900">{currentOrder.trackingNumber}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items Breakdown */}
              <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block text-[11px] uppercase tracking-wider">
                  Productos Solicitados ({currentOrder.items.length})
                </span>
                <div className="space-y-1.5 divide-y divide-gray-100">
                  {currentOrder.items.map((item, idx) => (
                    <div key={idx} className="pt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={resolveImageUrl(item.imageUrl)}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-md object-cover bg-white border border-gray-200 shrink-0"
                        />
                        <span className="truncate max-w-xs text-gray-800">{item.quantity}x {item.title}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-900 shrink-0">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-200 flex justify-between font-black text-sm text-gray-950">
                  <span>Total de la Orden:</span>
                  <span className="text-indigo-600">{formatCurrency(totalToPay)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-center">
          <button
            onClick={() => setIsBudgetTrackingOpen(false)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
