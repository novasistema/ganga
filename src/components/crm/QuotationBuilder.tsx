import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, calculateUnitPrice, generateWhatsAppLink } from '../../utils/formatters';
import { Product } from '../../types';
import { 
  Plus, 
  Trash2, 
  Printer, 
  MessageCircle, 
  Save, 
  CheckCircle2, 
  Building2, 
  User, 
  FileCheck,
  Percent
} from 'lucide-react';

interface QuoteItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const QuotationBuilder: React.FC = () => {
  const { products, clients, addDeal, setActiveTab, companySettings } = useStore();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQuantity, setItemQuantity] = useState<number>(5);
  const [additionalDiscountPercent, setAdditionalDiscountPercent] = useState<number>(0);
  const [quoteSavedNotification, setQuoteSavedNotification] = useState(false);

  // When picking existing client, auto-fill contact fields
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setCustomerName(client.name);
      setBusinessName(client.businessName);
      setPhone(client.phone);
      setCity(`${client.city}, ${client.province}`);
    }
  };

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const unitPrice = calculateUnitPrice(prod, itemQuantity);
    const total = unitPrice * itemQuantity;

    setQuoteItems((prev) => {
      const existing = prev.find((item) => item.product.id === prod.id);
      if (existing) {
        const newQty = existing.quantity + itemQuantity;
        const newUnitPrice = calculateUnitPrice(prod, newQty);
        return prev.map((item) =>
          item.product.id === prod.id
            ? { ...item, quantity: newQty, unitPrice: newUnitPrice, total: newUnitPrice * newQty }
            : item
        );
      }
      return [...prev, { product: prod, quantity: itemQuantity, unitPrice, total }];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setQuoteItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * additionalDiscountPercent) / 100;
  const finalTotal = subtotal - discountAmount;
  const isMinReached = finalTotal >= (companySettings?.minimumOrder || 100000);

  // Build high-converting WhatsApp pitch copy
  const getWhatsAppPitch = () => {
    let msg = `Hola ${customerName || 'estimado cliente'}, te comparto el presupuesto oficial de *${companySettings?.companyName || 'NUVOH'} Mayorista* para *${businessName || 'tu comercio'}*:\n\n`;
    quoteItems.forEach((item, idx) => {
      msg += `🔹 ${idx + 1}. *${item.product.name}* (SKU: ${item.product.sku})\n`;
      msg += `   ${item.quantity} u. x ${formatCurrency(item.unitPrice, false)} = ${formatCurrency(item.total)}\n`;
    });
    msg += `\n------------------------------------\n`;
    msg += `📦 *Subtotal:* ${formatCurrency(subtotal)}\n`;
    if (additionalDiscountPercent > 0) {
      msg += `🏷️ *Bonificación especial (${additionalDiscountPercent}%):* -${formatCurrency(discountAmount)}\n`;
    }
    msg += `⭐ *TOTAL COTIZADO:* ${formatCurrency(finalTotal)}\n`;
    msg += `\n✅ *Condiciones comerciales:*`;
    msg += `\n• Stock disponible en depósito central para despacho inmediato en 24hs.`;
    msg += `\n• Precios de importador directo con Factura Oficial A o B.`;
    msg += `\n• Envíos a todo el país por expreso de tu preferencia.`;
    msg += `\n\n¿Deseás que procedamos con la reserva de las unidades y te envíe los datos de facturación?`;
    return msg;
  };

  const handleSaveToPipeline = () => {
    if (!customerName || quoteItems.length === 0) {
      alert('Por favor ingrese nombre del cliente y al menos 1 producto.');
      return;
    }

    addDeal({
      customerName,
      businessName,
      phone: phone || '+54 9 11 0000-0000',
      city: city || 'Argentina',
      stage: 'quoted',
      items: quoteItems.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      })),
      totalAmount: finalTotal,
      notes: `Cotización formal generada por ${formatCurrency(finalTotal)} con ${quoteItems.length} ítems de catálogo.`
    });

    setQuoteSavedNotification(true);
    setTimeout(() => setQuoteSavedNotification(false), 4000);
  };

  const waUrl = generateWhatsAppLink(phone || '5491149821100', getWhatsAppPitch());

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-zinc-950 font-display">
            Cotizador Mayorista &amp; Generador de Proformas
          </h3>
          <p className="text-xs text-zinc-500">
            Armá presupuestos rápidos con escalas de volumen, imprimí la proforma oficial o cerrá la venta por WhatsApp.
          </p>
        </div>

        {quoteSavedNotification && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>¡Cotización guardada exitosamente en el Pipeline CRM!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Input controls */}
        <div className="lg:col-span-5 space-y-4 no-print">
          {/* Client select */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-display flex items-center gap-1.5">
                <User className="w-4 h-4 text-orange-600" />
                <span>Destinatario de la Cotización</span>
              </h4>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                Cargar desde Clientes Registrados:
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-zinc-300 outline-hidden bg-white"
              >
                <option value="">-- Nuevo Prospecto o Particular --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} ({c.name} - {c.tier})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Nombre *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Gustavo Morales"
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Comercio / Negocio</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ej. Ferretería del Sur"
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">WhatsApp *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-0.5">Ciudad / Destino</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Córdoba"
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 outline-hidden focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Add product to quotation */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900 font-display flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-orange-600" />
              <span>Agregar Producto de Catálogo</span>
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                Seleccionar Producto:
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 outline-hidden bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.priceUnit, false)} (SKU {p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-32">
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">
                  Cantidad (U.):
                </label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs p-2 rounded-xl border border-zinc-300 outline-hidden font-bold font-mono"
                />
              </div>

              <div className="flex-1 pt-5">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 px-3 bg-zinc-900 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Presupuesto</span>
                </button>
              </div>
            </div>

            {/* Special volume discount slider */}
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between text-[11px] text-zinc-600 mb-1">
                <span className="font-semibold flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-orange-600" />
                  <span>Descuento adicional de cierre:</span>
                </span>
                <span className="font-mono font-bold text-orange-600">{additionalDiscountPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={additionalDiscountPercent}
                onChange={(e) => setAdditionalDiscountPercent(parseInt(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2">
            <button
              onClick={handleSaveToPipeline}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Guardar en Pipeline CRM</span>
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Copiar y Enviar Propuesta a WhatsApp</span>
            </a>

            <button
              onClick={() => window.print()}
              className="w-full py-2 px-4 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-300 transition-colors"
            >
              <Printer className="w-4 h-4 text-zinc-600" />
              <span>Imprimir / Exportar Proforma Oficial</span>
            </button>
          </div>
        </div>

        {/* Right: Printable Official NUVOH Proforma Sheet */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
          {/* Proforma Document Header */}
          <div className="border-b border-zinc-200 pb-5 mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black font-display">
                  {(companySettings?.companyName || 'N')[0]?.toUpperCase()}
                </div>
                <span className="text-2xl font-black tracking-tight text-zinc-950 font-display">
                  {companySettings?.companyName || 'NUVOH'}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold block mt-0.5">
                TECNOLOGÍA PARA TU HOGAR · {companySettings?.legalName || 'IMPORTADOR DIRECTO'}
              </span>
              <p className="text-[11px] text-zinc-500 mt-1">
                {companySettings?.address}, {companySettings?.city} · {companySettings?.email} · CUIT: {companySettings?.cuit}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold uppercase text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded">
                PRESUPUESTO MAYORISTA
              </span>
              <div className="text-xs font-mono text-zinc-500 mt-1.5">
                N° COT-2026-{Math.floor(1000 + Math.random() * 9000)}
              </div>
              <div className="text-[11px] text-zinc-400">
                Fecha: {new Date().toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>

          {/* Client Destination Info */}
          <div className="bg-zinc-50 rounded-xl p-3.5 mb-5 grid grid-cols-2 gap-3 text-xs border border-zinc-200/80">
            <div>
              <span className="text-[10px] text-zinc-600 uppercase font-bold block">Cliente / Razón Social:</span>
              <strong className="text-zinc-900 font-semibold">{businessName || customerName || 'Cliente Mayorista'}</strong>
              {customerName && businessName && (
                <span className="text-zinc-500 block text-[11px]">Contacto: {customerName}</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-zinc-600 uppercase font-bold block">Destino / Contacto:</span>
              <span className="text-zinc-900">{city || 'A coordinar'}</span>
              <span className="text-zinc-500 block text-[11px]">{phone || 'WhatsApp no especificado'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-zinc-200 rounded-xl overflow-hidden mb-5">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-700 uppercase font-bold text-[10px] border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-3">Ítem / Descripción</th>
                  <th className="py-2.5 px-2 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">P. Unitario</th>
                  <th className="py-2.5 px-3 text-right">Subtotal</th>
                  <th className="py-2.5 px-2 text-center no-print w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {quoteItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400 italic">
                      No hay productos cargados en esta proforma.
                    </td>
                  </tr>
                ) : (
                  quoteItems.map((item) => (
                    <tr key={item.product.id} className="hover:bg-zinc-50">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-zinc-900 block">{item.product.name}</span>
                        <span className="font-mono text-[10px] text-zinc-600">SKU: {item.product.sku}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-zinc-800">
                        {item.quantity} u.
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-700 tabular-nums">
                        {formatCurrency(item.unitPrice, false)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-950 tabular-nums">
                        {formatCurrency(item.total, false)}
                      </td>
                      <td className="py-2.5 px-2 text-center no-print">
                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-zinc-300 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Conditions */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pt-2 border-t border-zinc-200">
            <div className="text-[11px] text-zinc-500 space-y-1">
              <p>• Validez de la oferta: <strong>5 días hábiles</strong>.</p>
              <p>• Sujeto a disponibilidad de stock en depósito central al confirmar.</p>
              <p>• Condición mínima de catálogo: <strong>{formatCurrency(companySettings?.minimumOrder || 100000, false)}</strong> (Surtido Libre).</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal bruto:</span>
                <span className="font-mono tabular-nums font-semibold">{formatCurrency(subtotal, false)}</span>
              </div>
              {additionalDiscountPercent > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Bonif. ({additionalDiscountPercent}%):</span>
                  <span className="font-mono tabular-nums">-{formatCurrency(discountAmount, false)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 text-sm">
                <strong className="text-zinc-950 font-display">TOTAL FINAL:</strong>
                <strong className="text-lg font-black font-mono text-orange-600 tabular-nums">
                  {formatCurrency(finalTotal)}
                </strong>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
