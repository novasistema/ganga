import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((acc, i) => acc + i.product.finalPriceARS * i.quantity, 0);
  const shipping = subtotal > 0 ? 15000 : 0;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xl">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0C101B] border-l border-white/10 text-white flex flex-col shadow-2xl glow-indigo">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#07090E]/80">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6 text-fuchsia-400" />
              <h2 className="text-lg font-black">Carrito de Compras (ARS)</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <ShoppingBag className="w-16 h-16 text-slate-600 mx-auto animate-bounce" />
                <p className="text-slate-400 text-sm font-medium">Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                  <img src={item.product.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover bg-black/40 border border-white/10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.product.title}</h4>
                    <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                      ${item.product.finalPriceARS.toLocaleString('es-AR')} ARS
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-1 bg-[#1A2035] hover:bg-[#252E4A] rounded-lg text-slate-300 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="p-1 bg-[#1A2035] hover:bg-[#252E4A] rounded-lg text-slate-300 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-[#07090E]/90 space-y-4">
              <div className="space-y-2 text-xs font-medium text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-white">${subtotal.toLocaleString('es-AR')} ARS</span>
                </div>
                <div className="flex justify-between">
                  <span>Logística Express:</span>
                  <span className="font-mono font-bold text-white">${shipping.toLocaleString('es-AR')} ARS</span>
                </div>
                <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
                  <span>Total en Pesos:</span>
                  <span className="font-mono text-emerald-400">${total.toLocaleString('es-AR')} ARS</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onProceedToCheckout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition"
              >
                Proceder al Pago en Pesos <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
