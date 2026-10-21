import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, calculateUnitPrice, generateWhatsAppLink } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { 
  X, 
  ShoppingCart, 
  MessageCircle, 
  Package, 
  CheckCircle, 
  ShieldCheck, 
  Truck, 
  Plus, 
  Minus,
  FileText
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const { selectedProductForModal, setSelectedProductForModal, addToCart, setActiveTab, companySettings } = useStore();
  const brandName = companySettings?.companyName?.trim() || 'NUVOH';
  const [quantity, setQuantity] = useState(1);

  if (!selectedProductForModal) return null;
  const product = selectedProductForModal;

  const currentUnitPrice = calculateUnitPrice(product, quantity);
  const totalCost = currentUnitPrice * quantity;
  const regularCost = product.priceUnit * quantity;
  const totalSavings = regularCost - totalCost;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setSelectedProductForModal(null);
  };

  const whatsAppText = `Hola ${brandName}, estoy en la tienda online y quiero cotizar el siguiente producto:\n\n*${product.name}*\nSKU: ${product.sku}\nCantidad de interés: ${quantity} unidades\nPrecio calculado: ${formatCurrency(totalCost)}\n\n¿Tienen entrega inmediata?`;
  const whatsAppLink = generateWhatsAppLink(companySettings?.phone?.replace(/\D/g, '') || '5491149821100', whatsAppText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-zinc-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              {product.category}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              SKU: {product.sku}
            </span>
          </div>
          <button
            onClick={() => setSelectedProductForModal(null)}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Main Top Section: Image + Title & Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Image & badges */}
            <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-200/80 flex flex-col items-center justify-center relative">
              <div className="flex flex-wrap gap-1.5 self-start mb-3">
                {product.badges.map((b, i) => (
                  <span key={i} className="text-[10px] font-mono font-bold uppercase text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    {b}
                  </span>
                ))}
              </div>
              <img
                src={resolveProductImage(product.image, product.category)}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={(e) => handleImageError(e, product.category)}
                className="w-full h-60 object-contain drop-shadow-sm"
              />
              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Stock Real ({product.stock} u.)
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> Despacho 24hs
                </span>
              </div>
            </div>

            {/* Right: Info, Price Card & Wholesale Scale */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-orange-600 font-display">
                  {product.hook}
                </p>
                <h2 className="text-2xl font-black text-zinc-950 font-display tracking-tight mt-1">
                  {product.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-medium">
                  <span>Marca: <strong className="text-zinc-800">{product.brand}</strong></span>
                  {product.code && (
                    <>
                      <span>·</span>
                      <span className="font-mono">{product.code}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Price block */}
              <div className="bg-orange-600 text-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-3xl font-black font-display tabular-nums tracking-tight">
                      {formatCurrency(currentUnitPrice, false)}
                    </div>
                    <div className="text-[11px] font-semibold tracking-wider uppercase opacity-90 mt-0.5">
                      {quantity >= 100 ? 'Precio Mayorista Escala 100+ u.' : quantity >= 10 ? 'Precio Mayorista Escala 10+ u.' : quantity >= 5 ? 'Precio Mayorista Escala 5+ u.' : 'Precio por unidad base'}
                    </div>
                  </div>
                  <span className="text-xs font-black tracking-widest bg-black/20 px-2.5 py-1 rounded">
                    ARS
                  </span>
                </div>
              </div>

              {/* Tier Breakdown Table */}
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Escala de Precios Mayoristas
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className={`p-2 rounded-lg border ${quantity >= 5 && quantity < 10 ? 'bg-orange-50 border-orange-300 font-bold text-orange-950' : 'bg-white border-zinc-200'}`}>
                    <span className="text-[10px] text-zinc-700 block">DESDE 5 U.</span>
                    <span className="font-mono font-bold tabular-nums">
                      {product.priceTiers.tier5 ? formatCurrency(product.priceTiers.tier5, false) : '-'}
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg border ${quantity >= 10 && quantity < 100 ? 'bg-orange-50 border-orange-300 font-bold text-orange-950' : 'bg-white border-zinc-200'}`}>
                    <span className="text-[10px] text-zinc-700 block">DESDE 10 U.</span>
                    <span className="font-mono font-bold tabular-nums">
                      {product.priceTiers.tier10 ? formatCurrency(product.priceTiers.tier10, false) : '-'}
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg border ${quantity >= 100 ? 'bg-orange-50 border-orange-300 font-bold text-orange-950' : 'bg-white border-zinc-200'}`}>
                    <span className="text-[10px] text-zinc-700 block">DESDE 100 U.</span>
                    <span className="font-mono font-bold tabular-nums">
                      {product.priceTiers.tier100 ? formatCurrency(product.priceTiers.tier100, false) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Quantity Simulator */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-zinc-700">Seleccionar cantidad para el pedido:</span>
                  <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-1.5 hover:bg-zinc-100 text-zinc-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 text-center font-bold font-mono text-sm py-1 outline-hidden"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-1.5 hover:bg-zinc-100 text-zinc-600"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal calculation */}
                <div className="bg-zinc-100 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-600">Subtotal calculado:</span>
                    <strong className="block text-sm font-black font-mono text-zinc-900 tabular-nums">
                      {formatCurrency(totalCost)}
                    </strong>
                  </div>
                  {totalSavings > 0 && (
                    <div className="text-right">
                      <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        Ahorro por volumen: {formatCurrency(totalSavings, false)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Point Specifications Breakdown */}
          <div className="border-t border-zinc-200 pt-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 mb-4 font-display">
              Características Principales de Catálogo
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {product.specs.map((spec, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold mb-2">
                    {i + 1}
                  </div>
                  <h5 className="font-black text-xs uppercase tracking-tight text-zinc-900 font-display">
                    {spec.label}
                  </h5>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    {spec.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Wholesale Policy Reminder */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-950">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Condición Mayorista {brandName}:</strong>
              Pedido mínimo de {formatCurrency(companySettings?.minimumOrder || 100000)} ARS combinando cualquier producto de nuestros catálogos. Surtido libre y factura oficial A o B.
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="w-full sm:flex-1 py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Agregar {quantity} u. al Pedido ({formatCurrency(totalCost, false)})</span>
            </button>

            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Cotizar por WhatsApp</span>
            </a>

            <button
              onClick={() => {
                setSelectedProductForModal(null);
                setActiveTab('quotation');
              }}
              className="w-full sm:w-auto py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-zinc-200"
            >
              <FileText className="w-4 h-4 text-zinc-600" />
              <span>Abrir Cotizador CRM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
