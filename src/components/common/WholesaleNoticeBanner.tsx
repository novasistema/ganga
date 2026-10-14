import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Tag, ShoppingBag, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { WHOLESALE_MINIMUM_ORDER } from '../../data/products';

export const WholesaleNoticeBanner: React.FC = () => {
  const { cartTotal, isMinimumReached, minimumRemaining, setIsCartOpen, companySettings } = useStore();
  const minOrder = companySettings?.minimumOrder || WHOLESALE_MINIMUM_ORDER;
  const progressPercent = Math.min(100, Math.round((cartTotal / minOrder) * 100));

  return (
    <div className="bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* 3 Catalog Pillars from Cover */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50/70 border border-orange-100">
            <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-orange-950 font-display">
                PRECIOS MAYORISTAS
              </h4>
              <p className="text-xs text-orange-900/80 mt-0.5">
                Todos los precios de este catálogo son mayoristas directos de importador.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 font-display">
                PEDIDO MÍNIMO {formatCurrency(minOrder, false)}
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                Podés combinar productos de todos los 6 catálogos sin restricciones.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="w-9 h-9 rounded-lg bg-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-display">
                SURTIDO LIBRE
              </h4>
              <p className="text-xs text-zinc-600 mt-0.5">
                Superado el mínimo de $100.000, sin mínimo de cantidad por producto.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar toward $100.000 wholesale minimum */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="w-full md:w-auto flex-1">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                {isMinimumReached ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">
                      ¡Condición Mayorista Alcanzada! Habilitado para pedido y despacho.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-zinc-600">Progreso para activar pedido mayorista:</span>
                    <strong className="text-orange-600 font-bold font-mono">
                      {formatCurrency(cartTotal, false)}
                    </strong>
                    <span className="text-zinc-400">/ {formatCurrency(minOrder, false)}</span>
                  </>
                )}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500">
                {progressPercent}%
              </span>
            </div>
            {/* Track */}
            <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isMinimumReached ? 'bg-emerald-500' : 'bg-orange-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 shrink-0">
            {!isMinimumReached && cartTotal > 0 && (
              <span className="text-xs text-zinc-600">
                Faltan <strong className="text-zinc-900 font-mono">{formatCurrency(minimumRemaining, false)}</strong>
              </span>
            )}
            {cartTotal > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
              >
                <span>Ver Carrito</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
