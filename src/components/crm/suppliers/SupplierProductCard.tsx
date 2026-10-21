import React from 'react';
import { SupplierProduct } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import { 
  ExternalLink, 
  CheckCircle2, 
  EyeOff, 
  AlertTriangle, 
  ArrowUpRight, 
  Trash2, 
  Percent, 
  ShoppingBag,
  Globe,
  Tag
} from 'lucide-react';

interface SupplierProductCardProps {
  product: SupplierProduct;
  darkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onPublish: (product: SupplierProduct) => void;
  onUnpublish: (product: SupplierProduct) => void;
  onDelete: (productId: string) => void;
  onOpenQuickEdit?: (product: SupplierProduct) => void;
}

export const SupplierProductCard: React.FC<SupplierProductCardProps> = ({
  product,
  darkMode = false,
  isSelected = false,
  onToggleSelect,
  onPublish,
  onUnpublish,
  onDelete,
  onOpenQuickEdit
}) => {
  const isPublished = product.status === 'published';
  const grossProfit = product.finalSalePrice - product.costArs;
  const markupPercentage = product.costArs > 0 ? Math.round((grossProfit / product.costArs) * 100) : 0;

  return (
    <div 
      className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative group ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:border-zinc-700 shadow-md' 
          : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-300 shadow-xs hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
    >
      {/* Top Header Strip */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between text-xs ${
        darkMode ? 'bg-zinc-950/70 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-100 text-zinc-500'
      }`}>
        <div className="flex items-center gap-2">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
          )}
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
            {product.internalSku}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Published in Store Badge */}
          {isPublished ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En Tienda
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400">
              Borrador
            </span>
          )}

          {/* Cost change alert badge */}
          {product.hasCostChanged && (
            <span 
              className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30"
              title={`Costo anterior: ${formatCurrency(product.previousCostArs || 0)}. Variación: +${product.costChangeDelta}%`}
            >
              <AlertTriangle className="w-3 h-3" />
              +{product.costChangeDelta}% Costo
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Supplier source tag */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-medium text-orange-500 flex items-center gap-1 truncate">
            <Globe className="w-3 h-3 shrink-0" />
            {product.supplierName}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
            darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {product.category}
          </span>
        </div>

        {/* Clean Sanitized Title */}
        <h3 className={`text-sm font-black line-clamp-2 leading-snug tracking-tight mb-3 ${
          darkMode ? 'text-white' : 'text-zinc-900'
        }`}>
          {product.sanitizedTitle}
        </h3>

        {/* Image & Stock Floating Badge */}
        <div className={`relative h-44 rounded-xl flex items-center justify-center p-3 mb-3 border ${
          darkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <img
            src={product.image}
            alt={product.sanitizedTitle}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80';
            }}
          />

          {/* Stock badge */}
          <div className="absolute bottom-2 left-2">
            <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg backdrop-blur-md shadow-xs ${
              product.stock === 0 
                ? 'bg-red-500/90 text-white' 
                : product.stock <= 10 
                  ? 'bg-amber-500/90 text-white' 
                  : 'bg-emerald-600/90 text-white'
            }`}>
              Stock: {product.stock} u.
            </span>
          </div>

          {/* Direct link to restock on supplier web */}
          <a
            href={product.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-900/80 hover:bg-orange-600 text-white text-xs transition-colors shadow-sm flex items-center gap-1 group/btn"
            title="Abrir página del proveedor para reponer stock"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold hidden sm:group-hover/btn:inline">Reponer</span>
          </a>
        </div>

        {/* Price Breakdown: Costo Mayorista vs Precio Venta Calculado */}
        <div className={`p-3 rounded-xl border mb-3 space-y-2 ${
          darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200/70'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={darkMode ? 'text-zinc-400' : 'text-zinc-500'}>
              Costo Mayorista:
            </span>
            <span className="font-mono font-bold">
              {formatCurrency(product.costArs, false)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-orange-500 font-medium">
              <Percent className="w-3 h-3" />
              Margen aplicado:
            </span>
            <span className="font-mono font-bold text-orange-500">
              +{product.marginPercent}% {product.fixedMarkupArs > 0 ? `+ $${product.fixedMarkupArs.toLocaleString('es-AR')}` : ''}
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-200/40 dark:border-zinc-800 flex items-baseline justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-500">
                PVP VENTA TIENDA
              </span>
              <span className={`text-lg font-black font-mono tracking-tight ${
                darkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                {formatCurrency(product.finalSalePrice, false)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                Ganancia Neta
              </span>
              <span className="text-xs font-mono font-bold text-emerald-500">
                +{formatCurrency(grossProfit, false)}
              </span>
            </div>
          </div>
        </div>

        {/* Raw title preview toggle / tooltip */}
        <div className="text-[10px] text-zinc-400 truncate mb-2" title={`Título original en web proveedora: "${product.originalTitle}"`}>
          <span className="font-semibold">Original:</span> {product.originalTitle}
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className={`p-3 border-t flex items-center justify-between gap-2 ${
        darkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-zinc-100/50 border-zinc-100'
      }`}>
        {isPublished ? (
          <button
            onClick={() => onUnpublish(product)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ocultar de Tienda</span>
          </button>
        ) : (
          <button
            onClick={() => onPublish(product)}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-98"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Publicar en Tienda</span>
          </button>
        )}

        {onOpenQuickEdit && (
          <button
            onClick={() => onOpenQuickEdit(product)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors ${
              darkMode 
                ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' 
                : 'border-zinc-200 hover:bg-zinc-200 text-zinc-700'
            }`}
            title="Editar margen, costo o datos"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={() => onDelete(product.id)}
          className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          title="Eliminar artículo de la lista de dropshipping"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
