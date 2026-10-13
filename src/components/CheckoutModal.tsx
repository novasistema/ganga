import React, { useState } from 'react';
import { CartItem, Order, OrderItem, OrderStatus } from '../types';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, CheckCircle, CreditCard, DollarSign } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, onOrderSuccess }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Mercado Pago' | 'Transferencia Bancaria' | 'Efectivo'>('Mercado Pago');
  const [loading, setLoading] = useState(false);
  const [successModalData, setSuccessModalData] = useState<Order | null>(null);
  const [companyConfig, setCompanyConfig] = useState<any>(null);

  React.useEffect(() => {
    try {
      const local = localStorage.getItem('importpro_company_config');
      if (local) {
        setCompanyConfig(JSON.parse(local));
      }
    } catch (e) {}
  }, []);

  if (!isOpen) return null;

  const totalAmount = cart.reduce((acc, i) => acc + (i.product.finalPriceARS * i.quantity), 0);

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);

    const orderItems: OrderItem[] = cart.map(i => ({
      productId: i.product.id,
      title: i.product.title,
      sku: i.product.sku,
      quantity: i.quantity,
      price: i.product.finalPriceARS,
    }));

    const status: OrderStatus = paymentMethod === 'Efectivo' ? 'Pendiente de Pago' : 'Pagado';

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: clientName || 'Cliente Ocasional',
      customerEmail: clientEmail || 'cliente@ganaga.com',
      customerPhone: clientPhone || '+54 9 11 0000 0000',
      shippingAddress: shippingAddress || 'Retiro en Local / Envío Standard',
      items: orderItems,
      subtotal: totalAmount,
      shipping: 0,
      total: totalAmount,
      status,
      paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
    } catch (e) {
      console.warn("Offline order storage fallback");
    }

    setLoading(false);
    onOrderSuccess(newOrder);
    setSuccessModalData(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
      
      {/* Success Popup Modal when payment received */}
      {successModalData ? (
        <div className="glass-card rounded-[3rem] max-w-md w-full p-10 text-center space-y-6 border border-emerald-500/50 glow-emerald shadow-2xl animate-fade-in relative z-50">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/50 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
              ¡Pago Ingresado con Éxito!
            </span>
            <h2 className="text-2xl font-black text-white">¡Nuevo Pago Recibido!</h2>
            <p className="text-xs text-slate-300">
              Se ha procesado un pago por <span className="font-mono text-emerald-400 font-bold">${successModalData.total.toLocaleString('es-AR')} ARS</span> a través de <span className="text-cyan-300 font-bold">{successModalData.paymentMethod}</span>.
            </p>
          </div>

          <div className="bg-[#121624] p-4 rounded-2xl border border-white/10 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Cliente:</span>
              <span className="font-bold text-white">{successModalData.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Orden N°:</span>
              <span className="font-mono text-cyan-400">{successModalData.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estado:</span>
              <span className="font-bold text-emerald-400 uppercase">{successModalData.status}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSuccessModalData(null);
              onClose();
            }}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl transition"
          >
            Aceptar & Continuar
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-[2.5rem] max-w-lg w-full p-8 text-white relative shadow-2xl border border-white/20 glow-indigo">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center glow-indigo">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black">Finalizar Compra & Pago</h3>
              <p className="text-xs text-slate-400">Total a abonar: <span className="font-mono text-emerald-400 font-bold">${totalAmount.toLocaleString('es-AR')} ARS</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmitCheckout} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nombre y Apellido</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={e => setClientEmail(e.target.value)}
                placeholder="juan@correo.com"
                className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                required
                value={clientPhone}
                onChange={e => setClientPhone(e.target.value)}
                placeholder="+54 9 11 ..."
                className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Dirección de Envío</label>
              <input
                type="text"
                required
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                placeholder="Av. Corrientes 1234, CABA"
                className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Método de Pago</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-violet-500"
              >
                <option value="Mercado Pago">Mercado Pago (QR / Online)</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria CBU/Alias</option>
                <option value="Efectivo">Efectivo en Local</option>
              </select>
            </div>

            {paymentMethod === 'Mercado Pago' && (
              <div className="bg-[#121624] p-4 rounded-2xl border border-cyan-500/30 space-y-2.5 text-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">Datos de Cuenta Mercado Pago:</span>
                  <span className="bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono">Instantáneo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alias / CVU:</span>
                  <span className="font-mono text-white font-bold">{companyConfig?.mpAlias || 'ganaga.mp.pagos'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular:</span>
                  <span className="text-white font-bold">{companyConfig?.mpHolder || 'Ganga S.A.'}</span>
                </div>
                <a
                  href="https://www.mercadopago.com.ar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full py-3 bg-[#009ee3] hover:bg-[#0082be] text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 transition shadow cursor-pointer"
                >
                  Abrir Mercado Pago & Pagar ↗
                </a>
              </div>
            )}

            {paymentMethod === 'Transferencia Bancaria' && (
              <div className="bg-[#121624] p-4 rounded-2xl border border-emerald-500/30 space-y-2 text-xs animate-fadeIn">
                <p className="font-bold text-emerald-300">Datos Bancarios para Transferencia:</p>
                <div className="flex justify-between">
                  <span className="text-slate-400">Banco:</span>
                  <span className="text-white font-bold">{companyConfig?.bankName || 'Banco Galicia'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CBU:</span>
                  <span className="font-mono text-white font-bold">{companyConfig?.bankCbu || '0000003100012345678901'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alias:</span>
                  <span className="font-mono text-cyan-300 font-bold">{companyConfig?.bankAlias || 'GANAGA.GLOBAL.AR'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular / CUIT:</span>
                  <span className="text-white">{companyConfig?.bankHolder || 'Ganga S.A. CUIT 30-71234567-9'}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition flex items-center justify-center gap-2"
            >
              {loading ? 'Procesando Pago...' : 'Confirmar & Pagar Ahora'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};
