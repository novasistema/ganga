import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Star,
  ShieldCheck,
  Truck,
  CreditCard,
  ShoppingBag,
  Zap,
  Check,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

export const ProductDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct, addToCart, setIsCheckoutOpen, settings } = useStore();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState<string>('');

  React.useEffect(() => {
    if (selectedProduct) {
      setActiveImage(selectedProduct.imageUrl || '');
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  const currentImg = resolveImageUrl(activeImage || selectedProduct.imageUrl);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol || '$'} ${amount.toLocaleString('es-AR')}`;
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-gray-100 text-gray-600 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="md:w-1/2 bg-gray-50 flex flex-col items-center justify-center p-6 relative gap-3">
          <div className="w-full flex items-center justify-center min-h-[240px]">
            <img
              src={currentImg}
              alt={selectedProduct.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (currentImg && !target.src.includes('/api/image-proxy')) {
                  target.src = `/api/image-proxy?url=${encodeURIComponent(currentImg)}`;
                }
              }}
              className="w-full h-auto max-h-80 md:max-h-full object-contain rounded-2xl"
            />
          </div>

          {/* Multiple Gallery Photos Selector */}
          {selectedProduct.galleryUrls && selectedProduct.galleryUrls.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto w-full py-1 justify-center">
              {selectedProduct.galleryUrls.map((gUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(gUrl)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    currentImg === gUrl ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={resolveImageUrl(gUrl)}
                    alt={`Foto ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('/api/image-proxy')) {
                        target.src = `/api/image-proxy?url=${encodeURIComponent(gUrl)}`;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {selectedProduct.featured && (
            <span className="absolute top-4 left-4 bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wide">
              ⭐ DESTACADO
            </span>
          )}
        </div>

        {/* Product Details Column */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
                {selectedProduct.category}
              </span>
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{selectedProduct.rating || 4.9}</span>
                <span className="text-gray-400">({selectedProduct.reviewsCount || 56} reseñas)</span>
              </div>
            </div>

            {/* Out-of-Stock / Removed Cartel Banner */}
            {(() => {
              const isAgotado = selectedProduct.inStock === false || selectedProduct.finalPrice === 0 || (selectedProduct.stock !== undefined && selectedProduct.stock <= 0) || selectedProduct.lastVerifiedStatus === 'out_of_stock';
              if (!isAgotado) return null;
              return (
                <div className="mb-4 p-4 bg-red-500/10 border-2 border-red-500 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-red-600 text-white rounded-xl shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-red-600 uppercase tracking-wide">
                      🚫 CARTEL DE PRODUCTO AGOTADO
                    </h3>
                    <p className="text-xs text-red-700 font-medium mt-0.5">
                      Este producto no se encuentra disponible en la web del proveedor. Su precio ha sido fijado automáticamente en <strong>$ 0</strong> y no admite compras ni pedidos hasta nuevo aviso de stock.
                    </p>
                  </div>
                </div>
              );
            })()}

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
              {selectedProduct.title}
            </h2>

            {/* Price Box */}
            {(() => {
              const isAgotado = selectedProduct.inStock === false || selectedProduct.finalPrice === 0 || (selectedProduct.stock !== undefined && selectedProduct.stock <= 0) || selectedProduct.lastVerifiedStatus === 'out_of_stock';
              if (isAgotado) {
                return (
                  <div className="mt-3 p-3.5 bg-red-50 rounded-2xl border border-red-200">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl sm:text-3xl font-black text-red-600">
                        $ 0
                      </span>
                      <span className="bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        AGOTADO
                      </span>
                    </div>
                    <p className="text-xs text-red-700 font-semibold mt-1">
                      🚫 Sin existencias en depósito ni en catálogo de proveedor
                    </p>
                  </div>
                );
              }
              return (
                <div className="mt-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-950">
                      {formatCurrency(selectedProduct.finalPrice)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(Math.round(selectedProduct.finalPrice * 1.35))}
                    </span>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.5 rounded-md">
                      AHORRAS 35%
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    💳 Hasta 3 cuotas fijas de {formatCurrency(Math.round(selectedProduct.finalPrice / 3))}
                  </p>
                </div>
              );
            })()}

            {/* Description */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Descripción del producto
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
                {selectedProduct.description}
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-[11px] text-gray-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Envío a todo el país</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Garantía de cambio 30 días</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Pagos protegidos</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Stock: {selectedProduct.inStock ? selectedProduct.stock : 0} unidades</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
            {(() => {
              const isAgotado = selectedProduct.inStock === false || selectedProduct.finalPrice === 0 || (selectedProduct.stock !== undefined && selectedProduct.stock <= 0) || selectedProduct.lastVerifiedStatus === 'out_of_stock';
              if (isAgotado) {
                return (
                  <button
                    disabled
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-black bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>🚫 Producto Agotado (No Disponible para Compra)</span>
                  </button>
                );
              }
              return (
                <>
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Cantidad:</span>
                    <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-bold text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                        className="p-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={handleAddToCart}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        added
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {added ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>¡Agregado al Carrito!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Agregar al Carrito</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Comprar Ahora</span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
