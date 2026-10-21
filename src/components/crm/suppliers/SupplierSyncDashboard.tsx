import React, { useState, useMemo } from 'react';
import { useStore } from '../../../context/StoreContext';
import { SupplierProduct, SupplierSource } from '../../../types';
import { SupplierProductCard } from './SupplierProductCard';
import { AddSupplierModal } from './AddSupplierModal';
import { ExtractProductsModal } from './ExtractProductsModal';
import { BulkPricingCalculatorModal } from './BulkPricingCalculatorModal';
import { formatCurrency } from '../../../utils/formatters';
import { CATALOG_CATEGORIES } from '../../../data/products';
import { 
  Globe, 
  DownloadCloud, 
  Calculator, 
  RefreshCw, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Trash2, 
  ExternalLink, 
  ShoppingBag, 
  Layers, 
  SlidersHorizontal,
  Moon,
  Sun,
  LayoutGrid,
  List,
  Store,
  ChevronDown,
  ChevronUp,
  Percent,
  TrendingUp,
  Tag,
  Boxes,
  HelpCircle
} from 'lucide-react';

export const SupplierSyncDashboard: React.FC = () => {
  const {
    supplierSources = [],
    supplierProducts = [],
    addSupplierSource,
    deleteSupplierSource,
    updateSupplierProduct,
    deleteSupplierProduct,
    publishSupplierProductToStore,
    unpublishSupplierProductFromStore,
    batchPublishSupplierProducts,
    batchApplyMarkup,
    batchSyncSupplierProducts,
    extractProductsFromUrl,
    catalogCategories = [],
    setActiveTab,
    companySettings
  } = useStore();

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nuvoh_supplier_darkmode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('nuvoh_supplier_darkmode', String(next));
      return next;
    });
  };

  // Modals state
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isExtractOpen, setIsExtractOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Quick edit modal state
  const [productToEdit, setProductToEdit] = useState<SupplierProduct | null>(null);

  // Syncing state
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');

  // Suppliers accordion state
  const [isSuppliersListExpanded, setIsSuppliersListExpanded] = useState(false);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'cost_changed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'cost_delta' | 'stock'>('newest');

  // Multi-select state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Filtered products calculation
  const filteredProducts = useMemo(() => {
    return supplierProducts.filter((p) => {
      // Search
      const matchesSearch = 
        p.sanitizedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.originalTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.internalSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.originalSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

      // Supplier
      const matchesSupplier = selectedSupplierFilter === 'all' || p.supplierId === selectedSupplierFilter;

      // Status
      let matchesStatus = true;
      if (statusFilter === 'published') matchesStatus = p.status === 'published';
      else if (statusFilter === 'hidden') matchesStatus = p.status === 'draft' || p.status === 'hidden';
      else if (statusFilter === 'cost_changed') matchesStatus = p.hasCostChanged;

      // Category
      const matchesCategory = categoryFilter === 'Todos' || p.category === categoryFilter;

      // Stock
      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.stock > 10;
      else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 10;
      else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      return matchesSearch && matchesSupplier && matchesStatus && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.finalSalePrice - b.finalSalePrice;
      if (sortBy === 'price_desc') return b.finalSalePrice - a.finalSalePrice;
      if (sortBy === 'stock') return b.stock - a.stock;
      if (sortBy === 'cost_delta') return (b.costChangeDelta || 0) - (a.costChangeDelta || 0);
      return b.id.localeCompare(a.id);
    });
  }, [supplierProducts, searchQuery, selectedSupplierFilter, statusFilter, categoryFilter, stockFilter, sortBy]);

  // Overall KPIs
  const totalSuppliersCount = supplierSources.length;
  const totalImportedCount = supplierProducts.length;
  const totalPublishedCount = supplierProducts.filter((p) => p.status === 'published').length;
  const totalCostChangedCount = supplierProducts.filter((p) => p.hasCostChanged).length;
  const totalEstimatedStockValue = supplierProducts.reduce((sum, p) => sum + (p.stock * p.finalSalePrice), 0);

  // Sync all suppliers action
  const handleSyncAllCosts = async () => {
    setIsSyncingAll(true);
    setSyncFeedback('Conectando con servidores proveedores para comprobar costos y stock...');
    try {
      const result = await batchSyncSupplierProducts('all');
      setSyncFeedback(
        `¡Sincronización completada! ${result.updatedCount} artículos analizados. ${
          result.changedCostCount > 0 ? `⚠️ Se detectaron ${result.changedCostCount} variaciones de costo.` : 'Precios mayoristas estables.'
        }`
      );
      setTimeout(() => setSyncFeedback(''), 4500);
    } catch (e) {
      setSyncFeedback('Error al sincronizar con algunos proveedores.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Toggle single item selection
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  // Select all or none
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  // Batch actions on selection
  const handleBatchPublishSelected = async () => {
    await batchPublishSupplierProducts(selectedProductIds);
    setSelectedProductIds([]);
  };

  const handleBatchUnpublishSelected = async () => {
    const toUnpublish = supplierProducts.filter((p) => selectedProductIds.includes(p.id));
    for (const item of toUnpublish) {
      await unpublishSupplierProductFromStore(item);
    }
    setSelectedProductIds([]);
  };

  const handleBatchDeleteSelected = async () => {
    for (const id of selectedProductIds) {
      await deleteSupplierProduct(id);
    }
    setSelectedProductIds([]);
  };

  return (
    <div className={`space-y-6 transition-colors duration-200 ${darkMode ? 'text-zinc-100' : 'text-zinc-900'}`}>
      
      {/* Top Banner & Header */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-xs transition-colors ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-orange-500/15 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded">
                MÓDULO DE IMPORTACIÓN &amp; DROPSHIPPING B2B
              </span>
              <span className={`text-xs font-medium ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {companySettings?.companyName || 'NUVOH'} Multi-Proveedor
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl font-black font-display tracking-tight mt-1 ${
              darkMode ? 'text-white' : 'text-zinc-900'
            }`}>
              Conexión de Webs Proveedoras y Sincronización
            </h1>

            <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Conectá múltiples tiendas de distribuidores mayoristas (WooCommerce, Shopify, Tiendanube), extraé productos individuales o lotes por categoría, saneá títulos y SKUs, calculá precios en $ ARS y publicá al catálogo central en 1 clic.
            </p>
          </div>

          {/* Top Actions & Dark Mode Switch */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dark/Light mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                darkMode 
                  ? 'bg-zinc-800 border-zinc-700 text-yellow-400 hover:bg-zinc-700' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
              title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>

            {/* Sync now button */}
            <button
              onClick={handleSyncAllCosts}
              disabled={isSyncingAll}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                darkMode 
                  ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200' 
                  : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800'
              } disabled:opacity-50`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Costos Web'}</span>
            </button>

            {/* Bulk calculator trigger */}
            <button
              type="button"
              onClick={() => setIsCalculatorOpen(true)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                darkMode 
                  ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-orange-400' 
                  : 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-700'
              }`}
              title="Calculadora de Ganancia Total Masiva con aumentos en % y $ ARS"
            >
              <Calculator className="w-3.5 h-3.5 text-orange-600" />
              <span>Ganancia Total Masiva</span>
            </button>

            {/* Extract scraper button */}
            <button
              onClick={() => setIsExtractOpen(true)}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 active:scale-98"
              title="Extraer producto mediante link directo de la web con cálculo de ganancia"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Extraer por Link de Producto</span>
            </button>

            {/* Connect new supplier */}
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                darkMode 
                  ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200' 
                  : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-orange-500" />
              <span>Conectar Web Nueva</span>
            </button>
          </div>
        </div>

        {/* Sync feedback notification */}
        {syncFeedback && (
          <div className="mt-4 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-500 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Top KPI Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Webs Conectadas</span>
              <Globe className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-black font-mono text-orange-500">
              {totalSuppliersCount}
            </div>
            <span className="text-[10px] text-zinc-400">
              WooCommerce, Shopify, Tiendanube
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Artículos Dropshipping</span>
              <Boxes className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
              {totalImportedCount}
            </div>
            <span className="text-[10px] text-zinc-400">
              Extraídos y catalogados
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Publicados en Tienda</span>
              <Store className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-500">
              {totalPublishedCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Activos para clientes mayoristas
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
              <span className="font-bold uppercase tracking-wider text-[10px]">Variaciones de Costo</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black font-mono text-amber-500">
              {totalCostChangedCount}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">
              {totalCostChangedCount > 0 ? 'Requieren recalcular PVP' : 'Costos al día'}
            </span>
          </div>
        </div>

        {/* Connected Supplier Sources Drawer Strip */}
        <div className="mt-6 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSuppliersListExpanded(!isSuppliersListExpanded)}
              className="flex items-center gap-2 text-xs font-bold text-orange-500 hover:text-orange-600"
            >
              <span>Fuentes Web Conectadas ({supplierSources.length})</span>
              {isSuppliersListExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:text-orange-500 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 text-orange-500" />
              <span>Conectar Otra Web</span>
            </button>
          </div>

          {/* Expandable supplier cards */}
          {isSuppliersListExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3 animate-in fade-in duration-150">
              {supplierSources.map((source) => (
                <div
                  key={source.id}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between ${
                    darkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-500">
                        {source.platform}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        SKU: {source.skuPrefix}-*
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs truncate text-zinc-900 dark:text-white mt-1">
                      {source.name}
                    </h4>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-orange-500 hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{source.url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>

                    <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-zinc-200/40 dark:border-zinc-800">
                      <span className="text-zinc-400">Margen base:</span>
                      <strong className="font-mono text-orange-500">+{source.defaultMarginPercent}%</strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-0.5">
                      <span className="text-zinc-400">Productos:</span>
                      <strong className="font-mono">{source.productsCount || 0} ítems</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSupplierFilter(source.id);
                      setIsExtractOpen(true);
                    }}
                    className="w-full mt-2.5 py-1.5 px-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    title="Extraer productos mediante link de esta web"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Extraer de esta Web</span>
                  </button>

                  <div className="mt-2.5 pt-2 border-t border-zinc-200/40 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Sync: {source.lastSyncAt}</span>
                    <button
                      onClick={() => deleteSupplierSource(source.id)}
                      className="text-zinc-400 hover:text-red-500"
                      title="Desconectar web proveedora"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className={`rounded-3xl p-4 sm:p-5 border shadow-2xs space-y-3 ${
        darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Live Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, SKU interno NVH, proveedor o código original..."
              className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border font-medium outline-hidden transition-all ${
                darkMode 
                  ? 'bg-zinc-950 border-zinc-800 focus:border-orange-500 text-white' 
                  : 'bg-zinc-50 border-zinc-200 focus:border-orange-500 text-zinc-900'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters strip */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Supplier */}
            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className={`text-xs py-2 px-3 rounded-xl border font-bold outline-hidden ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              <option value="all">Todos los Proveedores</option>
              {supplierSources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`text-xs py-2 px-3 rounded-xl border font-bold outline-hidden ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              <option value="all">Todos los Estados</option>
              <option value="published">🟢 Publicados en Tienda ({supplierProducts.filter((p) => p.status === 'published').length})</option>
              <option value="hidden">⚪ Ocultos / Borradores ({supplierProducts.filter((p) => p.status !== 'published').length})</option>
              <option value="cost_changed">⚠️ Con Cambios de Costo ({supplierProducts.filter((p) => p.hasCostChanged).length})</option>
            </select>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`text-xs py-2 px-3 rounded-xl border font-bold outline-hidden ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              <option value="Todos">Todas las Categorías</option>
              {catalogCategories.filter((c) => c !== 'Todos').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`text-xs py-2 px-3 rounded-xl border font-bold outline-hidden ${
                darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-800'
              }`}
            >
              <option value="newest">Más Recientes Primero</option>
              <option value="cost_delta">Mayor Suba de Costo %</option>
              <option value="price_asc">Precio PVP: Menor a Mayor</option>
              <option value="price_desc">Precio PVP: Mayor a Menor</option>
              <option value="stock">Mayor Stock Disponible</option>
            </select>

            {/* View Switch */}
            <div className={`flex items-center p-1 rounded-xl border ${
              darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Vista Cuadrícula de Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-orange-600 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Vista Tabla Comparativa"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Multi-Select Action Bar (Shows when 1 or more items are selected) */}
        {selectedProductIds.length > 0 && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-orange-500">
                {selectedProductIds.length} artículos seleccionados
              </span>
              <button
                onClick={() => setSelectedProductIds([])}
                className="text-xs text-zinc-400 hover:underline"
              >
                (Deseleccionar)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBatchPublishSelected}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Publicar en Tienda Mayorista</span>
              </button>

              <button
                onClick={handleBatchUnpublishSelected}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                  darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Ocultar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                  darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-orange-400' : 'border-orange-200 bg-white hover:bg-orange-50 text-orange-600'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calcular Margen Masivo</span>
              </button>

              <button
                onClick={handleBatchDeleteSelected}
                className="p-1.5 rounded-xl text-red-500 hover:bg-red-500/10"
                title="Eliminar seleccionados"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Results Counter & Fast select all */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
          <div className="flex items-center gap-3">
            <span>
              Mostrando <strong>{filteredProducts.length}</strong> de {supplierProducts.length} artículos dropshipping
            </span>
            <button
              onClick={handleToggleSelectAll}
              className="text-orange-500 font-bold hover:underline"
            >
              {selectedProductIds.length === filteredProducts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </button>
          </div>

          {(searchQuery || selectedSupplierFilter !== 'all' || statusFilter !== 'all' || categoryFilter !== 'Todos') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSupplierFilter('all');
                setStatusFilter('all');
                setCategoryFilter('Todos');
              }}
              className="text-orange-500 hover:underline font-bold"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Catalog View */}
      {filteredProducts.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border shadow-xs ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <Globe className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            No se encontraron artículos con los filtros aplicados
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            Probá ajustando la búsqueda o utilizá el botón "Extraer Productos" para importar desde un nuevo catálogo.
          </p>
          <button
            onClick={() => setIsExtractOpen(true)}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Extraer Productos con URL</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <SupplierProductCard
              key={product.id}
              product={product}
              darkMode={darkMode}
              isSelected={selectedProductIds.includes(product.id)}
              onToggleSelect={() => handleToggleSelectProduct(product.id)}
              onPublish={publishSupplierProductToStore}
              onUnpublish={unpublishSupplierProductFromStore}
              onDelete={deleteSupplierProduct}
              onOpenQuickEdit={(prod) => setProductToEdit(prod)}
            />
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className={`rounded-3xl border overflow-hidden shadow-xs ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`font-mono text-[11px] uppercase ${
                darkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-900 text-white'
              }`}>
                <tr>
                  <th className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Artículo / Título Saneado</th>
                  <th className="py-3 px-3">Proveedor / SKU</th>
                  <th className="py-3 px-3">Costo Mayorista</th>
                  <th className="py-3 px-3">Margen %</th>
                  <th className="py-3 px-3 font-bold text-emerald-500">PVP Venta</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-zinc-500/5 transition-colors ${
                      selectedProductIds.includes(product.id) ? 'bg-orange-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id)}
                        onChange={() => handleToggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                    </td>

                    {/* Title & Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.sanitizedTitle}
                          className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-zinc-200 shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs block truncate max-w-xs text-zinc-900 dark:text-white">
                            {product.sanitizedTitle}
                          </span>
                          <span className="text-[10px] text-zinc-400 block truncate">
                            Orig: {product.originalTitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Supplier & SKU */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-mono text-[10px] font-bold text-orange-500 block">
                          {product.internalSku}
                        </span>
                        <a
                          href={product.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-500 hover:text-orange-500 flex items-center gap-1"
                        >
                          <span className="truncate max-w-[120px]">{product.supplierName}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </td>

                    {/* Cost ARS */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-0.5 font-mono">
                        <span className="font-bold text-xs block">
                          {formatCurrency(product.costArs, false)}
                        </span>
                        {product.hasCostChanged && (
                          <span className="inline-block text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
                            +{product.costChangeDelta}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Margin */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-orange-500">
                      +{product.marginPercent}%
                      {product.fixedMarkupArs > 0 && <span className="text-[10px] block text-zinc-400">+${product.fixedMarkupArs}</span>}
                    </td>

                    {/* Final Sale Price */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-black text-sm text-emerald-500">
                      {formatCurrency(product.finalSalePrice, false)}
                      <span className="text-[9px] block text-zinc-400 font-normal">
                        Ganancia: +{formatCurrency(product.finalSalePrice - product.costArs, false)}
                      </span>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                        product.stock === 0 
                          ? 'bg-red-500/15 text-red-500' 
                          : product.stock <= 10 
                            ? 'bg-amber-500/15 text-amber-500' 
                            : 'bg-emerald-500/15 text-emerald-500'
                      }`}>
                        {product.stock} u.
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {product.status === 'published' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          En Tienda
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400">
                          Borrador
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={product.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                          title="Reponer stock en la web del proveedor"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        {product.status === 'published' ? (
                          <button
                            onClick={() => unpublishSupplierProductFromStore(product)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                            title="Ocultar de la tienda"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => publishSupplierProductToStore(product)}
                            className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition-colors"
                            title="Publicar en la tienda online"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setProductToEdit(product)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 transition-colors"
                          title="Editar detalles"
                        >
                          <Tag className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteSupplierProduct(product.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Eliminar de dropshipping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK PRODUCT EDIT MODAL */}
      {productToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200/40 dark:border-zinc-800">
              <h3 className="text-base font-black font-display">
                Editar Datos de Dropshipping
              </h3>
              <button
                onClick={() => setProductToEdit(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 opacity-80">Título Saneado</label>
                <input
                  type="text"
                  value={productToEdit.sanitizedTitle}
                  onChange={(e) => setProductToEdit({ ...productToEdit, sanitizedTitle: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border font-bold ${
                    darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 opacity-80">Costo Mayorista ($ ARS)</label>
                  <input
                    type="number"
                    value={productToEdit.costArs}
                    onChange={(e) => {
                      const cost = Number(e.target.value);
                      const finalSalePrice = Math.round(cost * (1 + productToEdit.marginPercent / 100));
                      setProductToEdit({ ...productToEdit, costArs: cost, finalSalePrice });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 opacity-80">Stock Depósito</label>
                  <input
                    type="number"
                    value={productToEdit.stock}
                    onChange={(e) => setProductToEdit({ ...productToEdit, stock: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 opacity-80">Margen Ganancia (%)</label>
                  <input
                    type="number"
                    value={productToEdit.marginPercent}
                    onChange={(e) => {
                      const margin = Number(e.target.value);
                      const finalSalePrice = Math.round(productToEdit.costArs * (1 + margin / 100));
                      setProductToEdit({ ...productToEdit, marginPercent: margin, finalSalePrice });
                    }}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 opacity-80 text-emerald-500">Precio Venta PVP ($ ARS)</label>
                  <input
                    type="number"
                    value={productToEdit.finalSalePrice}
                    onChange={(e) => setProductToEdit({ ...productToEdit, finalSalePrice: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-black text-emerald-500 ${
                      darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  />
                </div>
              </div>

              {/* Direct restock link */}
              <div className="pt-2">
                <a
                  href={productToEdit.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Web del Proveedor para Reponer Stock</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200/40 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setProductToEdit(null)}
                className="px-4 py-2 rounded-xl font-bold text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await updateSupplierProduct(productToEdit);
                  setProductToEdit(null);
                }}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <AddSupplierModal
        isOpen={isAddSupplierOpen}
        onClose={() => setIsAddSupplierOpen(false)}
        onAddSupplier={addSupplierSource}
        darkMode={darkMode}
      />

      <ExtractProductsModal
        isOpen={isExtractOpen}
        onClose={() => setIsExtractOpen(false)}
        suppliers={supplierSources}
        onExtractFromUrl={extractProductsFromUrl}
        darkMode={darkMode}
      />

      <BulkPricingCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        products={supplierProducts}
        suppliers={supplierSources}
        onApplyMarkup={batchApplyMarkup}
        darkMode={darkMode}
        preselectedProductIds={selectedProductIds}
      />

    </div>
  );
};
