import React from 'react';
import { useStore } from '../context/StoreContext';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Plus, Minus, Truck } from 'lucide-react';
import { resolveImageUrl, DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    setIsCheckoutOpen,
    settings
  } = useStore();

  if (!isCartOpen) return null;

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol || '$'} ${amount.toLocaleString('es-AR')}`;
  };

  const freeShippingThreshold = settings.freeShippingThreshold || 35000;
  const missingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const freeShippingProgress = Math.min(100, Math.round((cartTotal / freeShippingThreshold) * 100));

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">Tu Carrito de Compras</h2>
              <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-indigo-50/70 p-3.5 border-b border-indigo-100/50">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                {missingForFreeShipping === 0
                  ? '¡Genial! Tienes Envío GRATIS asegurado 🎉'
                  : `Agrega ${formatCurrency(missingForFreeShipping)} más para ENVÍO GRATIS`}
              </span>
              <span className="font-bold text-indigo-600">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-indigo-200/50 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-base">Tu carrito está vacío</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Explora nuestro catálogo con los mejores productos en tendencia e impórtalos a tu orden.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Ver Catálogo
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 items-center"
                >
                  {/* Thumbnail */}
                  <img
                    src={resolveImageUrl(item.product.imageUrl)}
                    alt={item.product.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const raw = (item.product.imageUrl || '').trim();
                      if (raw && !target.src.includes('/api/image-proxy')) {
                        target.src = `/api/image-proxy?url=${encodeURIComponent(raw)}`;
                      } else {
                        target.src = DEFAULT_PRODUCT_PLACEHOLDER;
                      }
                    }}
                    className="w-16 h-16 object-cover rounded-xl bg-white shrink-0 border border-gray-100"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {item.product.title}
                    </h4>
                    <p className="text-xs font-extrabold text-indigo-600 mt-0.5">
                      {formatCurrency(item.product.finalPrice)}
                    </p>

                    {/* Quantity modifier */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 bg-white rounded-lg">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[11px] text-gray-400">
                        Subtotal: {formatCurrency(item.product.finalPrice * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Eliminar artículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-3">
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal productos:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Costo de envío:</span>
                  <span className="font-semibold text-emerald-600">
                    {missingForFreeShipping === 0 ? '¡GRATIS!' : formatCurrency(2800)}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-black text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total estimado:</span>
                  <span className="text-indigo-600">
                    {formatCurrency(cartTotal + (missingForFreeShipping === 0 ? 0 : 2800))}
                  </span>
                </div>
              </div>

              {/* Start Checkout button */}
              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Proceder al Pago Seguro</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Checkout cifrado SSL de 256 bits</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
