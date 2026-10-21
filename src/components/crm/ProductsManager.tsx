import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { CATALOG_CATEGORIES } from '../../data/products';
import { formatCurrency } from '../../utils/formatters';
import { resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { BulkPricingCalculatorModal } from './suppliers/BulkPricingCalculatorModal';
import { 
  Package, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Edit3, 
  Copy, 
  Trash2, 
  Eye, 
  Percent, 
  AlertTriangle, 
  CheckCircle2, 
  Boxes, 
  ArrowUpDown, 
  RefreshCw, 
  Layers, 
  Tag, 
  TrendingUp, 
  DollarSign,
  LayoutGrid,
  List,
  Sparkles,
  Calculator
} from 'lucide-react';

export const ProductsManager: React.FC = () => {
  const { 
    products, 
    openCreateProductModal, 
    openEditProductModal, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    setSelectedProductForModal,
    batchUpdatePrices,
    resetCatalogToDefault,
    catalogCategories = [],
    supplierProducts = [],
    supplierSources = [],
    batchApplyMarkup,
    companySettings
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Delete confirmation state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Batch price modal state
  const [isBatchPriceModalOpen, setIsBatchPriceModalOpen] = useState(false);
  const [isBulkProfitModalOpen, setIsBulkProfitModalOpen] = useState(false);
  const [batchPercentage, setBatchPercentage] = useState<number>(10);
  const [batchCategory, setBatchCategory] = useState<string>('Todos');
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');

  // Live filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;

      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.stock > 10;
      else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 10;
      else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      return matchesSearch && matchesCategory && matchesStock;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceUnit - b.priceUnit;
      if (sortBy === 'price_desc') return b.priceUnit - a.priceUnit;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy]);

  // Inventory KPIs
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalStockValuation = products.reduce((sum, p) => sum + (p.stock || 0) * p.priceUnit, 0);
  const lowStockCount = products.filter((p) => p.stock <= 10).length;

  // Inline stock updater
  const handleQuickStockChange = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    await updateProduct({ ...product, stock: newStock });
  };

  // Duplicate product
  const handleDuplicateProduct = async (product: Product) => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const duplicated: Omit<Product, 'id'> = {
      ...product,
      name: `${product.name} (COPIA)`,
      sku: `${product.sku}-CP${randomSuffix}`,
      stock: 10,
      featured: false,
      isNew: true
    };
    await addProduct(duplicated);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await deleteProduct(productToDelete.id);
    setProductToDelete(null);
  };

  // Apply batch price update
  const handleApplyBatchPrices = async () => {
    if (batchPercentage === 0) return;
    await batchUpdatePrices(batchPercentage, batchCategory);
    setBatchSuccessMsg(`¡Precios actualizados exitosamente (${batchPercentage > 0 ? '+' : ''}${batchPercentage}%)!`);
    setTimeout(() => {
      setBatchSuccessMsg('');
      setIsBatchPriceModalOpen(false);
    }, 1800);
  };

  return (
    <div className="space-y-6">

      {/* Top Header & Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-orange-100 text-orange-800 px-2 py-0.5 rounded border border-orange-200">
                GESTIÓN DE INVENTARIO &amp; CATÁLOGO
              </span>
              <span className="text-xs text-zinc-500 font-medium">
                Módulo Oficial {companySettings?.companyName || 'NUVOH'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 font-display tracking-tight mt-1">
              Catálogo de Productos &amp; Listas de Precios
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Agregá nuevos artículos, modificá precios por cantidad, administrá el stock en depósito y actualizá fichas técnicas en tiempo real.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsBulkProfitModalOpen(true)}
              className="px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-orange-200"
              title="Calculadora de Ganancia Total Masiva con aumentos en % y $ ARS"
            >
              <Calculator className="w-3.5 h-3.5 text-orange-600" />
              <span>Ganancia Total Masiva</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBatchPriceModalOpen(true)}
              className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-zinc-300"
            >
              <Percent className="w-3.5 h-3.5 text-orange-600" />
              <span>Ajuste Rápido de Precios</span>
            </button>

            <button
              type="button"
              onClick={openCreateProductModal}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Inventory Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Total Artículos
            </span>
            <div className="text-2xl font-black font-mono text-zinc-900 mt-1">
              {products.length}
            </div>
            <span className="text-[10px] text-zinc-500">
              En catálogo mayorista
            </span>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Unidades en Depósito
            </span>
            <div className="text-2xl font-black font-mono text-zinc-900 mt-1">
              {totalStockUnits.toLocaleString('es-AR')}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Disponibilidad inmediata
            </span>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Valorización Stock (Base)
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-orange-600 mt-1">
              {formatCurrency(totalStockValuation, false)}
            </div>
            <span className="text-[10px] text-zinc-500">
              Valor de mercadería en lista
            </span>
          </div>

          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
              Stock Crítico (≤ 10 u.)
            </span>
            <div className="text-2xl font-black font-mono text-amber-600 mt-1">
              {lowStockCount}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">
              Requerir reposición importador
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Live Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca o hook (ej. horno, EH-COC, pioneer)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 bg-zinc-50 font-medium focus:border-orange-500 focus:bg-white outline-hidden"
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

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-zinc-800 outline-hidden"
            >
              <option value="Todos">Todas las Categorías</option>
              {catalogCategories.filter((c) => c !== 'Todos').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Stock status filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="text-xs py-2 px-3 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-zinc-800 outline-hidden"
            >
              <option value="all">Todo el Stock</option>
              <option value="in_stock">Con Buen Stock (&gt; 10 u.)</option>
              <option value="low_stock">Stock Bajo (≤ 10 u.)</option>
              <option value="out_of_stock">Sin Stock (0 u.)</option>
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs py-2 px-3 rounded-xl border border-zinc-200 bg-zinc-50 font-semibold text-zinc-800 outline-hidden"
            >
              <option value="name">Alfabético A-Z</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="stock_desc">Mayor Stock Primero</option>
              <option value="stock_asc">Menor Stock Primero</option>
            </select>

            {/* View Switch */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-orange-600' : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Vista Tabla Detallada"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-orange-600' : 'text-zinc-500 hover:text-zinc-900'
                }`}
                title="Vista Cuadrícula de Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>

        {/* Filter chips status */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
          <span>Mostrando <strong>{filteredProducts.length}</strong> de {products.length} productos</span>
          {(searchQuery || selectedCategory !== 'Todos' || stockFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Todos');
                setStockFilter('all');
              }}
              className="text-orange-600 hover:underline font-bold text-xs"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Products Display */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-2xs">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900">
            No se encontraron productos coincidentes
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Probá ajustando los términos de búsqueda o los filtros de categoría y stock.
          </p>
          <button
            onClick={openCreateProductModal}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Nuevo Producto</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900 text-white font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Producto / Modelo</th>
                  <th className="py-3.5 px-3">Categoría</th>
                  <th className="py-3.5 px-3">Precio Base (1u)</th>
                  <th className="py-3.5 px-3">Escalas Mayoristas</th>
                  <th className="py-3.5 px-3 text-center">Stock</th>
                  <th className="py-3.5 px-3 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-sans">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50/80 transition-colors">
                    
                    {/* Product Name, Image, SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(product.image, product.category)}
                          alt={product.name}
                          onError={(e) => handleImageError(e, product.category)}
                          className="w-12 h-12 object-contain rounded-xl bg-zinc-50 p-1 border border-zinc-200 shrink-0"
                          loading="lazy"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-orange-600 block truncate">
                            {product.hook}
                          </span>
                          <span className="font-extrabold text-zinc-900 text-xs block truncate max-w-xs">
                            {product.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-zinc-500 font-bold">
                              SKU: {product.sku}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-[10px] text-zinc-600">
                              {product.brand}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[11px] font-semibold">
                        {product.category}
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="font-mono font-black text-sm text-zinc-900 block">
                        {formatCurrency(product.priceUnit, false)}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase">
                        Unitario
                      </span>
                    </td>

                    {/* Wholesale Tiers */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-zinc-700">
                          <span className="text-[9px] uppercase font-bold text-zinc-400">5u:</span>
                          <span>{product.priceTiers?.tier5 ? formatCurrency(product.priceTiers.tier5, false) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-700">
                          <span className="text-[9px] uppercase font-bold text-zinc-400">10u:</span>
                          <span>{product.priceTiers?.tier10 ? formatCurrency(product.priceTiers.tier10, false) : '-'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <span className="text-[9px] uppercase font-bold text-emerald-500">100u:</span>
                          <span>{product.priceTiers?.tier100 ? formatCurrency(product.priceTiers.tier100, false) : '-'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Stock & Quick Stepper */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center border border-zinc-200 rounded-xl bg-zinc-50 p-0.5 shadow-2xs">
                        <button
                          onClick={() => handleQuickStockChange(product, -1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg text-xs"
                          title="Restar 1 unidad"
                        >
                          -
                        </button>
                        <span className={`w-10 text-center font-mono font-bold text-xs ${
                          product.stock === 0 ? 'text-red-600' : product.stock <= 10 ? 'text-amber-600' : 'text-zinc-900'
                        }`}>
                          {product.stock}
                        </span>
                        <button
                          onClick={() => handleQuickStockChange(product, 1)}
                          className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg text-xs"
                          title="Sumar 1 unidad"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Status Badges */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        {product.featured && (
                          <span className="text-[9px] font-bold uppercase bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                            Destacado
                          </span>
                        )}
                        {product.isNew && (
                          <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                            Lanzamiento
                          </span>
                        )}
                        {!product.featured && !product.isNew && (
                          <span className="text-[9px] text-zinc-400">
                            Estándar
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProductForModal(product)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                          title="Ver ficha técnica en Tienda"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicateProduct(product)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="Duplicar producto (cargar variante)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditProductModal(product)}
                          className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-colors"
                          title="Editar producto"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar producto"
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
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header ribbon */}
                <div className="p-3 border-b border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-semibold text-zinc-700">{product.category}</span>
                  <span className="font-mono text-zinc-400 text-[10px]">SKU: {product.sku}</span>
                </div>

                {/* Catchy Hook & Name */}
                <div className="p-4 pb-2">
                  <span className="text-[11px] font-black uppercase text-orange-600 block line-clamp-1">
                    {product.hook}
                  </span>
                  <h3 className="text-sm font-black text-zinc-900 mt-0.5 line-clamp-1">
                    {product.name}
                  </h3>
                </div>

                {/* Image showcase */}
                <div className="p-4 pt-1 flex items-center justify-center h-44 bg-zinc-50/50">
                  <img
                    src={resolveProductImage(product.image, product.category)}
                    alt={product.name}
                    onError={(e) => handleImageError(e, product.category)}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Pricing & Management Controls */}
              <div className="p-4 pt-2 border-t border-zinc-100 bg-white">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-xl font-black font-display text-orange-600 tabular-nums">
                      {formatCurrency(product.priceUnit, false)}
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">1 UNIDAD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-zinc-900">
                      Stock: {product.stock} u.
                    </span>
                  </div>
                </div>

                {/* Wholesale Escalas Pills */}
                <div className="grid grid-cols-3 gap-1 text-center bg-zinc-50 p-1.5 rounded-xl border border-zinc-200/80 mb-3 text-[10px] font-mono">
                  <div>
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">5+ U</span>
                    <span>{product.priceTiers?.tier5 ? formatCurrency(product.priceTiers.tier5, false) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">10+ U</span>
                    <span>{product.priceTiers?.tier10 ? formatCurrency(product.priceTiers.tier10, false) : '-'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-emerald-600 block uppercase font-bold">100+ U</span>
                    <span className="text-emerald-600 font-bold">{product.priceTiers?.tier100 ? formatCurrency(product.priceTiers.tier100, false) : '-'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditProductModal(product)}
                    className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Modificar</span>
                  </button>

                  <button
                    onClick={() => handleDuplicateProduct(product)}
                    className="p-2 border border-zinc-300 rounded-xl text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="Duplicar producto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setProductToDelete(product)}
                    className="p-2 border border-zinc-300 rounded-xl text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL: AJUSTE MASIVO DE PRECIOS */}
      {isBatchPriceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                  <Percent className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-zinc-900 font-display">
                  Ajuste Masivo de Precios
                </h3>
              </div>
              <button
                onClick={() => setIsBatchPriceModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 mt-3 leading-relaxed">
              Actualizá automáticamente los precios de lista y escalas mayoristas por porcentaje (ideal para ajustes de inflación o listas de importación).
            </p>

            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                  Categoría a Aplicar
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-zinc-300 text-xs font-semibold bg-white outline-hidden"
                >
                  <option value="Todos">Todo el Catálogo Completo ({products.length} productos)</option>
                  {catalogCategories.filter((c) => c !== 'Todos').map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                  Porcentaje de Ajuste (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={batchPercentage}
                    onChange={(e) => setBatchPercentage(parseFloat(e.target.value) || 0)}
                    className="flex-1 p-2.5 rounded-xl border border-zinc-300 font-mono text-sm font-bold outline-hidden"
                    placeholder="Ej. 10 para aumentar 10%, -5 para bajar 5%"
                  />
                  <span className="text-sm font-black text-zinc-700 font-mono">%</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBatchPercentage(pct)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        batchPercentage === pct ? 'bg-orange-600 text-white border-orange-600' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                      }`}
                    >
                      +{pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Sample simulation */}
              <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 text-xs">
                <span className="font-bold text-zinc-700 block mb-1">Ejemplo de simulación:</span>
                <div className="flex justify-between text-zinc-500 font-mono text-[11px]">
                  <span>Precio actual: $100.000</span>
                  <span className="text-orange-600 font-bold">
                    Nuevo precio: ${Math.round(100000 * (1 + batchPercentage / 100)).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {batchSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsBatchPriceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBatchPrices}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
              >
                Aplicar Ajuste a la Base de Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DE ELIMINACIÓN */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-center text-zinc-900 font-display">
              ¿Eliminar producto del catálogo?
            </h3>
            <p className="text-xs text-center text-zinc-600 mt-2">
              Estás por eliminar <strong>{productToDelete.name}</strong> (SKU: {productToDelete.sku}). Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CALCULADORA DE GANANCIA TOTAL MASIVA */}
      <BulkPricingCalculatorModal
        isOpen={isBulkProfitModalOpen}
        onClose={() => setIsBulkProfitModalOpen(false)}
        products={supplierProducts}
        suppliers={supplierSources}
        onApplyMarkup={batchApplyMarkup}
      />

    </div>
  );
};
