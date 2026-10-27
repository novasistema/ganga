import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Star, Zap, Eye, Check } from 'lucide-react';
import { resolveImageUrl, DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const {
    settings,
    addToCart,
    setIsCartOpen,
    setIsCheckoutOpen,
    setSelectedProduct,
    activeReseller,
    calculateProductPriceForViajante
  } = useStore();
  const [addedJustNow, setAddedJustNow] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(() => resolveImageUrl(product.imageUrl));
  const [retriedWithProxy, setRetriedWithProxy] = useState(false);

  React.useEffect(() => {
    setImageSrc(resolveImageUrl(product.imageUrl));
    setRetriedWithProxy(false);
  }, [product.imageUrl]);

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol || '$'} ${amount.toLocaleString('es-AR')}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setAddedJustNow(true);
    setTimeout(() => setAddedJustNow(false), 1200);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
    setIsCheckoutOpen(true);
  };

  // Out of stock / discontinued check
  const isAgotado = product.inStock === false || product.finalPrice === 0 || (product.stock !== undefined && product.stock <= 0) || product.lastVerifiedStatus === 'out_of_stock';

  // Viajante calculation (if in Viajante Mode)
  const viajanteCalc = activeReseller ? calculateProductPriceForViajante(product) : null;
  const displayPrice = isAgotado ? 0 : (viajanteCalc ? viajanteCalc.viajantePrice : product.finalPrice);

  // Installments configuration & calculation: strictly general for all or none
  const isInstallmentsEnabled =
    !isAgotado &&
    settings.enableInstallments !== false &&
    (!settings.installmentsMinAmount || displayPrice >= settings.installmentsMinAmount);

  const installmentsCount = settings.installmentsCount || 3;
  const isInterestFree = settings.installmentsType !== 'fixed';
  const installmentPrice = isAgotado || !isInstallmentsEnabled ? 0 : Math.round(displayPrice / installmentsCount);

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className={`group relative bg-white rounded-2xl border shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1 ${
        isAgotado ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'
      }`}
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <img
          src={imageSrc}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            const raw = (product.imageUrl || '').trim();
            if (!retriedWithProxy && raw && !imageSrc.includes('/api/image-proxy')) {
              setRetriedWithProxy(true);
              setImageSrc(`/api/image-proxy?url=${encodeURIComponent(raw)}`);
            } else {
              setImageSrc(DEFAULT_PRODUCT_PLACEHOLDER);
            }
          }}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            isAgotado ? 'grayscale-[50%] opacity-85' : ''
          }`}
        />

        {/* Big Prominent Cartel de Agotado Overlay */}
        {isAgotado && (
          <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1.5px] flex flex-col items-center justify-center z-20 p-2 text-center pointer-events-none">
            <span className="bg-red-600 text-white font-black text-xs sm:text-sm px-4 py-1.5 rounded-full shadow-2xl tracking-widest uppercase border-2 border-white flex items-center gap-1.5 animate-pulse">
              <span>🚫 AGOTADO</span>
            </span>
            <span className="text-[10px] text-red-200 font-bold mt-1.5 bg-black/70 px-2.5 py-0.5 rounded-full border border-red-500/40">
              Sin existencias en proveedor
            </span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {isAgotado ? (
            <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
              <span>🚫</span>
              <span>AGOTADO</span>
            </span>
          ) : (
            <>

              {product.featured && (
                <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                  <Zap className="w-3 h-3 fill-slate-950" />
                  DESTACADO
                </span>
              )}

              {product.markupPercentage && product.markupPercentage > 0 ? (
                <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs">
                  OFERTA
                </span>
              ) : null}

              {product.finalPrice >= (settings.freeShippingThreshold || 35000) && (
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                  ENVÍO GRATIS
                </span>
              )}
            </>
          )}
        </div>

        {/* Quick View overlay button */}
        {!isAgotado && (
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-gray-900 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye className="w-3.5 h-3.5" />
              Vista Rápida
            </span>
          </div>
        )}

        {/* Stock indicator badge if low stock and not out of stock */}
        {!isAgotado && product.stock <= 5 && product.stock > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-rose-950/80 backdrop-blur-xs text-rose-200 text-[10px] font-bold py-1 px-2 rounded-lg text-center">
            ¡Solo quedan {product.stock} unidades!
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
              {product.category || 'Dropshipping'}
            </span>
            <div className="flex items-center gap-1 text-amber-500 font-bold text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating || 4.8}</span>
              <span className="text-gray-400 font-normal">({product.reviewsCount || 42})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Price section */}
          <div className="mt-3">
            {isAgotado ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-red-600 tracking-tight">
                    $ 0
                  </span>
                  <span className="text-[10px] font-extrabold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-md uppercase">
                    Agotado
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-red-600 mt-1">
                  🚫 No disponible actualmente para compra
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-gray-950 tracking-tight">
                    {formatCurrency(displayPrice)}
                  </span>
                  {product.originalPrice && product.originalPrice > 0 && !viajanteCalc && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatCurrency(Math.round(product.finalPrice * 1.35))}
                    </span>
                  )}
                </div>

                {/* Installments notice */}
                {isInstallmentsEnabled && (
                  <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                    💳 {installmentsCount} cuotas {isInterestFree ? 'sin interés' : 'fijas'} de <strong className="font-bold">{formatCurrency(installmentPrice)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Buttons Action Bar */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
          {isAgotado ? (
            <button
              disabled
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span>🚫 Agotado en Proveedor</span>
            </button>
          ) : (
            <>
              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock && product.stock <= 0}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addedJustNow
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-95'
                }`}
              >
                {addedJustNow ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>¡Agregado!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </>
                )}
              </button>

              {/* Buy Now button */}
              <button
                onClick={handleBuyNow}
                disabled={!product.inStock && product.stock <= 0}
                className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Comprar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
