import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Truck,
  MessageCircle,
  FileText,
  Printer,
  Sparkles,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartTotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    settings,
    createOrder,
    setIsBudgetTrackingOpen,
    setTrackingOrderId
  } = useStore();

  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Customer Form State
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    notes: ''
  });

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card_gateway' | 'mercadopago'>('card_gateway');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '3'
  });
  const [transferProofName, setTransferProofName] = useState<string>('');

  if (!isCheckoutOpen) return null;

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol || '$'} ${amount.toLocaleString('es-AR')}`;
  };

  const freeShipping = cartTotal >= (settings.freeShippingThreshold || 35000);
  const shippingCost = freeShipping ? 0 : 2800;
  
  // 10% discount for bank transfer
  const bankDiscount = paymentMethod === 'bank_transfer' ? Math.round(cartTotal * 0.10) : 0;
  const grandTotal = cartTotal + shippingCost - bankDiscount;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const validateCustomerForm = () => {
    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.address.trim()) {
      alert('Por favor completa todos los campos requeridos (Nombre, Email, Teléfono y Dirección).');
      return false;
    }
    return true;
  };

  const handleProcessOrder = async () => {
    if (paymentMethod === 'card_gateway') {
      if (cardData.number.replace(/\s/g, '').length < 15 || !cardData.name.trim() || !cardData.expiry || !cardData.cvv) {
        alert('Por favor completa los datos de tu tarjeta de crédito o débito.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Simulate real-time automated gateway processing
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.finalPrice,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl
      }));

      const newOrderId = await createOrder({
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerCity: customer.city || 'No especificada',
        customerNotes: customer.notes || '',
        items: orderItems,
        totalAmount: grandTotal,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'presupuesto_pendiente',
        trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`
      });

      setCreatedOrderId(newOrderId);
      setStep('success');

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      alert('Hubo un error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Order Confirmation Link
  const buildWhatsAppOrderLink = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const itemsList = cart.map((i) => `• ${i.quantity}x ${i.product.title}`).join('\n');
    const msg = `¡Hola ${settings.companyName}! Acabo de realizar una compra online.\n\n*Nro de Orden:* ${createdOrderId}\n*Cliente:* ${customer.name}\n*Total:* ${formatCurrency(grandTotal)}\n*Método de Pago:* ${paymentMethod.toUpperCase()}\n\n*Artículos:*\n${itemsList}\n\n*Dirección de envío:* ${customer.address}, ${customer.city}`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Pasarela de Compra Segura</h3>
              <p className="text-[11px] text-slate-300">
                {step === 'form' && 'Paso 1 de 2: Datos de Entrega'}
                {step === 'payment' && 'Paso 2 de 2: Selección y Pasarela de Pago'}
                {step === 'success' && '¡Pedido Confirmado con Éxito!'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* STEP 1: CUSTOMER DATA */}
          {step === 'form' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100/60 text-xs text-indigo-900 flex items-center gap-3">
                <Truck className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  Ingresa tus datos personales y dirección exacta donde el repartidor entregará el paquete.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre y Apellido Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="juan.perez@gmail.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+54 9 11 1234 5678"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dirección de Entrega (Calle, Altura, Piso / Dpto) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Av. Libertador 4500, Piso 3 Dpto B"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ciudad / Localidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. CABA o Rosario"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 1425"
                    value={customer.zip}
                    onChange={(e) => setCustomer({ ...customer, zip: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Indicaciones para la entrega (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Tocar timbre blanco, dejar en portería, etc."
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT GATEWAY */}
          {step === 'payment' && (
            <div className="space-y-5">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Selecciona la Forma de Pago:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Card Gateway */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card_gateway')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentMethod === 'card_gateway'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'card_gateway' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        3 Cuotas Fijas
                      </span>
                    </div>
                    <span className="font-bold text-xs text-gray-900">Tarjeta Débito / Crédito</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Acreditación instantánea</span>
                  </button>

                  {/* Option 2: Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Building2 className={`w-5 h-5 ${paymentMethod === 'bank_transfer' ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-md">
                        10% OFF
                      </span>
                    </div>
                    <span className="font-bold text-xs text-gray-900">Transferencia Bancaria</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">CBU / CVU / Alias</span>
                  </button>

                  {/* Option 3: Mercado Pago */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      paymentMethod === 'mercadopago'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-100'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sparkles className={`w-5 h-5 ${paymentMethod === 'mercadopago' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        Rápido
                      </span>
                    </div>
                    <span className="font-bold text-xs text-gray-900">Mercado Pago / QR</span>
                    <span className="text-[10px] text-gray-500 mt-0.5">Dinero en cuenta</span>
                  </button>
                </div>
              </div>

              {/* DETAILS FOR CARD GATEWAY */}
              {paymentMethod === 'card_gateway' && (
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Datos de la Tarjeta</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">VISA</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">MASTERCARD</span>
                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200">AMEX</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4500 •••• •••• 1234"
                      value={cardData.number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                        setCardData({ ...cardData, number: val });
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Nombre y Apellido del Titular
                    </label>
                    <input
                      type="text"
                      placeholder="COMO FIGURA EN LA TARJETA"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Vencimiento
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Código de Seguridad (CVV)
                      </label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Planes de Cuotas
                    </label>
                    <select
                      value={cardData.installments}
                      onChange={(e) => setCardData({ ...cardData, installments: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value="1">1 pago de {formatCurrency(grandTotal)}</option>
                      <option value="3">3 cuotas fijas de {formatCurrency(Math.round(grandTotal / 3))}</option>
                      <option value="6">6 cuotas de {formatCurrency(Math.round((grandTotal * 1.08) / 6))}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* DETAILS FOR BANK TRANSFER */}
              {paymentMethod === 'bank_transfer' && (
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Datos Bancarios para Transferencia (10% OFF aplicado)
                    </span>
                    <span className="bg-amber-200/70 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                      Ahorras: {formatCurrency(bankDiscount)}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-700 bg-white p-3.5 rounded-xl border border-amber-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Banco:</span>
                      <span className="font-bold text-gray-900">{settings.bankName || 'Banco Santander'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Titular:</span>
                      <span className="font-bold text-gray-900">{settings.bankAccountHolder || settings.companyName}</span>
                    </div>

                    {settings.bankCuit && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">CUIT / CUIL:</span>
                        <span className="font-mono font-bold text-gray-900">{settings.bankCuit}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                      <div>
                        <span className="text-gray-500 block text-[11px]">CBU / Alias:</span>
                        <span className="font-mono font-black text-indigo-700 text-sm">
                          {settings.bankCbuAlias || 'DROPSTORE.ALIAS'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(settings.bankCbuAlias || 'DROPSTORE.ALIAS', 'cbu')}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'cbu' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Adjuntar Comprobante de Transferencia (Opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setTransferProofName(file.name);
                      }}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer"
                    />
                    {transferProofName && (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        ✓ Archivo seleccionado: {transferProofName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* DETAILS FOR MERCADO PAGO */}
              {paymentMethod === 'mercadopago' && (
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80 text-center space-y-3">
                  <span className="text-xs font-bold text-blue-900 block">
                    Escanea el código QR con tu app de Mercado Pago o banco:
                  </span>
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://mercadopago.com/checkout/${grandTotal}`}
                      alt="QR Mercado Pago"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Acepta dinero en cuenta, débito y tarjetas de crédito con acreditación automática.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS / ORDER CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center space-y-5 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-md shadow-emerald-200">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
                  ¡Solicitud de Pedido Recibida, {customer.name}!
                </span>
                <h3 className="text-2xl font-black text-gray-900 mt-1">
                  Verificando Stock para Tu Presupuesto
                </h3>
                <div className="inline-block bg-indigo-50 text-indigo-800 font-mono text-xs font-bold px-3 py-1.5 rounded-lg mt-2 border border-indigo-200">
                  Orden #{createdOrderId}
                </div>
              </div>

              {/* Explanatory Banner for the Workflow */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 text-left space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Paso siguiente: Verificación de existencias
                </span>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  Para tu total tranquilidad, confirmamos físicamente que no haya faltantes de los artículos antes de cobrarte. Una vez listo el presupuesto, te contactaremos por WhatsApp con el enlace oficial para abonar por <strong>Transferencia</strong> o abriendo tu billetera de <strong>Mercado Pago</strong>.
                </p>
              </div>

              {/* Order Info Card */}
              <div className="bg-gray-50 rounded-2xl p-4 text-left text-xs space-y-2 border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monto del presupuesto:</span>
                  <span className="font-extrabold text-indigo-700 text-sm">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Preferencia de pago:</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {paymentMethod === 'bank_transfer' ? 'Transferencia Bancaria (10% OFF)' : 'Mercado Pago (App / Tarjetas)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Destino de entrega:</span>
                  <span className="font-semibold text-gray-800">{customer.address}, {customer.city}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={buildWhatsAppOrderLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Solicitud por WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setTrackingOrderId(createdOrderId);
                    setIsCheckoutOpen(false);
                    setIsBudgetTrackingOpen(true);
                  }}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 transition-colors cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  <span>Ver Estado de Mi Presupuesto</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step !== 'success' && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
            {step === 'payment' ? (
              <button
                type="button"
                onClick={() => setStep('form')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a datos</span>
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                Paso 1 de 2
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total a pagar</span>
                <span className="text-base font-black text-gray-950">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {step === 'form' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateCustomerForm()) {
                      setStep('payment');
                    }
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Continuar al Pago</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProcessOrder}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Procesando Pago Seguro...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirmar y Pagar</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-center">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Volver a la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
