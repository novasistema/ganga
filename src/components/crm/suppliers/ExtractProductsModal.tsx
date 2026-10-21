import React, { useState } from 'react';
import { RoundingRule, SupplierProduct, SupplierSource } from '../../../types';
import { useStore } from '../../../context/StoreContext';
import { formatCurrency } from '../../../utils/formatters';
import { calculateSalePrice, autoDetectAndCreateCategory, sanitizeSupplierTitle } from '../../../utils/supplierUtils';
import { 
  DownloadCloud, 
  X, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Globe, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Link as LinkIcon,
  ShoppingBag,
  DollarSign,
  Tag,
  Boxes,
  Edit2
} from 'lucide-react';

interface ExtractProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierSource[];
  onExtractFromUrl: (
    url: string, 
    supplierId: string, 
    options?: { customMargin?: number; customMarkup?: number; rounding?: RoundingRule }
  ) => Promise<SupplierProduct[]>;
  darkMode?: boolean;
}

export const ExtractProductsModal: React.FC<ExtractProductsModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onExtractFromUrl,
  darkMode = false
}) => {
  const { catalogCategories, addCustomCategory, publishSupplierProductToStore, addSupplierProduct, companySettings } = useStore();

  // Extraction mode: 'single_url' | 'batch_url'
  const [mode, setMode] = useState<'single_url' | 'batch_url'>('single_url');

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [url, setUrl] = useState('');
  const [marginPercent, setMarginPercent] = useState<number>(45);
  const [fixedMarkupArs, setFixedMarkupArs] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('hundred');

  // Stages: 'input' | 'extracting' | 'preview'
  const [stage, setStage] = useState<'input' | 'extracting' | 'preview'>('input');
  const [extractedProducts, setExtractedProducts] = useState<SupplierProduct[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  // Single product editable state during preview
  const [previewProduct, setPreviewProduct] = useState<SupplierProduct | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  if (!isOpen) return null;

  const currentSupplier = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      setMarginPercent(sup.defaultMarginPercent || 45);
    }
  };

  // Auto-detect supplier from URL domain if possible
  const handleUrlChange = (inputUrl: string) => {
    setUrl(inputUrl);
    const lower = inputUrl.toLowerCase();
    const matched = suppliers.find((s) => {
      try {
        const supDomain = new URL(s.url).hostname.replace('www.', '');
        return lower.includes(supDomain);
      } catch {
        return false;
      }
    });

    if (matched) {
      setSelectedSupplierId(matched.id);
      setMarginPercent(matched.defaultMarginPercent || 45);
    }

    if (lower.includes('/c/') || lower.includes('/categoria') || lower.includes('page=') || lower.includes('/tienda')) {
      setMode('batch_url');
    }
  };

  const handleRunExtraction = async () => {
    if (!url.trim()) {
      setErrorMsg('Por favor ingresá el link del producto a extraer.');
      return;
    }
    if (!selectedSupplierId && suppliers.length > 0) {
      setErrorMsg('Por favor seleccioná el proveedor web de origen.');
      return;
    }

    try {
      setErrorMsg('');
      setStage('extracting');

      const results = await onExtractFromUrl(url.trim(), selectedSupplierId || suppliers[0]?.id || 'supp-1', {
        customMargin: Number(marginPercent) || 45,
        customMarkup: Number(fixedMarkupArs) || 0,
        rounding: roundingRule
      });

      if (!results || results.length === 0) {
        throw new Error('No se pudo extraer el producto desde la URL.');
      }

      setExtractedProducts(results);
      setPreviewProduct(results[0]);
      
      // Auto-register category if not exists
      if (results[0]?.category) {
        addCustomCategory(results[0].category);
      }

      setStage('preview');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error durante la extracción. Verificá que el link sea accesible y volvé a intentar.');
      setStage('input');
    }
  };

  const handleRecalculateSinglePrice = (newMargin: number, newMarkup: number, newRule: RoundingRule) => {
    if (!previewProduct) return;
    const finalPrice = calculateSalePrice(previewProduct.costArs, newMargin, newMarkup, newRule);
    setPreviewProduct({
      ...previewProduct,
      marginPercent: newMargin,
      fixedMarkupArs: newMarkup,
      roundingRule: newRule,
      finalSalePrice: finalPrice
    });
  };

  const handleDirectPublishToStore = async () => {
    if (!previewProduct) return;
    try {
      setIsPublishing(true);
      await publishSupplierProductToStore(previewProduct);
      setSuccessMsg(`¡Producto publicado exitosamente en la Tienda Mayorista ${companySettings?.companyName || 'NUVOH'}!`);
      setTimeout(() => {
        setSuccessMsg('');
        handleFinish();
      }, 1500);
    } catch (e) {
      console.error(e);
      setErrorMsg('Error al publicar el producto en la tienda.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleFinish = () => {
    setStage('input');
    setUrl('');
    setExtractedProducts([]);
    setPreviewProduct(null);
    onClose();
  };

  const cost = previewProduct ? previewProduct.costArs : 0;
  const salePrice = previewProduct ? previewProduct.finalSalePrice : 0;
  const profitArs = Math.max(0, salePrice - cost);
  const profitMarginPct = cost > 0 ? Math.round((profitArs / cost) * 100) : marginPercent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>

        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display tracking-tight flex items-center gap-2">
                <span>Extraer Producto con Link Directo</span>
                <span className="text-[10px] font-mono uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
                  Scraper &amp; Ganancia Automática
                </span>
              </h2>
              <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Pegá el link del producto para extraer foto, datos, stock, categoría y calcular el precio de venta con tu ganancia
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        {stage === 'input' && (
          <div className={`px-6 pt-3 border-b flex items-center gap-4 text-xs font-bold ${
            darkMode ? 'border-zinc-800 bg-zinc-950/30' : 'border-zinc-100 bg-zinc-50/50'
          }`}>
            <button
              type="button"
              onClick={() => setMode('single_url')}
              className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                mode === 'single_url'
                  ? 'border-orange-500 text-orange-600 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link de Producto Individual</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('batch_url')}
              className={`pb-2.5 border-b-2 flex items-center gap-1.5 transition-colors ${
                mode === 'batch_url'
                  ? 'border-orange-500 text-orange-600 font-extrabold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lote de Categoría / Catálogo</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= STAGE 1: INPUT ================= */}
          {stage === 'input' && (
            <div className="space-y-4">
              
              {/* Presets Bar */}
              <div>
                <span className="block font-bold text-zinc-400 uppercase text-[10px] mb-2 tracking-wider">
                  Links de prueba rápida de productos mayoristas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setUrl('https://electrosur-mayorista.com.ar/producto/cafetera-expresso-barista-20bar-acero');
                      setSelectedSupplierId('supp-1');
                      setMarginPercent(45);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex items-start gap-2 ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 hover:border-orange-500' : 'bg-zinc-50 border-zinc-200 hover:border-orange-500'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <strong className="block text-zinc-900 dark:text-zinc-100 truncate">Cafetera Expresso 20 Bar (ElectroSur)</strong>
                      <span className="text-[10px] text-zinc-400 block truncate">electrosur-mayorista.com.ar</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUrl('https://andina-herramientas.com.ar/producto/taladro-percutor-inalambrico-20v-maletin');
                      setSelectedSupplierId('supp-4');
                      setMarginPercent(42);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-colors flex items-start gap-2 ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 hover:border-orange-500' : 'bg-zinc-50 border-zinc-200 hover:border-orange-500'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <strong className="block text-zinc-900 dark:text-zinc-100 truncate">Taladro 20V + Maletín (Andina)</strong>
                      <span className="text-[10px] text-zinc-400 block truncate">andina-herramientas.com.ar</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  {mode === 'single_url' ? 'Link Directo del Producto *' : 'Link de Categoría o Catálogo *'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder={
                      mode === 'single_url'
                        ? 'Ej. https://tienda-proveedor.com.ar/producto/cafetera-barista-20bar'
                        : 'Ej. https://tienda-proveedor.com.ar/c/cocina-electro/page/2'
                    }
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border font-mono text-xs font-medium outline-hidden ${
                      darkMode 
                        ? 'bg-zinc-950 border-zinc-800 focus:border-orange-500 text-white' 
                        : 'bg-zinc-50 border-zinc-200 focus:border-orange-500 text-zinc-900'
                    }`}
                  />
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Web Proveedora Asignada */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  Proveedor Web de Origen *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border font-bold text-xs outline-hidden ${
                    darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.platform}) — Prefijo: {s.skuPrefix} — Margen habitual: +{s.defaultMarginPercent}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculadora de Ganancia: Porcentaje + Monto Fijo + Redondeo */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-orange-50/40 border-orange-200/60'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-xs uppercase tracking-wide text-orange-600">
                    Calculadora de Ganancia para este Producto
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Aumento sobre Costo (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={marginPercent}
                        onChange={(e) => setMarginPercent(Number(e.target.value))}
                        className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                          darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      />
                      <span className="font-mono font-bold text-orange-500">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Monto Fijo Adicional ($ ARS)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-zinc-400">$</span>
                      <input
                        type="number"
                        step="500"
                        min="0"
                        value={fixedMarkupArs}
                        onChange={(e) => setFixedMarkupArs(Number(e.target.value))}
                        placeholder="0"
                        className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                          darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                      Redondeo Comercial
                    </label>
                    <select
                      value={roundingRule}
                      onChange={(e) => setRoundingRule(e.target.value as RoundingRule)}
                      className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                        darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    >
                      <option value="hundred">A $100 más cercano ($210.200)</option>
                      <option value="nine_ninety">Terminación $990 ($209.990)</option>
                      <option value="thousand">A $1.000 más cercano ($210.000)</option>
                      <option value="none">Sin redondeo (Cálculo exacto)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    El precio de venta se calcula automáticamente: <strong>Costo Proveedor × (1 + {marginPercent}%) + ${fixedMarkupArs} ARS</strong>
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ================= STAGE 2: EXTRACTING SPINNER ================= */}
          {stage === 'extracting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-600/15 text-orange-500 flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black font-display">
                  Extrayendo Datos Completos del Producto...
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Descargando imágenes de alta resolución, saneando títulos, extrayendo especificaciones técnicas, detectando stock y calculando tu precio de venta final...
                </p>
              </div>
            </div>
          )}

          {/* ================= STAGE 3: FULL PRODUCT PREVIEW & PROFIT BREAKDOWN ================= */}
          {stage === 'preview' && previewProduct && (
            <div className="space-y-5">
              
              {successMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-500 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Extracted Product Presentation Card */}
              <div className={`p-5 rounded-3xl border ${
                darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  
                  {/* Left: Product Image */}
                  <div className="md:col-span-4 flex flex-col items-center">
                    <div className="w-full aspect-square rounded-2xl bg-white p-3 border border-zinc-200 flex items-center justify-center overflow-hidden shadow-xs">
                      <img
                        src={previewProduct.image}
                        alt={previewProduct.sanitizedTitle}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/images/nuvoh_hero_catalog_1791905594543.jpg';
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-2 text-center block">
                      Imagen oficial extraída del proveedor
                    </span>
                  </div>

                  {/* Right: Product Details & Auto Category */}
                  <div className="md:col-span-8 space-y-3">
                    
                    {/* SKU & Category Strip */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-orange-500/15 text-orange-500">
                        SKU: {previewProduct.internalSku}
                      </span>

                      {/* Auto-detected Category Pill with edit */}
                      <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                        <Sparkles className="w-3 h-3" />
                        <span>Categoría: {previewProduct.category}</span>
                      </div>

                      <span className="text-[11px] text-zinc-400 font-mono ml-auto">
                        Stock: <strong>{previewProduct.stock} u.</strong>
                      </span>
                    </div>

                    {/* Sanitized Title */}
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                        Título Saneado para Tienda
                      </span>
                      <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5 leading-snug">
                        {previewProduct.sanitizedTitle}
                      </h3>
                      <span className="text-[10px] text-zinc-400 block truncate mt-1">
                        Título original en web: {previewProduct.originalTitle}
                      </span>
                    </div>

                    {/* Description & Specs */}
                    {previewProduct.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {previewProduct.description}
                      </p>
                    )}

                    {/* Specs Pills */}
                    {previewProduct.specs && previewProduct.specs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {previewProduct.specs.map((sp, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border font-medium ${
                              darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                            }`}
                          >
                            <strong>{sp.label}:</strong> {sp.desc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* PROFIT & PRICE CALCULATION BREAKDOWN BOX */}
                    <div className={`p-4 rounded-2xl border mt-3 ${
                      darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500 block mb-2">
                        Desglose de Ganancia y Precio Final en Pesos ($ ARS)
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-zinc-400 block">Costo Proveedor</span>
                          <strong className="font-mono text-sm text-zinc-800 dark:text-zinc-200">
                            {formatCurrency(cost, false)}
                          </strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-400 block">Margen Ganancia</span>
                          <strong className="font-mono text-sm text-orange-500">
                            +{profitMarginPct}%
                          </strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-emerald-500 block font-bold">Ganancia Neta</span>
                          <strong className="font-mono text-sm text-emerald-500">
                            +{formatCurrency(profitArs, false)}
                          </strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold uppercase">
                            PVP Final Tienda
                          </span>
                          <strong className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(salePrice, false)}
                          </strong>
                        </div>
                      </div>

                      {/* Live Adjuster Sliders inside Preview */}
                      <div className="mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800 flex flex-wrap items-center gap-3">
                        <span className="text-[11px] font-bold text-zinc-400">Ajustar margen rápido:</span>
                        <div className="flex items-center gap-1">
                          {[30, 40, 45, 50, 60].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                setMarginPercent(pct);
                                handleRecalculateSinglePrice(pct, fixedMarkupArs, roundingRule);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                                marginPercent === pct
                                  ? 'bg-orange-600 text-white border-orange-600'
                                  : darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}
                            >
                              +{pct}%
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="text-xs text-zinc-400">
            {stage === 'input' && (
              <span>Plataforma: <strong>{currentSupplier?.platform}</strong> · Prefijo: <strong>{currentSupplier?.skuPrefix}</strong></span>
            )}
            {stage === 'preview' && (
              <span>Artículo listo para incorporar a la base de datos</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFinish}
              className={`px-4 py-2.5 rounded-xl font-bold transition-colors ${
                darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
            >
              Cancelar
            </button>

            {stage === 'input' && (
              <button
                type="button"
                onClick={handleRunExtraction}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Extraer Datos &amp; Calcular Ganancia</span>
              </button>
            )}

            {stage === 'preview' && previewProduct && (
              <>
                <button
                  type="button"
                  onClick={handleFinish}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                    darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-800'
                  }`}
                >
                  Guardar en Catálogo Dropshipping
                </button>

                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={handleDirectPublishToStore}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                >
                  {isPublishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                  <span>Publicar Directo en Tienda Mayorista</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
