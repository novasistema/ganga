import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  MessageCircle, 
  Eye, 
  Flame, 
  Wind, 
  Clock, 
  Zap, 
  Maximize2, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Battery, 
  Monitor, 
  Sparkles,
  Wrench,
  Edit3
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

// Spec icon resolver for the 4 spec circular points
const renderSpecIcon = (iconName?: string) => {
  switch (iconName) {
    case 'flame': return <Flame className="w-3.5 h-3.5 text-orange-600" />;
    case 'wind': return <Wind className="w-3.5 h-3.5 text-orange-600" />;
    case 'clock': return <Clock className="w-3.5 h-3.5 text-orange-600" />;
    case 'zap': return <Zap className="w-3.5 h-3.5 text-orange-600" />;
    case 'battery': return <Battery className="w-3.5 h-3.5 text-orange-600" />;
    case 'monitor': return <Monitor className="w-3.5 h-3.5 text-orange-600" />;
    case 'tool': return <Wrench className="w-3.5 h-3.5 text-orange-600" />;
    case 'cpu': return <Cpu className="w-3.5 h-3.5 text-orange-600" />;
    case 'sparkles': return <Sparkles className="w-3.5 h-3.5 text-orange-600" />;
    case 'layers': return <Layers className="w-3.5 h-3.5 text-orange-600" />;
    case 'shield': return <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />;
    default: return <Maximize2 className="w-3.5 h-3.5 text-orange-600" />;
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, setSelectedProductForModal, isCrmAuthenticated, openEditProductModal, companySettings } = useStore();
  const brandName = companySettings?.companyName?.trim() || 'NUVOH';
  const [qty, setQty] = useState(1);

  const handleIncrement = () => setQty((prev) => prev + 1);
  const handleDecrement = () => setQty((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    addToCart(product, qty);
  };

  const whatsAppText = `Hola ${brandName}, estoy interesado en el producto: ${product.name} (SKU: ${product.sku}). ¿Tienen stock disponible para entrega y cotización mayorista?`;
  const whatsAppLink = generateWhatsAppLink(companySettings?.phone?.replace(/\D/g, '') || '5491149821100', whatsAppText);

  return (
    <article className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* Top Header & Breadcrumb Ribbon */}
        <div className="p-4 pb-2 border-b border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
          <div className="flex items-center gap-1.5 uppercase tracking-wider">
            <span>HOME</span>
            <span>/</span>
            <span className="text-zinc-700 font-semibold">{product.category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isCrmAuthenticated && (
              <button
                type="button"
                onClick={() => openEditProductModal(product)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 hover:bg-orange-600 hover:text-white font-bold text-[10px] transition-colors"
                title="Modificar este producto (Administrador)"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modificar</span>
              </button>
            )}
            {product.code && (
              <span className="font-mono text-zinc-400 text-[10px]">{product.code}</span>
            )}
          </div>
        </div>

        {/* Catchy Hook Section from Catalog */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {product.badges.map((badge, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded"
              >
                {badge}
              </span>
            ))}
          </div>
          <h4 className="text-sm font-black uppercase tracking-tight text-orange-600 font-display line-clamp-1">
            {product.hook}
          </h4>
          <h3 className="text-base font-extrabold text-zinc-900 tracking-tight mt-0.5 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs font-mono text-zinc-600 mt-0.5">
            (SKU {product.sku})
          </p>
        </div>

        {/* Image Showcase */}
        <div 
          onClick={() => setSelectedProductForModal(product)}
          className="relative px-5 py-4 cursor-pointer bg-radial from-zinc-50 to-white flex items-center justify-center overflow-hidden min-h-56"
        >
          <img
            src={resolveProductImage(product.image, product.category)}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={(e) => handleImageError(e, product.category)}
            className="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-103"
            loading="lazy"
          />

          {/* Quick detail hover pill */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/90 text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1 shadow-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>Ficha completa</span>
          </div>
        </div>

        {/* 4 Feature Badges (Matching the exact catalog 4-point design) */}
        {product.specs && product.specs.length > 0 && (
          <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {product.specs.slice(0, 4).map((spec, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-orange-100/80 flex items-center justify-center shrink-0 mt-0.5">
                    {renderSpecIcon(spec.iconName)}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-800 uppercase block text-[10px] leading-tight">
                      {spec.label}
                    </span>
                    <span className="text-zinc-500 text-[10px] leading-tight line-clamp-1">
                      {spec.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Commercial Section */}
      <div className="p-5 pt-3 border-t border-zinc-100 bg-white">
        {/* Main Price Card in Signature Catalog Orange */}
        <div className="bg-orange-600 text-white rounded-xl p-3.5 flex items-baseline justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black font-display tracking-tight tabular-nums">
              {formatCurrency(product.priceUnit, false)}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-90">
              PRECIO X 1 UNIDAD
            </div>
          </div>
          <span className="text-xs font-black tracking-widest bg-black/20 px-2 py-0.5 rounded">
            ARS
          </span>
        </div>

        {/* Wholesale Tier Table (from catalog) */}
        <div className="mt-3 bg-zinc-50 rounded-xl p-2.5 border border-zinc-200/80">
          <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-700 mb-1.5">
            PRECIO POR CANTIDAD (C/U)
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-white rounded-lg p-1.5 border border-zinc-200">
              <span className="text-[9px] uppercase font-bold text-zinc-700 block">DESDE 5 U.</span>
              <span className="text-[11px] font-bold font-mono text-zinc-900 tabular-nums">
                {product.priceTiers.tier5 ? formatCurrency(product.priceTiers.tier5, false) : '-'}
              </span>
            </div>
            <div className="bg-white rounded-lg p-1.5 border border-zinc-200">
              <span className="text-[9px] uppercase font-bold text-zinc-700 block">DESDE 10 U.</span>
              <span className="text-[11px] font-bold font-mono text-zinc-900 tabular-nums">
                {product.priceTiers.tier10 ? formatCurrency(product.priceTiers.tier10, false) : '-'}
              </span>
            </div>
            <div className="bg-white rounded-lg p-1.5 border border-zinc-200">
              <span className="text-[9px] uppercase font-bold text-zinc-700 block">DESDE 100 U.</span>
              <span className="text-[11px] font-bold font-mono text-zinc-900 tabular-nums">
                {product.priceTiers.tier100 ? formatCurrency(product.priceTiers.tier100, false) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-3.5 flex items-center gap-2">
          {/* Quantity selector */}
          <div className="flex items-center border border-zinc-300 rounded-xl bg-zinc-50 overflow-hidden shrink-0">
            <button
              onClick={handleDecrement}
              className="p-2 hover:bg-zinc-200 text-zinc-600 transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold font-mono text-zinc-900">
              {qty}
            </span>
            <button
              onClick={handleIncrement}
              className="p-2 hover:bg-zinc-200 text-zinc-600 transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to order button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-orange-400" />
            <span>Agregar</span>
          </button>

          {/* WhatsApp Direct Consult */}
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            title="Consultar stock por WhatsApp"
            className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </article>
  );
};
