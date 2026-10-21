import React, { useState } from 'react';
import { RoundingRule, SupplierPlatform, SupplierProduct, SupplierSource } from '../../../types';
import { useStore } from '../../../context/StoreContext';
import { scanSupplierWebCatalog, autoDetectAndCreateCategory, calculateSalePrice } from '../../../utils/supplierUtils';
import { formatCurrency } from '../../../utils/formatters';
import { 
  Globe, 
  X, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  Search, 
  CheckSquare, 
  Square, 
  ShoppingBag, 
  ExternalLink,
  RefreshCw,
  Tag,
  AlertCircle,
  TrendingUp,
  Percent
} from 'lucide-react';

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSupplier: (supplier: Omit<SupplierSource, 'id' | 'productsCount' | 'lastSyncAt'>) => Promise<SupplierSource>;
  darkMode?: boolean;
}

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onAddSupplier,
  darkMode = false
}) => {
  const { catalogCategories, addCustomCategory, batchImportSupplierProducts } = useStore();

  // Wizard steps: 'form' | 'scanning' | 'select_products' | 'done'
  const [step, setStep] = useState<'form' | 'scanning' | 'select_products' | 'done'>('form');

  // Step 1: Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<SupplierPlatform>('WooCommerce');
  const [skuPrefix, setSkuPrefix] = useState('');
  const [defaultMarginPercent, setDefaultMarginPercent] = useState<number>(45);
  const [fixedMarkupArs, setFixedMarkupArs] = useState<number>(0);
  const [roundingRule, setRoundingRule] = useState<RoundingRule>('hundred');
  const [currency, setCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2: Scanned catalog products state
  const [scannedProducts, setScannedProducts] = useState<SupplierProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('Todos');
  const [autoPublishToStore, setAutoPublishToStore] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; published: number; categories: string[] } | null>(null);

  if (!isOpen) return null;

  // Auto-generate suggested SKU prefix when name changes
  const handleNameChange = (val: string) => {
    setName(val);
    if (!skuPrefix || skuPrefix.length <= 3) {
      const words = val.trim().split(/\s+/);
      const suggested = words.map((w) => w[0]).join('').slice(0, 3).toUpperCase();
      if (suggested.length >= 2) {
        setSkuPrefix(suggested);
      }
    }
  };

  const handleStartScan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Ingresá el nombre comercial del proveedor.');
      return;
    }
    if (!url.trim()) {
      setErrorMsg('Ingresá la dirección web del catálogo o tienda online.');
      return;
    }
    if (!skuPrefix.trim()) {
      setErrorMsg('Ingresá un prefijo de SKU para estandarizar los códigos (ej. ELS).');
      return;
    }

    try {
      setErrorMsg('');
      setStep('scanning');

      // Normalize URL
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      // Crawl and scan all products on that web
      const products = await scanSupplierWebCatalog({
        name: name.trim(),
        url: cleanUrl,
        platform,
        skuPrefix: skuPrefix.trim().toUpperCase().slice(0, 5),
        defaultMarginPercent: Number(defaultMarginPercent) || 45
      }, {
        customMargin: Number(defaultMarginPercent) || 45,
        customMarkup: Number(fixedMarkupArs) || 0,
        rounding: roundingRule,
        existingCategories: catalogCategories
      });

      setScannedProducts(products);
      // Select all products by default for fast onboarding
      setSelectedIds(products.map((p) => p.id));
      setStep('select_products');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('No se pudo escanear el catálogo web. Verificá la URL e intentá nuevamente.');
      setStep('form');
    }
  };

  const handleConfirmImport = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Seleccioná al menos 1 producto para incorporar a tu catálogo.');
      return;
    }

    try {
      setIsImporting(true);
      setErrorMsg('');

      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }

      // 1. Add supplier source
      const createdSupplier = await onAddSupplier({
        name: name.trim(),
        url: cleanUrl,
        platform,
        skuPrefix: skuPrefix.trim().toUpperCase().slice(0, 5),
        defaultMarginPercent: Number(defaultMarginPercent) || 45,
        currency,
        exchangeRate: currency === 'USD' ? (Number(exchangeRate) || 1200) : 1,
        status: 'active',
        notes: notes.trim()
      });

      // 2. Filter selected products and attach the created supplierId
      const productsToSave = scannedProducts
        .filter((p) => selectedIds.includes(p.id))
        .map((p) => ({
          ...p,
          supplierId: createdSupplier.id,
          supplierName: createdSupplier.name
        }));

      // 3. Batch import into context, auto-creating any new categories and publishing if requested
      const result = await batchImportSupplierProducts(productsToSave, autoPublishToStore);

      setImportSummary({
        imported: result.importedCount,
        published: result.publishedCount,
        categories: result.newCategories
      });

      setStep('done');
    } catch (err: any) {
      console.error('Import failed:', err);
      setErrorMsg('Error al guardar los productos en la base de datos.');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === visibleProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleProducts.map((p) => p.id));
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Recalculate margins for all scanned products
  const handleMarginChange = (newMargin: number) => {
    setDefaultMarginPercent(newMargin);
    setScannedProducts((prev) =>
      prev.map((p) => {
        const finalPrice = calculateSalePrice(p.costArs, newMargin, fixedMarkupArs, roundingRule);
        return {
          ...p,
          marginPercent: newMargin,
          finalSalePrice: finalPrice
        };
      })
    );
  };

  // Quick edit category for a specific scanned product
  const handleUpdateProductCategory = (prodId: string, newCat: string) => {
    const cleanCat = newCat.trim();
    if (!cleanCat) return;
    setScannedProducts((prev) =>
      prev.map((p) => (p.id === prodId ? { ...p, category: cleanCat } : p))
    );
    addCustomCategory(cleanCat);
  };

  // Filtered products in step 2
  const visibleProducts = scannedProducts.filter((p) => {
    const matchesSearch = 
      p.sanitizedTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.originalTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.internalSku.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = selectedCategoryTab === 'Todos' || p.category === selectedCategoryTab;
    return matchesSearch && matchesCat;
  });

  // Extract detected categories from scanned products
  const detectedCategories = Array.from(new Set(scannedProducts.map((p) => p.category)));

  const handleCloseAndReset = () => {
    setStep('form');
    setName('');
    setUrl('');
    setSkuPrefix('');
    setScannedProducts([]);
    setSelectedIds([]);
    setImportSummary(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className={`w-full ${step === 'select_products' ? 'max-w-5xl' : 'max-w-2xl'} rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200 ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black font-display tracking-tight flex items-center gap-2">
                <span>Conectar Web Proveedora &amp; Catálogo Dropshipping</span>
                {step === 'select_products' && (
                  <span className="text-[10px] font-mono uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full font-bold">
                    Paso 2: Selección de Productos
                  </span>
                )}
              </h2>
              <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {step === 'form' && 'Ingresá la dirección web del mayorista para extraer su catálogo completo'}
                {step === 'scanning' && 'Conectando con la web mayorista y analizando estructura de productos...'}
                {step === 'select_products' && 'Elegí cuáles artículos incorporar a tu catálogo y auto-creá categorías'}
                {step === 'done' && 'Sincronización completada con éxito'}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseAndReset}
            className={`p-1.5 rounded-lg transition-colors ${
              darkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================= STEP 1: WEB SUPPLIER DATA ================= */}
          {step === 'form' && (
            <form onSubmit={handleStartScan} className="space-y-4">
              
              {/* Presets Bar */}
              <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                <span className="font-bold text-[10px] uppercase tracking-wider text-orange-600 block mb-2">
                  Atajo: Cargar web mayorista de prueba (Argentina):
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setName('ElectroSur Mayorista BsAs');
                      setUrl('https://electrosur-mayorista.com.ar');
                      setPlatform('WooCommerce');
                      setSkuPrefix('ELS');
                      setDefaultMarginPercent(45);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      darkMode ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    ⚡ ElectroSur (WooCommerce)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('TechBaires Importación');
                      setUrl('https://techbaires-import.com');
                      setPlatform('Shopify');
                      setSkuPrefix('TBR');
                      setDefaultMarginPercent(40);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      darkMode ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    🎧 TechBaires (Shopify)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('Bazar & Hogar Cuyo');
                      setUrl('https://bazarhogarcuyo.mitiendanube.com');
                      setPlatform('Tiendanube');
                      setSkuPrefix('BHC');
                      setDefaultMarginPercent(50);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      darkMode ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    🍳 Bazar Cuyo (Tiendanube)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName('Ferretería Industrial Andina');
                      setUrl('https://andina-herramientas.com.ar');
                      setPlatform('WooCommerce');
                      setSkuPrefix('AND');
                      setDefaultMarginPercent(42);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
                      darkMode ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700' : 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    🔨 Andina Ferretería
                  </button>
                </div>
              </div>

              {/* Nombre y Plataforma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                    Nombre del Proveedor *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej. Distribuidora Sur Mayorista"
                    className={`w-full px-3 py-2 rounded-xl border font-semibold outline-hidden ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                    Plataforma Web *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as SupplierPlatform)}
                    className={`w-full px-3 py-2 rounded-xl border font-semibold outline-hidden ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <option value="WooCommerce">WooCommerce (WordPress)</option>
                    <option value="Shopify">Shopify</option>
                    <option value="Tiendanube">Tiendanube</option>
                    <option value="Magento">Magento / Adobe Commerce</option>
                    <option value="MercadoLibre / Custom">MercadoLibre / Web Mayorista Propia</option>
                  </select>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                  Dirección Web de la Tienda / Catálogo *
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://mayoristadistribucion.com.ar"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border font-mono font-medium outline-hidden ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  El motor escaneará la estructura del sitio para listar todos los artículos disponibles.
                </span>
              </div>

              {/* Prefijo y Margen */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                    Prefijo SKU *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={skuPrefix}
                    onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                    placeholder="ELS"
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-black uppercase ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-orange-500' : 'bg-zinc-50 border-zinc-200 text-orange-600'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-400 mt-0.5 block">
                    Formato: NVH-{skuPrefix || 'XXX'}-0001
                  </span>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                    Margen Ganancia Predeterminado
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1"
                      min="5"
                      max="300"
                      value={defaultMarginPercent}
                      onChange={(e) => setDefaultMarginPercent(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                        darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                      }`}
                    />
                    <span className="font-mono font-bold text-orange-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5 opacity-80">
                    Moneda de Costo
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'ARS' | 'USD')}
                    className={`w-full px-3 py-2 rounded-xl border font-semibold ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <option value="ARS">$ Pesos Argentinos (ARS)</option>
                    <option value="USD">U$D Dólares (con cotización)</option>
                  </select>
                </div>
              </div>

              {/* Botón de Escaneo */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 text-sm transition-all active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Escanear y Listar Todos los Productos de la Web</span>
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 2: SCANNING ANIMATION ================= */}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-600/15 text-orange-500 flex items-center justify-center animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black font-display">
                  Escaneando Catálogo Completo de la Web
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Rastreando productos, extrayendo imágenes, detectando costos mayoristas y clasificando categorías automáticamente para {name || 'la web proveedora'}...
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Extracción inteligente DOM &amp; API activa</span>
              </div>
            </div>
          )}

          {/* ================= STEP 3: INTERACTIVE PRODUCT PICKER & AUTO CATEGORIES ================= */}
          {step === 'select_products' && (
            <div className="space-y-4">
              {/* Header Bar */}
              <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-orange-50/40 border-orange-200/60'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-orange-500/15 text-orange-500">
                      {scannedProducts.length} Artículos Detectados
                    </span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {url}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Marcá con el tilde cuáles querés incorporar. Las categorías se asignan y crean automáticamente según cada producto.
                  </p>
                </div>

                {/* Quick Selection Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                      darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                    }`}
                  >
                    {selectedIds.length === visibleProducts.length ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5 text-orange-500" />}
                    <span>{selectedIds.length === visibleProducts.length ? 'Deseleccionar' : 'Seleccionar Todos'}</span>
                  </button>

                  <span className="text-xs font-black font-mono text-orange-500 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    {selectedIds.length} Señalados
                  </span>
                </div>
              </div>

              {/* Adjust Profit Margin & Filters Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nombre o SKU..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-hidden ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                {/* Margen Global en Vivo */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-400">Margen Ganancia:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="5"
                      min="10"
                      max="300"
                      value={defaultMarginPercent}
                      onChange={(e) => handleMarginChange(Number(e.target.value))}
                      className={`w-16 px-2 py-1 rounded-xl border font-mono font-bold text-xs ${
                        darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                      }`}
                    />
                    <span className="font-mono font-bold text-orange-500 text-xs">%</span>
                  </div>
                </div>

                {/* Auto Publish Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={autoPublishToStore}
                    onChange={(e) => setAutoPublishToStore(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 cursor-pointer"
                  />
                  <span>Publicar directo en Tienda Mayorista</span>
                </label>
              </div>

              {/* Categories Tabs Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('Todos')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-colors ${
                    selectedCategoryTab === 'Todos'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : darkMode ? 'bg-zinc-950 text-zinc-400 border-zinc-800' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}
                >
                  Todas ({scannedProducts.length})
                </button>
                {detectedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-colors flex items-center gap-1 ${
                      selectedCategoryTab === cat
                        ? 'bg-orange-600 text-white border-orange-600'
                        : darkMode ? 'bg-zinc-950 text-zinc-400 border-zinc-800' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className="opacity-60 text-[10px]">
                      ({scannedProducts.filter((p) => p.category === cat).length})
                    </span>
                  </button>
                ))}
              </div>

              {/* Scanned Products Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {visibleProducts.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  const profitArs = Math.max(0, prod.finalSalePrice - prod.costArs);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? darkMode ? 'bg-zinc-950 border-orange-500 shadow-sm' : 'bg-orange-50/20 border-orange-400 shadow-xs'
                          : darkMode ? 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 opacity-70' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 opacity-70'
                      }`}
                    >
                      {/* Selection indicator */}
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by card click
                          className="w-4 h-4 rounded text-orange-600 cursor-pointer"
                        />
                      </div>

                      {/* Thumbnail */}
                      <img
                        src={prod.image}
                        alt={prod.sanitizedTitle}
                        className="w-16 h-16 object-contain rounded-xl bg-white p-1 border border-zinc-200 shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/images/nuvoh_hero_catalog_1791905594543.jpg';
                        }}
                      />

                      {/* Info & Category */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500">
                            {prod.internalSku}
                          </span>
                          
                          {/* Auto Category Pill */}
                          <span 
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                            title="Categoría creada / asignada automáticamente según el producto"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{prod.category}</span>
                          </span>

                          <span className="text-[10px] text-zinc-400 font-mono ml-auto">
                            Stock: {prod.stock} u.
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-zinc-900 dark:text-white truncate">
                          {prod.sanitizedTitle}
                        </h4>
                        
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {prod.originalTitle}
                        </p>

                        {/* Price breakdown */}
                        <div className="mt-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] text-zinc-400 block font-bold">Costo Proveedor</span>
                            <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300">
                              {formatCurrency(prod.costArs, false)}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-500 block font-bold">
                              PVP (+{prod.marginPercent}%)
                            </span>
                            <span className="font-mono font-black text-emerald-500 text-sm">
                              {formatCurrency(prod.finalSalePrice, false)}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono block">
                              Ganancia: +{formatCurrency(profitArs, false)}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ================= STEP 4: SUCCESS SUMMARY ================= */}
          {step === 'done' && importSummary && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black font-display text-zinc-900 dark:text-white">
                  ¡Web Conectada e Importación Exitosa!
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Se conectó <strong>{name}</strong> y se incorporaron <strong>{importSummary.imported} artículos seleccionados</strong> al catálogo dropshipping.
                </p>
              </div>

              {/* KPI Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className={`p-3 rounded-2xl border text-center min-w-[120px] ${
                  darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Artículos</span>
                  <strong className="text-lg font-mono text-orange-500">{importSummary.imported}</strong>
                </div>

                <div className={`p-3 rounded-2xl border text-center min-w-[120px] ${
                  darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">En Tienda</span>
                  <strong className="text-lg font-mono text-emerald-500">{importSummary.published}</strong>
                </div>

                {importSummary.categories.length > 0 && (
                  <div className={`p-3 rounded-2xl border text-center min-w-[160px] ${
                    darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Categorías Nuevas</span>
                    <strong className="text-xs font-mono text-blue-500 block truncate">
                      {importSummary.categories.join(', ')}
                    </strong>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t flex items-center justify-between shrink-0 ${
          darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="text-xs text-zinc-400">
            {step === 'select_products' && (
              <span>
                {selectedIds.length} productos seleccionados · Margen aplicado: +{defaultMarginPercent}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step !== 'done' && (
              <button
                type="button"
                onClick={step === 'select_products' ? () => setStep('form') : onClose}
                className={`px-4 py-2.5 rounded-xl font-bold transition-colors ${
                  darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
              >
                {step === 'select_products' ? 'Atrás' : 'Cancelar'}
              </button>
            )}

            {step === 'form' && (
              <button
                type="button"
                onClick={handleStartScan}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Escanear y Elegir Productos</span>
              </button>
            )}

            {step === 'select_products' && (
              <button
                type="button"
                disabled={isImporting || selectedIds.length === 0}
                onClick={handleConfirmImport}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 flex items-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                <span>
                  {isImporting ? 'Guardando...' : `Incorporar ${selectedIds.length} Productos al Catálogo`}
                </span>
              </button>
            )}

            {step === 'done' && (
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ver Catálogo Actualizado</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
