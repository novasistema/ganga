import React, { useState } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ShoppingBag, Star, Zap, Eye, Check } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { settings, addToCart, setIsCartOpen, setIsCheckoutOpen, setSelectedProduct } = useStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [addedJustNow, setAddedJustNow] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  const resolvedImg = resolveImageUrl(product.imageUrl);

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

  // Estimated 3 installments calculation
  const installmentPrice = Math.round(product.finalPrice / 3);

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer hover:-translate-y-1"
    >
      {/* Product Image Container */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
        {/* Skeleton while loading */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
        )}

        <img
          src={imageError ? fallbackImage : resolvedImg}
          alt={product.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (product.imageUrl && !target.src.includes('/api/image-proxy')) {
              target.src = `/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}`;
            } else {
              setImageError(true);
              setImageLoaded(true);
            }
          }}
          className={`w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
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
        </div>

        {/* Quick View overlay button */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="bg-white/95 text-gray-900 text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            Vista Rápida
          </span>
        </div>

        {/* Stock indicator badge if low stock */}
        {product.stock <= 5 && product.stock > 0 && (
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
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-gray-950 tracking-tight">
                {formatCurrency(product.finalPrice)}
              </span>
              {product.originalPrice && product.originalPrice > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(Math.round(product.finalPrice * 1.35))}
                </span>
              )}
            </div>

            {/* Installments notice */}
            <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
              3 cuotas fijas de <strong className="font-bold">{formatCurrency(installmentPrice)}</strong>
            </p>
          </div>
        </div>

        {/* Buttons Action Bar */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
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
        </div>
      </div>
    </div>
  );
};
