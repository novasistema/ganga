import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { WHOLESALE_MINIMUM_ORDER } from '../../data/products';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingCart, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    updateCartQuantity, 
    removeFromCart, 
    clearCart, 
    cartTotal, 
    isMinimumReached, 
    minimumRemaining,
    setIsCheckoutOpen,
    setActiveTab,
    companySettings
  } = useStore();

  const brandName = companySettings?.companyName?.trim() || 'NUVOH';

  if (!isCartOpen) return null;

  // Generate WhatsApp formatted order text
  const generateOrderMessage = () => {
    let msg = `*NUEVO PEDIDO MAYORISTA - ${brandName.toUpperCase()}*\n`;
    msg += `------------------------------------\n`;
    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.product.name}*\n`;
      msg += `   SKU: ${item.product.sku}\n`;
      msg += `   Cant: ${item.quantity} u. x ${formatCurrency(item.unitPriceApplied, false)} = ${formatCurrency(item.totalPrice)}\n\n`;
    });
    msg += `------------------------------------\n`;
    msg += `*TOTAL DEL PEDIDO:* ${formatCurrency(cartTotal)}\n`;
    msg += `*Condición:* ${isMinimumReached ? `Supera pedido mínimo mayorista (${formatCurrency(companySettings?.minimumOrder || 100000)})` : 'Consulta de cotización'}\n\n`;
    msg += `Por favor confirmen disponibilidad de stock y formas de pago para coordinar el despacho.`;
    return msg;
  };

  const whatsAppLink = generateWhatsAppLink(companySettings?.phone?.replace(/\D/g, '') || '5491149821100', generateOrderMessage());

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-zinc-200">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-zinc-950 font-display text-base">
                  Pedido Mayorista
                </h3>
                <p className="text-[11px] text-zinc-500">
                  {cart.length} {cart.length === 1 ? 'producto' : 'productos'} en la lista
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md transition-colors"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-800 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Wholesale threshold alert */}
          <div className="p-3.5 bg-zinc-100 border-b border-zinc-200">
            {isMinimumReached ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>¡Pedido mínimo alcanzado! ($100.000 ARS) Precios mayoristas aplicados.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Mínimo mayorista: $100.000 ARS.</span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Te faltan <strong className="font-mono">{formatCurrency(minimumRemaining, false)}</strong> para activar la orden oficial. Podés combinar cualquier categoría.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-400 mx-auto flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-zinc-800 text-sm">Tu pedido está vacío</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  Agregá productos de nuestro catálogo oficial para armar tu cotización con precios de importador.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Explorar Catálogo {brandName}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs flex items-center gap-3"
                >
                  <img
                    src={resolveProductImage(item.product.image, item.product.category)}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleImageError(e, item.product.category)}
                    className="w-16 h-16 object-contain bg-zinc-50 rounded-lg p-1 shrink-0 border border-zinc-100"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <h4 className="text-xs font-bold text-zinc-900 truncate">
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-zinc-400 hover:text-red-500 p-0.5 shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-600 font-mono">
                      SKU: {item.product.sku}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-zinc-600 hover:bg-zinc-200 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold font-mono text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-zinc-600 hover:bg-zinc-200 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price breakdown */}
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-700 block">
                          c/u: {formatCurrency(item.unitPriceApplied, false)}
                        </span>
                        <strong className="text-xs font-bold font-mono text-zinc-950 tabular-nums">
                          {formatCurrency(item.totalPrice)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Actions */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Subtotal estimado:</span>
                  <span className="font-mono tabular-nums font-semibold text-zinc-800">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-zinc-200">
                  <span className="text-sm font-black font-display text-zinc-950">
                    Total Mayorista:
                  </span>
                  <span className="text-lg font-black font-display text-orange-600 font-mono tabular-nums">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                {/* 1. Confirm online order button */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Confirmar Pedido y Facturación</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 2. WhatsApp Direct Order Button (high-conversion closing tool!) */}
                <a
                  href={whatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Pedido Directo a WhatsApp</span>
                </a>

                {/* 3. Send to quotation builder in CRM */}
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setActiveTab('quotation');
                  }}
                  className="w-full py-2 px-4 bg-white hover:bg-zinc-100 text-zinc-700 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-zinc-300 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Abrir en Generador de Presupuesto / PDF</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
