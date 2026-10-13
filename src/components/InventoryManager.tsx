import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { db } from '../firebase';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  Layers, Plus, Edit2, Trash2, Search, Calculator, CheckCircle, 
  Package, DollarSign, Image as ImageIcon, ArrowUpRight, TrendingUp, 
  Building2, ShieldCheck, AlertTriangle, Sparkles, Filter, Store,
  Zap, CheckSquare, Square, Sliders, SlidersHorizontal, Check, RefreshCw,
  Globe, ExternalLink
} from 'lucide-react';
import { 
  cleanProductTitle, cleanProductSku, cleanSupplierName, 
  BulkProfitConfig, calculatePriceWithProfit, getProductSourceWeb 
} from '../utils/productUtils';

interface InventoryManagerProps {
  products: Product[];
  onRefresh: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ products: initialProducts, onRefresh }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [stockFilter, setStockFilter] = useState<'all' | 'active' | 'lowStock'>('active');

  // Multi-selection states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBulkProfitModal, setShowBulkProfitModal] = useState(false);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);

  // Bulk Profit Configuration State
  const [bulkConfig, setBulkConfig] = useState<BulkProfitConfig>({
    type: 'percent',
    percentValue: 50,
    fixedValueARS: 5000,
    rounding: '100',
    targetScope: 'all',
  });

  // Individual Form states - 100% in Argentine Pesos (ARS)
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('General');
  
  // Cost & Price in ARS
  const [costARS, setCostARS] = useState<number>(10000);
  const [profitCalculationType, setProfitCalculationType] = useState<'percent' | 'fixed'>('percent');
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(45);
  const [profitFixedAmountARS, setProfitFixedAmountARS] = useState<number>(4500);
  const [taxIVA, setTaxIVA] = useState<number>(0);
  const [finalPriceARS, setFinalPriceARS] = useState<number>(14500);
  
  // Optional import calculation toggle
  const [showImportCalculator, setShowImportCalculator] = useState(false);
  const [costUSD, setCostUSD] = useState<number>(10);
  const [freightUSD, setFreightUSD] = useState<number>(0);
  const [dutiesUSD, setDutiesUSD] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(1200);

  const [stock, setStock] = useState<number>(20);
  const [minStock, setMinStock] = useState<number>(5);
  const [supplier, setSupplier] = useState('Mayorista Central');
  const [sourceWebUrl, setSourceWebUrl] = useState('');
  const [sourceWebName, setSourceWebName] = useState('');
  const [containerBatch, setContainerBatch] = useState('LOTE-LOCAL');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Automatic calculation of final price in ARS for individual product modal
  useEffect(() => {
    let baseCost = Number(costARS) || 0;

    if (showImportCalculator) {
      const rate = Number(exchangeRate) || 1200;
      const totalUSD = (Number(costUSD) || 0) + (Number(freightUSD) || 0) + (Number(dutiesUSD) || 0);
      baseCost = Math.round(totalUSD * rate);
      setCostARS(baseCost);
    }

    let calculatedProfit = 0;
    if (profitCalculationType === 'percent') {
      calculatedProfit = baseCost * ((Number(profitMarginPercent) || 0) / 100);
    } else {
      calculatedProfit = Math.max(0, Number(profitFixedAmountARS) || 0);
    }

    const priceBeforeIVA = baseCost + calculatedProfit;
    const withIVA = priceBeforeIVA * (1 + (Number(taxIVA) || 0) / 100);
    setFinalPriceARS(Math.round(withIVA));
  }, [costARS, profitMarginPercent, profitFixedAmountARS, profitCalculationType, taxIVA, showImportCalculator, costUSD, freightUSD, dutiesUSD, exchangeRate]);

  // Bulk Selection Helpers
  const handleToggleSelectAll = () => {
    const activeCurrentIds = filtered.map(p => p.id);
    const allSelected = activeCurrentIds.length > 0 && activeCurrentIds.every(id => selectedProductIds.includes(id));
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !activeCurrentIds.includes(id)));
    } else {
      setSelectedProductIds(prev => Array.from(new Set([...prev, ...activeCurrentIds])));
    }
  };

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // CLEAN INOVA BRANDING FROM ALL PRODUCTS
  const handleCleanInovaFromProducts = async () => {
    if (!confirm('¿Deseas quitar el nombre "Inova" y prefijos de mayorista de todos los títulos, SKUs y etiquetas de productos en tu inventario y base de datos?')) return;
    
    setIsApplyingBulk(true);
    try {
      let cleanedCount = 0;
      const updatedProducts = [...products];

      for (let i = 0; i < updatedProducts.length; i++) {
        const p = updatedProducts[i];
        const newTitle = cleanProductTitle(p.title);
        const newSku = cleanProductSku(p.sku);
        const newSupplier = cleanSupplierName(p.supplier);

        const hasChanged = newTitle !== p.title || newSku !== p.sku || newSupplier !== p.supplier;
        if (hasChanged) {
          const sanitizedDoc: Product = {
            ...p,
            title: newTitle,
            sku: newSku,
            supplier: newSupplier,
          };
          updatedProducts[i] = sanitizedDoc;
          await setDoc(doc(db, 'products', sanitizedDoc.id), sanitizedDoc);
          cleanedCount++;
        }
      }

      setProducts(updatedProducts);
      setSuccess(`¡Marca "Inova" removida de ${cleanedCount} artículos en la base de datos!`);
      setTimeout(() => setSuccess(''), 4500);
      onRefresh();
    } catch (e) {
      alert('Error al sanitizar los nombres de los productos.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // APPLY TOTAL BULK PROFIT TO ARTICLES
  const handleApplyBulkProfit = async () => {
    setIsApplyingBulk(true);
    try {
      // Determine scope
      let targets: Product[] = [];
      if (bulkConfig.targetScope === 'selected' && selectedProductIds.length > 0) {
        targets = products.filter(p => selectedProductIds.includes(p.id));
      } else if (bulkConfig.targetScope === 'category' && bulkConfig.targetCategory && bulkConfig.targetCategory !== 'todos') {
        targets = products.filter(p => p.category === bulkConfig.targetCategory);
      } else {
        targets = products;
      }

      if (targets.length === 0) {
        alert('No se encontraron artículos dentro del alcance seleccionado.');
        setIsApplyingBulk(false);
        return;
      }

      let updatedCount = 0;
      const updatedProductsMap = new Map(products.map(p => [p.id, { ...p }]));

      for (const p of targets) {
        const itemCostARS = p.costARS !== undefined 
          ? p.costARS 
          : Math.round(((p.costPriceUSD || 0) + (p.freightCostUSD || 0) + (p.importDutiesUSD || 0)) * (p.exchangeRate || 1200));

        const calculation = calculatePriceWithProfit(itemCostARS, {
          type: bulkConfig.type,
          percentValue: bulkConfig.percentValue,
          fixedValueARS: bulkConfig.fixedValueARS,
          rounding: bulkConfig.rounding,
        });

        const sanitizedTitle = cleanProductTitle(p.title);
        const sanitizedSku = cleanProductSku(p.sku);
        const sanitizedSupplier = cleanSupplierName(p.supplier);

        const updatedDoc: Product = {
          ...p,
          title: sanitizedTitle,
          sku: sanitizedSku,
          supplier: sanitizedSupplier,
          costARS: itemCostARS,
          finalPriceARS: calculation.finalPriceARS,
          markupPercent: calculation.effectiveMarginPercent,
        };

        updatedProductsMap.set(p.id, updatedDoc);
        await setDoc(doc(db, 'products', updatedDoc.id), updatedDoc);
        updatedCount++;
      }

      setProducts(Array.from(updatedProductsMap.values()));
      setShowBulkProfitModal(false);
      setSuccess(`¡Ganancia total masiva aplicada a ${updatedCount} artículos con éxito!`);
      setTimeout(() => setSuccess(''), 4500);
      onRefresh();
    } catch (e) {
      alert('Error al aplicar la ganancia masiva en la base de datos.');
    } finally {
      setIsApplyingBulk(false);
    }
  };

  // Mass delete selected products
  const handleDeleteSelected = async () => {
    if (selectedProductIds.length === 0) return;

    try {
      const idsToDelete = [...selectedProductIds];
      const itemsToDelete = products.filter(p => idsToDelete.includes(p.id));

      setProducts(prev => prev.filter(p => !idsToDelete.includes(p.id)));
      setSelectedProductIds([]);

      for (const p of itemsToDelete) {
        try {
          await deleteDoc(doc(db, 'products', p.id));
        } catch {}
        if (p.sku) {
          const cleanSku = cleanProductSku(p.sku);
          const altId1 = `prod-inova-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const altId2 = `prod-source-inova-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          try { await deleteDoc(doc(db, 'products', altId1)); } catch {}
          try { await deleteDoc(doc(db, 'products', altId2)); } catch {}
        }
      }

      setSuccess(`Se borraron ${itemsToDelete.length} artículos con éxito.`);
      setTimeout(() => setSuccess(''), 4000);
      onRefresh();
    } catch (e) {
      console.error("Delete selected error:", e);
      alert(`Error al borrar los artículos seleccionados: ${e instanceof Error ? e.message : String(e)}`);
      onRefresh();
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setTitle('');
    setSku(`ART-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('General');
    setCostARS(10000);
    setProfitCalculationType('percent');
    setProfitMarginPercent(45);
    setProfitFixedAmountARS(4500);
    setTaxIVA(0);
    setStock(25);
    setMinStock(5);
    setSupplier('Mayorista Central');
    setSourceWebUrl('');
    setSourceWebName('Mayorista Central');
    setContainerBatch('LOTE-2026');
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800');
    setDescription('');
    setShowImportCalculator(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setTitle(cleanProductTitle(p.title));
    setSku(cleanProductSku(p.sku));
    setCategory(p.category);
    
    // Compute or read direct cost in ARS
    const itemCostARS = p.costARS !== undefined 
      ? p.costARS 
      : Math.round(((p.costPriceUSD || 0) + (p.freightCostUSD || 0) + (p.importDutiesUSD || 0)) * (p.exchangeRate || 1200));
    
    setCostARS(itemCostARS);
    
    const margin = itemCostARS > 0 ? Math.round(((p.finalPriceARS - itemCostARS) / itemCostARS) * 100) : (p.markupPercent || 45);
    const fixedProfit = Math.max(0, p.finalPriceARS - itemCostARS);
    
    setProfitCalculationType('percent');
    setProfitMarginPercent(margin);
    setProfitFixedAmountARS(fixedProfit);
    setTaxIVA(0);
    setFinalPriceARS(p.finalPriceARS);
    setStock(p.stock);
    setMinStock(p.minStock);
    setSupplier(cleanSupplierName(p.supplier));
    
    const sourceWebInfo = getProductSourceWeb(p);
    setSourceWebUrl(p.sourceWebUrl || sourceWebInfo.url || '');
    setSourceWebName(p.sourceWebName || sourceWebInfo.name || cleanSupplierName(p.supplier));
    
    setContainerBatch(p.containerBatch || 'LOTE-LOCAL');
    setImageUrl(p.imageUrl);
    setDescription(p.description || '');
    setShowImportCalculator(false);
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete product action from inventory & Firestore
  const handleDelete = async (p: Product) => {
    try {
      setProducts(prev => prev.filter(item => item.id !== p.id));
      
      try {
        await deleteDoc(doc(db, 'products', p.id));
      } catch {}

      if (p.sku) {
        const cleanSku = cleanProductSku(p.sku);
        const altId1 = `prod-inova-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const altId2 = `prod-source-inova-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        try { await deleteDoc(doc(db, 'products', altId1)); } catch {}
        try { await deleteDoc(doc(db, 'products', altId2)); } catch {}
      }

      setSuccess(`Artículo "${p.title}" borrado con éxito.`);
      setTimeout(() => setSuccess(''), 3500);
      onRefresh();
    } catch (e) {
      console.error("Delete error:", e);
      alert(`Error al borrar el artículo del inventario: ${e instanceof Error ? e.message : String(e)}`);
      onRefresh();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sku.trim()) return;

    const rate = Number(exchangeRate) || 1200;
    const finalCostARS = Number(costARS) || 0;
    const finalCostUSD = Number((finalCostARS / rate).toFixed(2));

    const sanitizedTitle = cleanProductTitle(title);
    const sanitizedSku = cleanProductSku(sku);
    const sanitizedSupplier = cleanSupplierName(supplier);

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      title: sanitizedTitle,
      sku: sanitizedSku,
      category: category.trim() || 'General',
      costPriceUSD: finalCostUSD,
      costARS: finalCostARS,
      markupPercent: Number(profitMarginPercent) || 45,
      freightCostUSD: 0,
      importDutiesUSD: 0,
      exchangeRate: rate,
      finalPriceARS: Number(finalPriceARS),
      stock: Number(stock),
      minStock: Number(minStock),
      supplier: sanitizedSupplier,
      sourceWebUrl: sourceWebUrl.trim() || undefined,
      sourceWebName: sourceWebName.trim() || sanitizedSupplier || undefined,
      containerBatch: containerBatch.trim() || 'LOTE-LOCAL',
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      description: description.trim(),
      active: true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'products', productData.id), productData);
      setIsModalOpen(false);
      setSuccess(editingProduct ? 'Producto actualizado en inventario.' : 'Producto creado en inventario con éxito.');
      setTimeout(() => setSuccess(''), 3500);
      onRefresh();
    } catch (e) {
      alert('Error al guardar el producto en el inventario.');
    }
  };

  // Categories
  const categories = ['todos', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtering
  const filtered = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'todos' || p.category === selectedCategory;
    
    const matchesStock = 
      stockFilter === 'all' 
        ? true 
        : stockFilter === 'active' 
        ? p.active !== false 
        : (p.stock <= p.minStock && p.active !== false);

    return matchesSearch && matchesCat && matchesStock;
  });

  // Inventory Totals in Pesos Argentinos (ARS)
  const activeProducts = products.filter(p => p.active !== false);
  const totalStockValueARS = activeProducts.reduce((sum, p) => sum + (p.stock * p.finalPriceARS), 0);
  const totalCostValueARS = activeProducts.reduce((sum, p) => {
    const cost = p.costARS !== undefined 
      ? p.costARS 
      : Math.round(((p.costPriceUSD || 0) + (p.freightCostUSD || 0) + (p.importDutiesUSD || 0)) * (p.exchangeRate || 1200));
    return sum + (p.stock * cost);
  }, 0);
  const totalPotentialProfitARS = Math.max(0, totalStockValueARS - totalCostValueARS);

  // Sample items for previewing bulk profit calculation
  const previewSampleProducts = (bulkConfig.targetScope === 'selected' && selectedProductIds.length > 0
    ? products.filter(p => selectedProductIds.includes(p.id))
    : products
  ).slice(0, 3);

  const isAllFilteredSelected = filtered.length > 0 && filtered.every(p => selectedProductIds.includes(p.id));

  return (
    <div className="space-y-8 pb-24 animate-fadeIn">
      
      {/* Header Banner with Bulk Actions & Tools */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-cyan-500/30 glow-cyan relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Inventario & Costos en Pesos (ARS)
            </span>
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {activeProducts.length} Artículos Activos
            </span>
            {selectedProductIds.length > 0 && (
              <span className="bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider">
                ✓ {selectedProductIds.length} Seleccionados
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            Inventario General de Productos
          </h2>
          <p className="text-slate-300 text-sm font-medium max-w-2xl leading-relaxed">
            Control integral de catálogo en Pesos Argentinos ($ ARS). Ajusta costos mayoristas, aplica ganancia total masiva y administra tus artículos sin marcas externas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 w-full lg:w-auto">
          {success && (
            <div className="flex items-center gap-2 bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-4 py-3 rounded-2xl text-xs font-black uppercase shadow-lg animate-bounce">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> {success}
            </div>
          )}

          {/* BULK PROFIT BUTTON */}
          <button
            onClick={() => setShowBulkProfitModal(true)}
            className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider glow-cyan shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            title="Calcular y sumar ganancia masiva al precio de costo de todos los artículos"
          >
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Ganancia Total Masiva
          </button>

          {/* CLEAN INOVA BRANDING BUTTON */}
          <button
            onClick={handleCleanInovaFromProducts}
            disabled={isApplyingBulk}
            className="flex-1 sm:flex-none bg-[#121624] hover:bg-[#1A2035] text-amber-300 hover:text-amber-200 border border-amber-500/30 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            title="Quitar nombre 'Inova' y códigos mayoristas de todos los artículos"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Quitar Nombre "Inova"
          </button>

          {/* NEW PRODUCT BUTTON */}
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-wider glow-cyan shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto Manual
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards (100% in ARS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 shadow-xl bg-gradient-to-b from-[#121624] to-[#0A0D18]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Valor Total Stock (ARS)</span>
            <div className="p-2 bg-cyan-600/20 text-cyan-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-cyan-400">
            ${totalStockValueARS.toLocaleString('es-AR')} ARS
          </p>
          <span className="text-[10px] text-slate-400 block font-medium">Precio de venta acumulado</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 shadow-xl bg-gradient-to-b from-[#121624] to-[#0A0D18]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Costo Invertido (ARS)</span>
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-rose-400">
            ${totalCostValueARS.toLocaleString('es-AR')} ARS
          </p>
          <span className="text-[10px] text-slate-400 block font-medium">Costo de reposición mayorista</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 shadow-xl bg-gradient-to-b from-[#121624] to-[#0A0D18]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Ganancia Proyectada</span>
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400">
            +${totalPotentialProfitARS.toLocaleString('es-AR')} ARS
          </p>
          <span className="text-[10px] text-emerald-400/80 block font-bold">Margen bruto en stock</span>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-2 shadow-xl bg-gradient-to-b from-[#121624] to-[#0A0D18]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-black uppercase tracking-wider">Artículos en Inventario</span>
            <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-white">
            {activeProducts.length} <span className="text-xs font-normal text-slate-400">artículos</span>
          </p>
          <span className="text-[10px] text-slate-400 block font-medium">Con stock para venta</span>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="glass-card p-6 rounded-[2rem] border border-white/10 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setStockFilter('active')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              stockFilter === 'active'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-md'
                : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            ✓ En Inventario Activo ({activeProducts.length})
          </button>
          <button
            onClick={() => setStockFilter('lowStock')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
              stockFilter === 'lowStock'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#121624] text-amber-400 hover:text-white border border-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stock Bajo ({products.filter(p => p.stock <= p.minStock && p.active !== false).length})</span>
          </button>
          <button
            onClick={() => setStockFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Ver Todos ({products.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-cyan-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, producto o categoría..."
            className="w-full bg-[#121624] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-500 transition shadow-inner"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto w-full gap-2 pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Floating Bulk Selection Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-[#121624] to-[#1C2338] rounded-2xl border border-cyan-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-4 animate-slideDown">
          <div className="flex items-center gap-3">
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase">
              {selectedProductIds.length} artículos seleccionados
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Aplica ganancia masiva o elimina los elementos marcados.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setBulkConfig(prev => ({ ...prev, targetScope: 'selected' }));
                setShowBulkProfitModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
              Aplicar Ganancia a Seleccionados
            </button>
            <button
              onClick={handleDeleteSelected}
              className="bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Borrar Seleccionados
            </button>
            <button
              onClick={() => setSelectedProductIds([])}
              className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Products Table (100% IN ARS) */}
      <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121624] text-slate-400 uppercase font-black tracking-wider border-b border-white/10">
              <tr>
                <th className="py-4 px-4 text-center w-12">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 rounded text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    title={isAllFilteredSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-6">Producto / SKU</th>
                <th className="py-4 px-6">Categoría</th>
                <th className="py-4 px-6">Dónde Pedirlo (Página / Origen)</th>
                <th className="py-4 px-6 text-right">Costo ($ ARS)</th>
                <th className="py-4 px-6 text-center">Margen (%)</th>
                <th className="py-4 px-6 text-right">Precio Venta ($ ARS)</th>
                <th className="py-4 px-6 text-right">Ganancia ($ ARS)</th>
                <th className="py-4 px-6 text-center">Stock</th>
                <th className="py-4 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-slate-200">
              {filtered.map(p => {
                const itemCostARS = p.costARS !== undefined 
                  ? p.costARS 
                  : Math.round(((p.costPriceUSD || 0) + (p.freightCostUSD || 0) + (p.importDutiesUSD || 0)) * (p.exchangeRate || 1200));
                
                const marginPercent = itemCostARS > 0 
                  ? Math.round(((p.finalPriceARS - itemCostARS) / itemCostARS) * 100) 
                  : (p.markupPercent || 45);

                const profitARS = Math.max(0, p.finalPriceARS - itemCostARS);
                const supplierName = cleanSupplierName(p.supplier);
                const cleanTitle = cleanProductTitle(p.title);
                const cleanSku = cleanProductSku(p.sku);
                const isSelected = selectedProductIds.includes(p.id);

                return (
                  <tr key={p.id} className={`hover:bg-white/5 transition ${isSelected ? 'bg-cyan-950/20' : ''}`}>
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleProduct(p.id)}
                        className="p-1 rounded text-cyan-400 hover:text-cyan-300 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.imageUrl} 
                          alt={cleanTitle} 
                          className="w-14 h-14 object-cover rounded-2xl bg-black/40 border border-white/10 shrink-0" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
                          }}
                        />
                        <div>
                          <p className="font-black text-white text-sm line-clamp-1">{cleanTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-cyan-400 font-bold">SKU: {cleanSku}</span>
                            {p.containerBatch && (
                              <span className="text-[10px] text-slate-400">| Lote: {p.containerBatch}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-white/5 text-slate-300 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {(() => {
                        const webInfo = getProductSourceWeb(p);
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit">
                                <Globe className="w-3 h-3 text-cyan-400" /> {webInfo.name}
                              </span>
                            </div>
                            {webInfo.url ? (
                              <a
                                href={webInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-200 hover:underline transition"
                                title={`Pedir este producto en ${webInfo.url}`}
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>{webInfo.domain || 'Ir a la página'}</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {supplierName}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-rose-400 text-sm">
                      ${itemCostARS.toLocaleString('es-AR')} ARS
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-xl text-xs font-black font-mono">
                        +{marginPercent}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-black text-emerald-400 text-base">
                      ${p.finalPriceARS.toLocaleString('es-AR')} ARS
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-emerald-300 text-xs">
                      +${profitARS.toLocaleString('es-AR')} ARS
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                        p.stock <= p.minStock 
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.stock} un.
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2.5 bg-[#121624] hover:bg-[#1C2338] border border-white/10 rounded-xl text-slate-300 hover:text-cyan-400 transition cursor-pointer"
                          title="Editar Producto y Costos"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-2.5 bg-[#121624] hover:bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-400 hover:text-rose-200 transition cursor-pointer"
                          title="Borrar artículo del inventario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                    No se encontraron artículos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE GANANCIA TOTAL MASIVA */}
      {showBulkProfitModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto">
          <div className="glass-card rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 text-white relative shadow-2xl border border-cyan-500/40 glow-cyan my-6 animate-scaleUp">
            
            <button
              onClick={() => setShowBulkProfitModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-white bg-white/10 hover:bg-rose-600/30 p-3 rounded-full transition shadow-lg z-20 cursor-pointer"
              title="Cerrar Ventana"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-6 pr-12">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center glow-cyan shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">
                  Configurar Ganancia Total Masiva
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Suma un margen porcentual (%) o ganancia fija ($ ARS) directamente sobre el precio de costo para calcular los precios de venta de tus artículos.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  Tipo de Ganancia a Sumar al Costo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkConfig(prev => ({ ...prev, type: 'percent' }))}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      bulkConfig.type === 'percent'
                        ? 'bg-gradient-to-br from-cyan-950 to-blue-900 border-cyan-400 text-white shadow-lg glow-cyan'
                        : 'bg-[#121624] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">Porcentaje (%)</span>
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-[11px] text-slate-300">Margen % sobre costo (ej. +50%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkConfig(prev => ({ ...prev, type: 'fixed' }))}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      bulkConfig.type === 'fixed'
                        ? 'bg-gradient-to-br from-emerald-950 to-teal-900 border-emerald-400 text-white shadow-lg glow-cyan'
                        : 'bg-[#121624] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">Monto Fijo ($ ARS)</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[11px] text-slate-300">Pesos fijos por artículo (ej. +$5.000)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkConfig(prev => ({ ...prev, type: 'mixed' }))}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      bulkConfig.type === 'mixed'
                        ? 'bg-gradient-to-br from-violet-950 to-indigo-900 border-violet-400 text-white shadow-lg glow-cyan'
                        : 'bg-[#121624] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">Mixto (% + $)</span>
                      <Zap className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-[11px] text-slate-300">% de margen + monto fijo en pesos</span>
                  </button>
                </div>
              </div>

              {/* Value Inputs based on Type */}
              <div className="bg-[#121624] p-5 rounded-3xl border border-white/10 space-y-4">
                {(bulkConfig.type === 'percent' || bulkConfig.type === 'mixed') && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" /> Margen de Ganancia Porcentual (% sobre costo)
                      </label>
                      <span className="text-lg font-black font-mono text-cyan-300">+{bulkConfig.percentValue}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={bulkConfig.percentValue}
                      onChange={e => setBulkConfig(prev => ({ ...prev, percentValue: Number(e.target.value) }))}
                      className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[30, 40, 50, 60, 75, 100].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBulkConfig(prev => ({ ...prev, percentValue: val }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            bulkConfig.percentValue === val
                              ? 'bg-cyan-500 text-black shadow-md'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          +{val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(bulkConfig.type === 'fixed' || bulkConfig.type === 'mixed') && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" /> Ganancia Fija en Pesos ($ ARS por unidad)
                      </label>
                      <span className="text-lg font-black font-mono text-emerald-300">
                        +${(bulkConfig.fixedValueARS || 0).toLocaleString('es-AR')} ARS
                      </span>
                    </div>
                    <div className="relative mb-3">
                      <span className="absolute left-4 top-3 text-emerald-400 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={bulkConfig.fixedValueARS}
                        onChange={e => setBulkConfig(prev => ({ ...prev, fixedValueARS: Math.max(0, Number(e.target.value) || 0) }))}
                        className="w-full bg-[#07090E] border border-emerald-500/40 text-emerald-300 pl-9 pr-4 py-2.5 rounded-xl text-base font-mono font-black focus:outline-none focus:border-emerald-400"
                        placeholder="Ej. 5000"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[2000, 3500, 5000, 8000, 10000, 15000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBulkConfig(prev => ({ ...prev, fixedValueARS: val }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            bulkConfig.fixedValueARS === val
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          +${val.toLocaleString('es-AR')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scope & Rounding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Alcance (A qué artículos aplicar):
                  </label>
                  <select
                    value={bulkConfig.targetScope}
                    onChange={e => setBulkConfig(prev => ({ ...prev, targetScope: e.target.value as any }))}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">Todos los artículos del catálogo ({products.length} productos)</option>
                    {selectedProductIds.length > 0 && (
                      <option value="selected">Solo los seleccionados ({selectedProductIds.length} productos)</option>
                    )}
                    <option value="category">Filtrar por una Categoría específica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Redondeo Comercial ($ ARS):
                  </label>
                  <select
                    value={bulkConfig.rounding}
                    onChange={e => setBulkConfig(prev => ({ ...prev, rounding: e.target.value as any }))}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="none">Exacto (sin redondeo)</option>
                    <option value="10">Redondear a decenas ($10)</option>
                    <option value="100">Redondear a centenas ($100 ej. $14.500)</option>
                    <option value="1000">Redondear a millares ($1.000 ej. $15.000)</option>
                  </select>
                </div>
              </div>

              {/* Category selector if scope is category */}
              {bulkConfig.targetScope === 'category' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Seleccionar Categoría:
                  </label>
                  <select
                    value={bulkConfig.targetCategory || 'General'}
                    onChange={e => setBulkConfig(prev => ({ ...prev, targetCategory: e.target.value }))}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    {categories.filter(c => c !== 'todos').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Live Preview Card */}
              <div className="bg-[#07090E] p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Ejemplo de cómo quedarán los precios:
                </span>
                <div className="space-y-2 text-xs">
                  {previewSampleProducts.map(p => {
                    const sampleCost = p.costARS !== undefined 
                      ? p.costARS 
                      : Math.round(((p.costPriceUSD || 0) + (p.freightCostUSD || 0) + (p.importDutiesUSD || 0)) * (p.exchangeRate || 1200));

                    const calc = calculatePriceWithProfit(sampleCost, {
                      type: bulkConfig.type,
                      percentValue: bulkConfig.percentValue,
                      fixedValueARS: bulkConfig.fixedValueARS,
                      rounding: bulkConfig.rounding,
                    });

                    return (
                      <div key={p.id} className="p-3 bg-[#121624] rounded-xl flex flex-wrap items-center justify-between gap-2 border border-white/5">
                        <span className="font-bold text-white max-w-[220px] truncate">{cleanProductTitle(p.title)}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-400">Costo: <strong className="text-rose-400">${sampleCost.toLocaleString('es-AR')}</strong></span>
                          <span className="text-emerald-400 font-bold">+ Ganancia: ${calc.profitARS.toLocaleString('es-AR')}</span>
                          <span className="text-white font-black bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-500/40">
                            Venta: ${calc.finalPriceARS.toLocaleString('es-AR')} ARS (+{calc.effectiveMarginPercent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkProfitModal(false)}
                  disabled={isApplyingBulk}
                  className="w-1/3 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkProfit}
                  disabled={isApplyingBulk}
                  className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider glow-cyan shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isApplyingBulk ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Aplicando a la Base de Datos...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      Aplicar Ganancia a {bulkConfig.targetScope === 'selected' ? selectedProductIds.length : products.length} Artículos
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal (100% Focused on Argentine Pesos ARS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto">
          <div className="glass-card rounded-[2.5rem] max-w-3xl w-full p-6 sm:p-10 text-white relative shadow-2xl border border-white/20 glow-cyan my-6">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-white bg-white/10 hover:bg-rose-600/30 p-3 rounded-full transition shadow-lg z-20 cursor-pointer"
              title="Cerrar Ventana"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-8 pr-12">
              <div className="w-12 h-12 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center glow-cyan shrink-0">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">
                  {editingProduct ? 'Editar Producto & Precios en Pesos (ARS)' : 'Nuevo Producto en Inventario (ARS)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Ingresa el costo mayorista en Pesos Argentinos ($ ARS), el margen de ganancia o ganancia fija y el precio de venta final.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Título del Producto</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Zapatilla 4 tomas + 2 USB + 2 tipo C K93"
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">SKU / Código</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="Ej. ART-K93"
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Proveedor / Origen</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Ej. Mayorista Central"
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Lote / Referencia</label>
                  <input
                    type="text"
                    value={containerBatch}
                    onChange={e => setContainerBatch(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Source Website for Ordering */}
              <div className="p-4 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 rounded-3xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Página Web de Origen (Dónde pedirlo para reponer stock)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre de la Web / Tienda</label>
                    <input
                      type="text"
                      value={sourceWebName}
                      onChange={e => setSourceWebName(e.target.value)}
                      placeholder="Ej. Mayorista Nacional, Global Tech, Once Bazar"
                      className="w-full bg-[#121624] border border-cyan-500/30 text-white px-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">URL de la Página / Producto</label>
                    <div className="relative">
                      <input
                        type="url"
                        value={sourceWebUrl}
                        onChange={e => setSourceWebUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-[#121624] border border-cyan-500/30 text-cyan-300 px-4 py-2.5 pr-8 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-cyan-400"
                      />
                      {sourceWebUrl && (
                        <a
                          href={sourceWebUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-2.5 top-2.5 text-cyan-400 hover:text-white"
                          title="Abrir página en nueva pestaña"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload / URL */}
              <div className="bg-[#121624] p-5 rounded-3xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400">Imagen del Producto (PC o URL)</label>
                <div className="flex items-center gap-4">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-2xl bg-black/50 border border-white/10 shrink-0" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800';
                    }}
                  />
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg transition">
                      <ImageIcon className="w-4 h-4" /> Seleccionar Imagen de PC...
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      placeholder="O pegar URL de imagen..."
                      className="w-full bg-[#07090E] border border-white/10 text-white px-3 py-2 rounded-xl text-[11px] font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Main Pricing Box (100% in ARS) */}
              <div className="bg-[#121624] p-6 rounded-3xl border border-cyan-500/30 space-y-5">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Costo y Precio de Venta en Pesos Argentinos ($ ARS)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowImportCalculator(!showImportCalculator)}
                    className="text-xs text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {showImportCalculator ? 'Ocultar cálculo USD' : 'Opcional: Calcular desde USD'}
                  </button>
                </div>

                {showImportCalculator && (
                  <div className="p-4 bg-[#07090E] rounded-2xl border border-cyan-500/20 space-y-3">
                    <span className="text-[10px] font-black uppercase text-cyan-400 block">Cálculo de Importación en Dólares (USD):</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Costo USD</label>
                        <input
                          type="number"
                          step="0.01"
                          value={costUSD}
                          onChange={e => setCostUSD(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#121624] border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Flete USD</label>
                        <input
                          type="number"
                          step="0.01"
                          value={freightUSD}
                          onChange={e => setFreightUSD(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#121624] border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-400">Arancel USD</label>
                        <input
                          type="number"
                          step="0.01"
                          value={dutiesUSD}
                          onChange={e => setDutiesUSD(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#121624] border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-cyan-400">Dólar ARS</label>
                        <input
                          type="number"
                          value={exchangeRate}
                          onChange={e => setExchangeRate(parseFloat(e.target.value) || 1200)}
                          className="w-full bg-[#121624] border border-white/10 text-cyan-300 px-3 py-2 rounded-xl text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
                      Costo Mayorista ($ ARS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        required
                        value={costARS}
                        onChange={e => setCostARS(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#07090E] border border-rose-500/40 text-rose-300 pl-8 pr-4 py-2.5 rounded-xl text-sm font-mono font-black focus:outline-none focus:border-rose-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        {profitCalculationType === 'percent' ? '% Margen Ganancia' : 'Ganancia Fija ($)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setProfitCalculationType(profitCalculationType === 'percent' ? 'fixed' : 'percent')}
                        className="text-[10px] text-cyan-300 hover:underline font-bold cursor-pointer"
                      >
                        {profitCalculationType === 'percent' ? 'Cambiar a $' : 'Cambiar a %'}
                      </button>
                    </div>
                    {profitCalculationType === 'percent' ? (
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={profitMarginPercent}
                          onChange={e => setProfitMarginPercent(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#07090E] border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-xl text-sm font-mono font-black focus:outline-none focus:border-cyan-400"
                        />
                        <span className="absolute right-3 top-3 text-cyan-400 text-sm font-bold">%</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-cyan-400 text-sm font-bold">$</span>
                        <input
                          type="number"
                          step="500"
                          value={profitFixedAmountARS}
                          onChange={e => setProfitFixedAmountARS(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#07090E] border border-cyan-500/40 text-cyan-300 pl-8 pr-4 py-2.5 rounded-xl text-sm font-mono font-black focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
                      Precio Venta Final ($ ARS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-emerald-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        value={finalPriceARS}
                        onChange={e => setFinalPriceARS(parseFloat(e.target.value) || 0)}
                        className="w-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 pl-8 pr-4 py-2.5 rounded-xl text-base font-mono font-black shadow-inner focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#07090E] rounded-xl flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Ganancia Neta por Unidad:</span>
                  <span className="font-mono font-black text-emerald-400">
                    +${Math.max(0, finalPriceARS - costARS).toLocaleString('es-AR')} ARS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Stock Disponible</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={e => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/3 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider glow-cyan shadow-xl transition cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios en Inventario' : 'Crear Producto en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
