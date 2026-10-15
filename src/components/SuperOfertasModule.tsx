import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  FileText,
  Upload,
  Percent,
  RefreshCw,
  Share2,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Copy,
  Layers,
  Image as ImageIcon,
  Clock,
  Eye,
  Sliders,
  AlertCircle,
  Database,
  ShoppingBag,
  Send,
  Plus,
  CheckSquare,
  Square
} from 'lucide-react';
import { SuperOfferDeal, SuperOfferCatalog, Product } from '../types';
import { useStore } from '../context/StoreContext';
import confetti from 'canvas-confetti';

interface SuperOfertasModuleProps {
  onClose?: () => void;
  isCustomerView?: boolean;
}

export const SuperOfertasModule: React.FC<SuperOfertasModuleProps> = ({
  onClose,
  isCustomerView = false
}) => {
  const { products, addMultipleProducts, updateProduct, addToCart, settings, syncProductCostFromLink } = useStore();

  // Mode: 'editor' (Ajustar márgenes y costos) | 'catalog' (Ver catálogo digital) | 'whatsapp' (Compartir)
  const [activeMode, setActiveMode] = useState<'editor' | 'catalog' | 'whatsapp'>(
    isCustomerView ? 'catalog' : 'editor'
  );

  // Catalog state
  const [catalog, setCatalog] = useState<SuperOfferCatalog | null>(null);
  const [deals, setDeals] = useState<SuperOfferDeal[]>([]);
  const [selectedPageFilter, setSelectedPageFilter] = useState<number | 'all'>('all');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Todas');

  // Global markup controls
  const [globalMarkup, setGlobalMarkup] = useState<number>(settings.defaultProfitMargin || 45);
  const [roundToHundreds, setRoundToHundreds] = useState<boolean>(true);

  // Loading & Processing states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Syncing to inventory state
  const [isSyncingInventory, setIsSyncingInventory] = useState(false);
  const [syncSuccessCount, setSyncSuccessCount] = useState<number | null>(null);
  const [syncingSingleCostId, setSyncingSingleCostId] = useState<string | null>(null);

  // WhatsApp generator state
  const [customWhatsAppMessage, setCustomWhatsAppMessage] = useState<string>('');
  const [whatsAppRecipientNumber, setWhatsAppRecipientNumber] = useState<string>('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Manual deal modal / quick add
  const [editingDeal, setEditingDeal] = useState<SuperOfferDeal | null>(null);

  // Initialize with sample catalog on first open if no deals exist
  useEffect(() => {
    // Check if we have saved super offers in localStorage
    const saved = localStorage.getItem('dropstore_super_ofertas_catalog');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setCatalog(parsed);
          setDeals(parsed.items);
          return;
        }
      } catch {
        // ignore
      }
    }

    // Default: load sample Inova mayorista catalog
    loadSampleCatalog('cat-inova-tech-bazar', globalMarkup);
  }, []);

  // Save changes to localStorage
  const saveCatalogState = (updatedDeals: SuperOfferDeal[], updatedCatalog?: SuperOfferCatalog | null) => {
    setDeals(updatedDeals);
    const cat = updatedCatalog || catalog || {
      id: `cat-${Date.now()}`,
      title: 'Catálogo de Súper Ofertas',
      sourceType: 'inova',
      createdAt: new Date().toISOString(),
      defaultMarkup: globalMarkup,
      items: updatedDeals
    };
    cat.items = updatedDeals;
    setCatalog(cat);
    try {
      localStorage.setItem('dropstore_super_ofertas_catalog', JSON.stringify(cat));
    } catch {
      // ignore
    }
  };

  // Helper to load sample catalog
  const loadSampleCatalog = async (sampleId: string = 'cat-inova-tech-bazar', markup = globalMarkup) => {
    setIsAnalyzing(true);
    setAnalysisStep('Cargando catálogo de ofertas de proveedor mayorista...');
    try {
      const res = await fetch('/api/analyze-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleCatalogId: sampleId,
          markupPercentage: markup
        })
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        const newCatalog: SuperOfferCatalog = {
          id: `cat-${Date.now()}`,
          title: data.catalogTitle || 'Catálogo de Ofertas Inova Argentina',
          description: data.catalogDescription,
          sourceType: 'inova',
          fileName: data.fileName,
          filePagesCount: data.filePagesCount || 3,
          createdAt: new Date().toISOString(),
          defaultMarkup: markup,
          items: data.products
        };
        saveCatalogState(data.products, newCatalog);
        setNotification({
          type: 'success',
          message: `Catálogo cargado con éxito: ${data.products.length} productos separados por página con márgenes del ${markup}%.`
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error al cargar catálogo de muestra'
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // File Upload & PDF/Image Analyzer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisStep(`Leyendo archivo ${file.name} (${Math.round(file.size / 1024)} KB)...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result as string;
          setAnalysisStep('Analizando catálogo con IA, detectando productos y separando por imagen...');

          const res = await fetch('/api/analyze-catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64Content,
              fileName: file.name,
              mimeType: file.type || 'application/pdf',
              markupPercentage: globalMarkup
            })
          });

          const data = await res.json();
          if (data.success && Array.isArray(data.products)) {
            const newCatalog: SuperOfferCatalog = {
              id: `cat-${Date.now()}`,
              title: data.catalogTitle || `Ofertas ${file.name}`,
              description: data.catalogDescription,
              sourceType: file.type.includes('pdf') ? 'pdf' : 'images',
              fileName: file.name,
              filePagesCount: data.filePagesCount || 1,
              createdAt: new Date().toISOString(),
              defaultMarkup: globalMarkup,
              items: data.products
            };

            saveCatalogState(data.products, newCatalog);
            setNotification({
              type: 'success',
              message: `¡Análisis completado! Se extrajeron ${data.products.length} productos separados de ${file.name}.`
            });
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          } else {
            throw new Error(data.error || 'No se pudieron extraer productos del archivo');
          }
        } catch (err: any) {
          setNotification({
            type: 'error',
            message: `Error al procesar archivo: ${err.message}`
          });
        } finally {
          setIsAnalyzing(false);
          setAnalysisStep('');
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsAnalyzing(false);
      setNotification({
        type: 'error',
        message: err.message || 'Error al leer el archivo'
      });
    }
  };

  // Apply Global Markup to all items
  const handleApplyGlobalMarkup = (markup: number) => {
    setGlobalMarkup(markup);
    const updated = deals.map((deal) => {
      let finalPrice = Math.round(deal.originalPrice * (1 + markup / 100));
      if (roundToHundreds) {
        finalPrice = Math.ceil(finalPrice / 100) * 100;
      }
      return {
        ...deal,
        markupPercentage: markup,
        finalPrice,
        regularPrice: Math.round(finalPrice * 1.35)
      };
    });
    saveCatalogState(updated);
    setNotification({
      type: 'info',
      message: `Margen de ${markup}% aplicado a todos los productos (${roundToHundreds ? 'redondeado a centenas' : 'precio exacto'}).`
    });
  };

  // Update single product field inline
  const handleUpdateDealField = (id: string, field: keyof SuperOfferDeal, value: any) => {
    const updated = deals.map((d) => {
      if (d.id !== id) return d;

      const newDeal = { ...d, [field]: value };

      // If originalPrice or markupPercentage changes, recalculate finalPrice
      if (field === 'originalPrice') {
        const cost = Math.max(0, Number(value) || 0);
        let finalPrice = Math.round(cost * (1 + d.markupPercentage / 100));
        if (roundToHundreds) finalPrice = Math.ceil(finalPrice / 100) * 100;
        newDeal.originalPrice = cost;
        newDeal.finalPrice = finalPrice;
        newDeal.regularPrice = Math.round(finalPrice * 1.35);
      } else if (field === 'markupPercentage') {
        const margin = Math.max(0, Number(value) || 0);
        let finalPrice = Math.round(d.originalPrice * (1 + margin / 100));
        if (roundToHundreds) finalPrice = Math.ceil(finalPrice / 100) * 100;
        newDeal.markupPercentage = margin;
        newDeal.finalPrice = finalPrice;
        newDeal.regularPrice = Math.round(finalPrice * 1.35);
      } else if (field === 'finalPrice') {
        // If finalPrice is edited manually, reverse calculate markup percentage
        const finalP = Math.max(0, Number(value) || 0);
        newDeal.finalPrice = finalP;
        if (d.originalPrice > 0) {
          const calculatedMargin = Math.round(((finalP - d.originalPrice) / d.originalPrice) * 100);
          newDeal.markupPercentage = calculatedMargin;
        }
      }

      return newDeal;
    });

    saveCatalogState(updated);
  };

  // Toggle selection
  const handleToggleSelectDeal = (id: string) => {
    const updated = deals.map((d) => (d.id === id ? { ...d, selected: !d.selected } : d));
    saveCatalogState(updated);
  };

  const handleSelectAllDeals = (select: boolean) => {
    const updated = deals.map((d) => ({ ...d, selected: select }));
    saveCatalogState(updated);
  };

  // Remove deal
  const handleDeleteDeal = (id: string) => {
    const updated = deals.filter((d) => d.id !== id);
    saveCatalogState(updated);
  };

  // Sync single deal cost with its supplier link (e.g. Inova ARG)
  const handleSyncDealCostFromLink = async (deal: SuperOfferDeal) => {
    if (!deal.supplierUrl || !deal.supplierUrl.trim().startsWith('http')) {
      setNotification({
        type: 'error',
        message: 'Este producto no tiene un enlace de proveedor válido asignado'
      });
      return;
    }

    setSyncingSingleCostId(deal.id);
    try {
      const res = await fetch('/api/sync-product-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: deal.supplierUrl.trim(),
          markupPercentage: deal.markupPercentage,
          currentOriginalPrice: deal.originalPrice
        })
      });

      const data = await res.json();
      if (data.success && data.cost > 0) {
        const newCost = data.cost;
        let newFinalPrice = Math.round(newCost * (1 + deal.markupPercentage / 100));
        if (roundToHundreds) newFinalPrice = Math.ceil(newFinalPrice / 100) * 100;

        const updated = deals.map((d) =>
          d.id === deal.id
            ? {
                ...d,
                originalPrice: newCost,
                finalPrice: newFinalPrice,
                regularPrice: Math.round(newFinalPrice * 1.35),
                inStock: data.inStock ?? d.inStock,
                supplierName: data.supplierName || d.supplierName
              }
            : d
        );

        saveCatalogState(updated);
        setNotification({
          type: 'success',
          message: `Costo actualizado en vivo: $${newCost.toLocaleString()} (Venta: $${newFinalPrice.toLocaleString()})`
        });
      } else {
        throw new Error(data.error || 'No se pudo leer el precio del enlace');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Error al sincronizar costo: ${err.message}`
      });
    } finally {
      setSyncingSingleCostId(null);
    }
  };

  // Sync Selected Deals into Main Store Inventory (Firestore)
  const handleSyncToInventory = async () => {
    const selectedDeals = deals.filter((d) => d.selected !== false);
    if (selectedDeals.length === 0) {
      setNotification({
        type: 'error',
        message: 'Selecciona al menos un producto para sincronizar al inventario'
      });
      return;
    }

    setIsSyncingInventory(true);
    try {
      const productsToSync: Product[] = selectedDeals.map((deal) => {
        // Find existing product if already imported or create new ID
        const existing = products.find(
          (p) =>
            (p.supplierSku && p.supplierSku === deal.supplierSku) ||
            p.title.toLowerCase() === deal.title.toLowerCase()
        );

        return {
          id: existing?.id || `sp-prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: deal.title,
          description: deal.description,
          originalPrice: deal.originalPrice,
          markupPercentage: deal.markupPercentage,
          finalPrice: deal.finalPrice,
          category: deal.category || 'Ofertas',
          imageUrl: deal.imageUrl,
          galleryUrls: deal.galleryUrls || [deal.imageUrl],
          stock: deal.stock || 25,
          supplierUrl: deal.supplierUrl || '',
          supplierName: deal.supplierName || 'Catálogo Mayorista',
          supplierSku: deal.supplierSku || '',
          lastCostSyncAt: new Date().toISOString(),
          isSuperOffer: true,
          superOfferDiscountLabel: deal.discountLabel || `${deal.markupPercentage}% OFF`,
          catalogPageSource: deal.pageNumber || 1,
          inStock: deal.inStock,
          featured: true,
          rating: 4.9,
          reviewsCount: Math.floor(Math.random() * 20) + 5
        };
      });

      const count = await addMultipleProducts(productsToSync);
      setSyncSuccessCount(count);

      // Mark deals as synced in state
      const updatedDeals = deals.map((d) => {
        if (selectedDeals.some((sd) => sd.id === d.id)) {
          return { ...d, isSyncedToInventory: true };
        }
        return d;
      });
      saveCatalogState(updatedDeals);

      setNotification({
        type: 'success',
        message: `¡${count} productos de Súper Ofertas sincronizados e integrados al inventario de la tienda en tiempo real!`
      });
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Error al sincronizar con inventario: ${err.message}`
      });
    } finally {
      setIsSyncingInventory(false);
    }
  };

  // WhatsApp Message Generator
  const generateWhatsAppText = useMemo(() => {
    const selectedDeals = deals.filter((d) => d.selected !== false);
    const company = settings.companyName || 'DropStore';
    const storeUrl = window.location.origin;

    let text = `🔥 *¡CATÁLOGO DE SÚPER OFERTAS EXCLUSIVAS!* 🔥\n`;
    text += `Hola! Te compartimos nuestras mejores ofertas por tiempo limitado en *${company}* con entrega rápida y garantía oficial:\n\n`;

    selectedDeals.forEach((deal, idx) => {
      text += `*${idx + 1}. ${deal.title}*\n`;
      if (deal.regularPrice && deal.regularPrice > deal.finalPrice) {
        text += `   💰 Antes: ~$${deal.regularPrice.toLocaleString()}~ 👉 *¡HOY: $${deal.finalPrice.toLocaleString()}!*\n`;
      } else {
        text += `   💰 *Precio de Oferta: $${deal.finalPrice.toLocaleString()}*\n`;
      }
      text += `   📦 Stock disponible: ${deal.stock} u. | ${deal.discountLabel || 'OFERTA ESPECIAL'}\n\n`;
    });

    text += `⚡ *¿Cómo comprar o reservar?*\n`;
    text += `Respondé a este mensaje con los productos que te interesan o pedilos directamente en nuestra tienda online:\n`;
    text += `👉 ${storeUrl}\n\n`;
    text += `💳 *Medios de pago:* Mercado Pago (todas las tarjetas) o Transferencia con 10% OFF extra.`;

    return text;
  }, [deals, settings]);

  const handleCopyWhatsApp = () => {
    const textToCopy = customWhatsAppMessage || generateWhatsAppText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
    setNotification({
      type: 'success',
      message: 'Texto de ofertas para WhatsApp copiado al portapapeles'
    });
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(customWhatsAppMessage || generateWhatsAppText);
    const cleanNumber = (whatsAppRecipientNumber || settings.whatsappNumber || '').replace(/[^0-9]/g, '');
    const url = cleanNumber ? `https://wa.me/${cleanNumber}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Filter deals by Page and Category
  const pages = useMemo(() => {
    const pageSet = new Set<number>();
    deals.forEach((d) => {
      if (d.pageNumber) pageSet.add(d.pageNumber);
    });
    return Array.from(pageSet).sort((a, b) => a - b);
  }, [deals]);

  const categories = useMemo(() => {
    const catSet = new Set<string>();
    deals.forEach((d) => {
      if (d.category) catSet.add(d.category);
    });
    return ['Todas', ...Array.from(catSet)];
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchPage = selectedPageFilter === 'all' || d.pageNumber === selectedPageFilter;
      const matchCat = activeCategoryFilter === 'Todas' || d.category === activeCategoryFilter;
      return matchPage && matchCat;
    });
  }, [deals, selectedPageFilter, activeCategoryFilter]);

  // Financial Stats of Catalog
  const stats = useMemo(() => {
    const selected = deals.filter((d) => d.selected !== false);
    const totalCost = selected.reduce((sum, d) => sum + d.originalPrice * d.stock, 0);
    const totalRevenue = selected.reduce((sum, d) => sum + d.finalPrice * d.stock, 0);
    const totalProfit = totalRevenue - totalCost;
    const avgMargin = selected.length > 0
      ? Math.round(selected.reduce((sum, d) => sum + d.markupPercentage, 0) / selected.length)
      : globalMarkup;

    return {
      count: deals.length,
      selectedCount: selected.length,
      totalCost,
      totalRevenue,
      totalProfit,
      avgMargin
    };
  }, [deals, globalMarkup]);

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-indigo-950 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-rose-950 via-indigo-950 to-slate-900 px-6 py-6 border-b border-indigo-900/60 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black uppercase tracking-wider">
              <Flame className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
              <span>Módulo de Súper Ofertas & Catálogos Digitales</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>{catalog?.title || 'Catálogo de Ofertas Flash'}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {deals.length} Artículos
              </span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Procesa catálogos PDF e imágenes, separa productos automáticamente, calcula márgenes de ganancia con un clic, sincroniza inventario y genera difusiones para WhatsApp.
            </p>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            {!isCustomerView && (
              <button
                onClick={() => setActiveMode('editor')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'editor'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Márgenes & Costos</span>
              </button>
            )}

            <button
              onClick={() => setActiveMode('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'catalog'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Catálogo Digital</span>
            </button>

            {!isCustomerView && (
              <button
                onClick={() => setActiveMode('whatsapp')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </button>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl ml-1 cursor-pointer"
              >
                ✕ Cerrar
              </button>
            )}
          </div>
        </div>

        {/* Global Financial KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-medium text-slate-400 block">Productos en Oferta</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-white">{stats.selectedCount}</span>
              <span className="text-xs text-slate-500">de {stats.count}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-medium text-slate-400 block">Margen Promedio</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-amber-300">+{stats.avgMargin}%</span>
              <span className="text-xs text-emerald-400 font-bold">Ganancia pura</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[11px] font-medium text-slate-400 block">Costo Mayorista Total</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-300">${stats.totalCost.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-800/50 p-3 rounded-2xl">
            <span className="text-[11px] font-medium text-indigo-300 block">Ganancia Proyectada</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-400">+${stats.totalProfit.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`mx-6 mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
              : notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-700/60'
              : 'bg-indigo-950/90 text-indigo-200 border-indigo-700/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area depending on Active Mode */}
      <div className="p-6 space-y-6">
        {/* ================= MODE 1: EDITOR & MARGIN CONTROL ================= */}
        {activeMode === 'editor' && (
          <div className="space-y-6">
            {/* Top Controls: Upload PDF & Automatic Markup Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Uploader Box */}
              <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Subir Catálogo PDF o Imágenes</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                    IA OCR Multimodal
                  </span>
                </div>

                <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition-colors group cursor-pointer bg-slate-900/40">
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/webp"
                    onChange={handleFileUpload}
                    disabled={isAnalyzing}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      {isAnalyzing ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {isAnalyzing ? 'Procesando catálogo...' : 'Haz clic o arrastra tu archivo PDF o imágenes aquí'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Soporta catálogos de ofertas en PDF, folletos, flyers o fotos de listas de precios mayoristas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick actions: Sample Catalogs */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">¿No tienes el archivo a mano?</span>
                  <button
                    onClick={() => loadSampleCatalog('cat-inova-tech-bazar')}
                    disabled={isAnalyzing}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cargar Catálogo Ejemplo Inova ARG</span>
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="bg-indigo-950/60 border border-indigo-800/60 p-3 rounded-xl space-y-2 animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      <span>{analysisStep || 'Analizando páginas y separando productos...'}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full animate-progress w-2/3" />
                    </div>
                  </div>
                )}
              </div>

              {/* Automatic Margin Adjustment & Financial Rules */}
              <div className="lg:col-span-7 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    <span>Ajuste Automático de Margen de Ganancia</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Fórmula: Costo + % Ganancia = Precio Venta</span>
                  </div>
                </div>

                {/* Quick Margin Pills */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-400 font-semibold mr-1">Margen Rápido:</span>
                    {[25, 35, 40, 45, 50, 60, 75, 100].map((m) => (
                      <button
                        key={m}
                        onClick={() => handleApplyGlobalMarkup(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          globalMarkup === m
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        +{m}%
                      </button>
                    ))}
                  </div>

                  {/* Slider & Custom Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                    <div className="sm:col-span-7 space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Margen personalizado:</span>
                        <span className="font-extrabold text-emerald-400">+{globalMarkup}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="150"
                        step="5"
                        value={globalMarkup}
                        onChange={(e) => handleApplyGlobalMarkup(parseInt(e.target.value, 10))}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="sm:col-span-5 flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={roundToHundreds}
                          onChange={(e) => setRoundToHundreds(e.target.checked)}
                          className="rounded-sm accent-indigo-500"
                        />
                        <span>Redondear a $100</span>
                      </label>
                      <button
                        onClick={() => handleApplyGlobalMarkup(globalMarkup)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ml-auto"
                      >
                        Recalcular Todos
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sincronización en tiempo real con inventario */}
                <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-indigo-950/60 rounded-xl border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>Sincronizar Inventario en Tiempo Real</span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Publica los productos seleccionados directamente en la base de datos de la tienda.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncToInventory}
                    disabled={isSyncingInventory || stats.selectedCount === 0}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isSyncingInventory ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Sincronizar {stats.selectedCount} al Inventario</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Separación por Página / Imagen del Catálogo */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Separar por Imagen / Página:</span>
                  </span>

                  <button
                    onClick={() => setSelectedPageFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedPageFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Todas las Páginas ({deals.length})
                  </button>

                  {pages.map((pNum) => {
                    const countOnPage = deals.filter((d) => d.pageNumber === pNum).length;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setSelectedPageFilter(pNum)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedPageFilter === pNum
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        Página #{pNum} ({countOnPage} productos)
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleSelectAllDeals(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 cursor-pointer"
                  >
                    Seleccionar Todos
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => handleSelectAllDeals(false)}
                    className="text-xs text-slate-400 hover:text-slate-300 font-bold px-2 py-1 cursor-pointer"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>

              {/* Deals Editable Table / Cards */}
              <div className="space-y-3">
                {filteredDeals.length === 0 ? (
                  <div className="bg-slate-950 p-12 text-center rounded-2xl border border-slate-800 space-y-3">
                    <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-400">No hay productos en esta página del catálogo</p>
                  </div>
                ) : (
                  filteredDeals.map((deal) => {
                    const isSelected = deal.selected !== false;
                    const profitPerUnit = deal.finalPrice - deal.originalPrice;

                    return (
                      <div
                        key={deal.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/50 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Selection Checkbox & Product Image */}
                          <div className="md:col-span-4 flex items-center gap-3">
                            <button
                              onClick={() => handleToggleSelectDeal(deal.id)}
                              className="text-slate-400 hover:text-white cursor-pointer shrink-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-indigo-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-600" />
                              )}
                            </button>

                            <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800 relative group">
                              <img
                                src={deal.imageUrl}
                                alt={deal.title}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-1 right-1 text-[9px] font-black px-1.5 py-0.5 rounded-sm bg-slate-950/80 text-amber-300">
                                Pág #{deal.pageNumber || 1}
                              </span>
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <input
                                type="text"
                                value={deal.title}
                                onChange={(e) => handleUpdateDealField(deal.id, 'title', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-hidden"
                                placeholder="Título del producto"
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  SKU: {deal.supplierSku || 'N/A'}
                                </span>
                                {deal.supplierUrl && (
                                  <a
                                    href={deal.supplierUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                                  >
                                    <span>Ver enlace</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {deal.isSyncedToInventory && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    En Inventario
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Editable Cost & Markup % & Sale Price */}
                          <div className="md:col-span-6 grid grid-cols-3 gap-3">
                            {/* Costo Mayorista ($) */}
                            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                                Costo Original ($)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={deal.originalPrice}
                                  onChange={(e) => handleUpdateDealField(deal.id, 'originalPrice', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-2 py-1 text-xs font-black text-slate-200 focus:outline-hidden"
                                />
                              </div>
                              <span className="text-[9px] text-slate-500 block mt-1 truncate">Precio Catálogo</span>
                            </div>

                            {/* Margen de Ganancia (%) */}
                            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                              <label className="text-[10px] font-bold text-amber-300 block mb-1">
                                Margen (%)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={deal.markupPercentage}
                                  onChange={(e) => handleUpdateDealField(deal.id, 'markupPercentage', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-2 py-1 text-xs font-black text-amber-300 focus:outline-hidden"
                                />
                              </div>
                              <span className="text-[9px] text-emerald-400 block mt-1 font-bold">
                                +${profitPerUnit.toLocaleString()} c/u
                              </span>
                            </div>

                            {/* Precio Final de Venta ($) */}
                            <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 p-2.5 rounded-xl border border-indigo-800/40">
                              <label className="text-[10px] font-bold text-emerald-400 block mb-1">
                                Precio Venta ($)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={deal.finalPrice}
                                  onChange={(e) => handleUpdateDealField(deal.id, 'finalPrice', e.target.value)}
                                  className="w-full bg-slate-950 border border-emerald-500/50 focus:border-emerald-400 rounded-lg px-2 py-1 text-xs font-black text-emerald-300 focus:outline-hidden"
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-1 truncate">
                                Antes: ${deal.regularPrice?.toLocaleString() || (deal.finalPrice * 1.35).toFixed(0)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions: Stock & Link Live Sync & Delete */}
                          <div className="md:col-span-2 flex items-center justify-end gap-2">
                            {deal.supplierUrl && (
                              <button
                                onClick={() => handleSyncDealCostFromLink(deal)}
                                disabled={syncingSingleCostId === deal.id}
                                title="Actualizar costo en vivo desde el enlace del proveedor"
                                className="p-2 bg-slate-900 hover:bg-slate-800 text-indigo-400 rounded-xl border border-slate-800 transition-colors cursor-pointer"
                              >
                                <RefreshCw className={`w-4 h-4 ${syncingSingleCostId === deal.id ? 'animate-spin' : ''}`} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteDeal(deal.id)}
                              title="Eliminar del catálogo"
                              className="p-2 bg-slate-900 hover:bg-rose-950/80 text-rose-400 rounded-xl border border-slate-800 hover:border-rose-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODE 2: DIGITAL CATALOG SHOWCASE ================= */}
        {activeMode === 'catalog' && (
          <div className="space-y-6">
            {/* Catalog Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 border border-rose-800/40 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider">
                <Flame className="w-4 h-4 text-rose-400 fill-rose-400" />
                <span>FOLLETO DIGITAL DE OFERTAS FLASH</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Super Ofertas de Temporada • Precios Mayoristas al Público
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Stock limitado verificado. Garantía oficial en todos los artículos. Envío inmediato a todo el país.
              </p>

              {/* Category Pills inside catalog */}
              <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                      activeCategoryFilter === cat
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredDeals.map((deal) => {
                const discount = deal.regularPrice
                  ? Math.round(((deal.regularPrice - deal.finalPrice) / deal.regularPrice) * 100)
                  : 30;

                return (
                  <div
                    key={deal.id}
                    className="bg-slate-950 rounded-2xl border border-slate-800 hover:border-rose-500/60 overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/20"
                  >
                    {/* Image Container with Badges */}
                    <div className="relative aspect-square overflow-hidden bg-slate-900">
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                        <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider">
                          {deal.discountLabel || `${discount}% OFF`}
                        </span>
                        <span className="bg-slate-950/80 backdrop-blur-xs text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-amber-400/30">
                          Pág #{deal.pageNumber || 1}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-xs text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                        Stock: {deal.stock} u.
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                          {deal.category}
                        </span>
                        <h4 className="text-sm font-black text-white mt-0.5 line-clamp-2 group-hover:text-rose-400 transition-colors">
                          {deal.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {deal.description}
                        </p>
                      </div>

                      {/* Pricing Block */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-emerald-400">
                            ${deal.finalPrice.toLocaleString()}
                          </span>
                          {deal.regularPrice && (
                            <span className="text-xs text-slate-500 line-through">
                              ${deal.regularPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Customer CTAs */}
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            onClick={() => {
                              // Add deal as product to cart
                              const asProduct: Product = {
                                id: deal.id,
                                title: deal.title,
                                description: deal.description,
                                originalPrice: deal.originalPrice,
                                markupPercentage: deal.markupPercentage,
                                finalPrice: deal.finalPrice,
                                category: deal.category,
                                imageUrl: deal.imageUrl,
                                stock: deal.stock,
                                inStock: deal.inStock,
                                supplierUrl: deal.supplierUrl
                              };
                              addToCart(asProduct, 1);
                              setNotification({
                                type: 'success',
                                message: `¡"${deal.title}" agregado al carrito!`
                              });
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Comprar</span>
                          </button>

                          <a
                            href={`https://wa.me/${(settings.whatsappNumber || '5491140557890').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hola ${settings.companyName}, quiero consultar por la súper oferta: *${deal.title}* a $${deal.finalPrice.toLocaleString()}. ¿Tienen stock?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= MODE 3: WHATSAPP GENERATOR ================= */}
        {activeMode === 'whatsapp' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-emerald-400" />
                    <span>Difusión del Catálogo por WhatsApp</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Genera automáticamente un mensaje listo con títulos, descuentos, emojis y enlaces para enviar a clientes o grupos.
                  </p>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {deals.filter((d) => d.selected !== false).length} Ofertas Incluidas
                </span>
              </div>

              {/* Recipient phone input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Enviar a número específico (Opcional):
                  </label>
                  <input
                    type="text"
                    value={whatsAppRecipientNumber}
                    onChange={(e) => setWhatsAppRecipientNumber(e.target.value)}
                    placeholder="Ej: 5491140557890 (con código de país)"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-500">
                    Si lo dejas vacío, abrirá WhatsApp para que elijas cualquier contacto o grupo.
                  </span>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedWhatsApp ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Mensaje</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleOpenWhatsApp}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Abrir en WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Message Preview Textarea */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-bold">Vista previa del mensaje (editable):</span>
                  <span>Formato listo para WhatsApp (*negrita*, ~tachado~)</span>
                </div>
                <textarea
                  rows={14}
                  value={customWhatsAppMessage || generateWhatsAppText}
                  onChange={(e) => setCustomWhatsAppMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl p-4 text-xs font-mono text-emerald-300 leading-relaxed focus:outline-hidden resize-y"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
