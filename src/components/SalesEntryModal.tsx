import React, { useState } from 'react';
import { Product, Customer, Order, OrderItem } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { ShoppingCart, Plus, Trash2, X, CheckCircle, DollarSign, Store } from 'lucide-react';

interface SalesEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onSaleSuccess: () => void;
}

export const SalesEntryModal: React.FC<SalesEntryModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  onSaleSuccess,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('Consumidor Final');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Transferencia Bancaria' | 'Cuenta Corriente'>('Efectivo');
  const [saleItems, setSaleItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    setSaleItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { product, quantity }];
    });
    setSelectedProductId('');
    setQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setSaleItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const subtotal = saleItems.reduce((acc, i) => acc + i.product.finalPriceARS * i.quantity, 0);
  const total = subtotal;

  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      setCustomerName(`${cust.name} (${cust.company || 'Particular'})`);
    } else {
      setCustomerName('Consumidor Final');
    }
  };

  const handleCompleteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) {
      alert('Agregue al menos un producto a la venta.');
      return;
    }

    const orderId = `pos-${Date.now()}`;
    const orderNumber = `POS-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName,
      customerEmail: 'mostrador@importpro.com',
      customerPhone: 'N/D',
      shippingAddress: 'Venta Presencial en Mostrador (No pasa por ARCA)',
      items: saleItems.map(i => ({
        productId: i.product.id,
        title: i.product.title,
        sku: i.product.sku,
        quantity: i.quantity,
        price: i.product.finalPriceARS,
      })),
      subtotal,
      shipping: 0,
      total,
      status: 'Entregado',
      paymentMethod: paymentMethod === 'Cuenta Corriente' ? 'Transferencia Bancaria' : paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // Save order
      await setDoc(doc(db, 'orders', orderId), newOrder);

      // Deduct stock from products in Firestore
      for (const item of saleItems) {
        const newStock = Math.max(0, item.product.stock - item.quantity);
        await updateDoc(doc(db, 'products', item.product.id), {
          stock: newStock,
        });
      }

      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setSaleItems([]);
        onSaleSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="glass-card rounded-[2.5rem] max-w-2xl w-full p-8 text-white relative shadow-2xl border border-white/20 glow-cyan max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full">
          <X className="w-5 h-5" />
        </button>

        {successMessage ? (
          <div className="text-center py-12 space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black">¡Venta Registrada con Éxito!</h3>
            <p className="text-slate-400 text-xs">Descontada del inventario (Operación interna / No pasa por ARCA).</p>
          </div>
        ) : (
          <form onSubmit={handleCompleteSale} className="space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-cyan-600/20 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-cyan-400 glow-cyan">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">Ingreso de Venta Rápida (Mostrador / No Fiscal)</h3>
                <p className="text-xs text-slate-400 font-medium">Venta directa que descuenta stock sin emitir comprobante ARCA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Cliente</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Consumidor Final (Ocasional)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.company || c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-cyan-500"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                </select>
              </div>
            </div>

            {/* Add product selector */}
            <div className="bg-[#121624] p-5 rounded-2xl border border-white/10 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400">Agregar Producto a la Venta</label>
              <div className="flex gap-3">
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="flex-1 bg-[#0A0D18] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-medium"
                >
                  <option value="">Seleccione producto...</option>
                  {products.filter(p => p.active && p.stock > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.title} (${p.finalPriceARS.toLocaleString('es-AR')} - Stock: {p.stock})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-20 bg-[#0A0D18] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold text-center"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase transition shadow"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Detalle de Ítems en la Venta:</span>
              <div className="bg-[#0A0D18] rounded-2xl border border-white/10 overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-slate-400 uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-3">Producto</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Precio</th>
                      <th className="p-3 text-right">Subtotal</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {saleItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-white">{item.product.title}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">${item.product.finalPriceARS.toLocaleString('es-AR')}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">${(item.product.finalPriceARS * item.quantity).toLocaleString('es-AR')}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total & Submit */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-slate-500 block">Total Venta No Fiscal</span>
                <span className="text-2xl font-black text-white font-mono">${total.toLocaleString('es-AR')}</span>
              </div>
              <button
                type="submit"
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider glow-cyan shadow-xl transition"
              >
                Registrar Venta (No Fiscal)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
