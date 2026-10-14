import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Product, Order, CompanySettings } from '../types';
import confetti from 'canvas-confetti';
import {
  Link2,
  Sparkles,
  Percent,
  Layers,
  ShoppingBag,
  Building,
  Save,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Check,
  ExternalLink,
  MessageCircle,
  Truck,
  DollarSign,
  TrendingUp,
  PackageCheck,
  CreditCard,
  Building2,
  AlertCircle,
  Search,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Lock,
  Key
} from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    products,
    orders,
    settings,
    addProduct,
    addMultipleProducts,
    updateProduct,
    deleteProduct,
    updateStock,
    updateGlobalMarkup,
    saveSettings,
    updateOrderStatus,
    updatePaymentStatus,
    resetToInitialCatalog,
    verifyAndSendBudget,
    markOrderAsPaid,
    generateMercadoPagoLink
  } = useStore();

  const { adminEmail, changeAdminPassword, changeAdminEmail } = useAuth();

  const [activeTab, setActiveTab] = useState<'scraper' | 'inventory' | 'orders' | 'settings'>('orders');
  const [settingsSubTab, setSettingsSubTab] = useState<'password' | 'company' | 'payments'>('password');

  // --- PASSWORD MANAGEMENT STATE ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    adminEmailInput: adminEmail || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // --- BUDGET VERIFICATION MODAL STATE ---
  const [budgetModalOrder, setBudgetModalOrder] = useState<Order | null>(null);
  const [verifiedItems, setVerifiedItems] = useState<any[]>([]);
  const [budgetNotes, setBudgetNotes] = useState(
    'Stock verificado físicamente con proveedores sin faltantes. Listo para despacho.'
  );
  const [isGeneratingMp, setIsGeneratingMp] = useState(false);
  const [copiedMpLink, setCopiedMpLink] = useState(false);

  // --- SCRAPER STATE ---
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [markupPercent, setMarkupPercent] = useState<number>(settings.defaultProfitMargin || 40);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapedItems, setScrapedItems] = useState<Product[]>([]);
  const [selectedScrapedIds, setSelectedScrapedIds] = useState<string[]>([]);
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Quick manual product insertion inside scraper
  const [showManualAdd, setShowManualAdd] = useState(false);

  // --- INVENTORY STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [globalMarkupInput, setGlobalMarkupInput] = useState<number>(settings.defaultProfitMargin || 40);
  const [isApplyingGlobalMarkup, setIsApplyingGlobalMarkup] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    originalPrice: 15000,
    markupPercentage: 40,
    finalPrice: 21000,
    category: 'Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    stock: 20,
    supplierUrl: '',
    inStock: true,
    featured: false
  });

  // --- SETTINGS FORM STATE ---
  const [settingsForm, setSettingsForm] = useState<CompanySettings>({ ...settings });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Formatter
  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol || '$'} ${val.toLocaleString('es-AR')}`;
  };

  // --- SCRAPER LOGIC ---
  const handleScrape = async (overrideUrl?: string) => {
    const urlToUse = overrideUrl || scrapeUrl;
    if (!urlToUse || !urlToUse.trim()) {
      setScrapeError('Ingresa un enlace de una tienda online o producto.');
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setImportSuccessMessage(null);

    try {
      const response = await fetch('/api/scrape-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToUse.trim(),
          markupPercentage: markupPercent
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudieron extraer productos del enlace');
      }

      const productsWithParsedPrices: Product[] = data.products.map((p: any) => ({
        ...p,
        originalPrice: Number(p.originalPrice) || 15000,
        markupPercentage: Number(markupPercent) || 40,
        finalPrice: Math.round((Number(p.originalPrice) || 15000) * (1 + (Number(markupPercent) || 40) / 100))
      }));

      setScrapedItems(productsWithParsedPrices);
      setSelectedScrapedIds(productsWithParsedPrices.map((p) => p.id));
    } catch (err: any) {
      setScrapeError(err.message || 'Error al conectar con el servidor scraper');
    } finally {
      setIsScraping(false);
    }
  };

  const handleUpdateScrapedItem = (id: string, updates: Partial<Product>) => {
    setScrapedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.originalPrice !== undefined || updates.markupPercentage !== undefined) {
            const cost = updates.originalPrice !== undefined ? updates.originalPrice : item.originalPrice;
            const margin = updates.markupPercentage !== undefined ? updates.markupPercentage : item.markupPercentage;
            updated.finalPrice = Math.round(cost * (1 + margin / 100));
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleImportSingle = async (item: Product) => {
    setIsImporting(true);
    try {
      const count = await addMultipleProducts([item]);
      setImportedIds((prev) => [...prev, item.id]);
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      setImportSuccessMessage(
        `¡"${item.title.substring(0, 35)}..." se cargó con éxito a tu Tienda y al Inventario!`
      );
    } catch (err: any) {
      alert('Error al cargar el producto: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSelected = async () => {
    const itemsToImport = scrapedItems.filter((i) => selectedScrapedIds.includes(i.id));
    if (itemsToImport.length === 0) {
      alert('Por favor selecciona al menos un producto marcando su casilla.');
      return;
    }

    setIsImporting(true);
    try {
      const count = await addMultipleProducts(itemsToImport);
      setImportedIds((prev) => [...prev, ...itemsToImport.map((i) => i.id)]);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });
      setImportSuccessMessage(
        `¡Éxito! Se cargaron ${count} producto(s) a la Tienda Pública y a tu Inventario en tiempo real.`
      );
    } catch (err: any) {
      alert('Error al importar productos: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // --- INVENTORY LOGIC ---
  const handleApplyGlobalMarkup = async () => {
    if (isNaN(globalMarkupInput) || globalMarkupInput < 0) {
      alert('Ingresa un porcentaje de ganancia válido');
      return;
    }

    setIsApplyingGlobalMarkup(true);
    try {
      await updateGlobalMarkup(globalMarkupInput);
      alert(`¡Margen del +${globalMarkupInput}% aplicado a todos los productos con éxito!`);
    } catch (err: any) {
      alert('Error al actualizar márgenes: ' + err.message);
    } finally {
      setIsApplyingGlobalMarkup(false);
    }
  };

  const handleSaveProductEdit = async () => {
    if (!editingProduct) return;
    try {
      const finalPrice = Math.round(editingProduct.originalPrice * (1 + editingProduct.markupPercentage / 100));
      await updateProduct(editingProduct.id, {
        ...editingProduct,
        finalPrice
      });
      setEditingProduct(null);
    } catch (e: any) {
      alert('Error al guardar producto: ' + e.message);
    }
  };

  const handleCreateNewProduct = async () => {
    if (!newProduct.title.trim() || !newProduct.imageUrl.trim()) {
      alert('Por favor ingresa un título e imagen.');
      return;
    }

    const finalPrice = Math.round(newProduct.originalPrice * (1 + newProduct.markupPercentage / 100));
    try {
      await addProduct({
        ...newProduct,
        finalPrice
      });
      setIsNewProductModalOpen(false);
      setNewProduct({
        title: '',
        description: '',
        originalPrice: 15000,
        markupPercentage: 40,
        finalPrice: 21000,
        category: 'Tecnología',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
        stock: 20,
        supplierUrl: '',
        inStock: true,
        featured: false
      });
    } catch (e: any) {
      alert('Error al crear producto: ' + e.message);
    }
  };

  // --- SETTINGS LOGIC ---
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSavedSuccess(false);

    try {
      await saveSettings(settingsForm);
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3000);
    } catch (err: any) {
      alert('Error al guardar datos de la empresa: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeStatus(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'Las contraseñas nuevas no coinciden. Por favor verifica que sean iguales.'
      });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordChangeStatus({
        type: 'error',
        message: 'La nueva contraseña debe tener al menos 4 caracteres.'
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeAdminPassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (res.success) {
        if (passwordForm.adminEmailInput && passwordForm.adminEmailInput !== adminEmail) {
          await changeAdminEmail(passwordForm.adminEmailInput);
        }
        setPasswordChangeStatus({
          type: 'success',
          message: '¡Contraseña actualizada exitosamente! Se ha guardado en Firebase y a partir de ahora deberás usar esta nueva clave para ingresar.'
        });
        setPasswordForm((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setPasswordChangeStatus({
          type: 'error',
          message: res.error || 'No se pudo cambiar la contraseña. Verifica la contraseña actual.'
        });
      }
    } catch (err: any) {
      setPasswordChangeStatus({
        type: 'error',
        message: err.message || 'Error al actualizar la contraseña.'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Filtered Products for Inventory table
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate CRM KPIs
  const totalSalesRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.totalAmount : 0), 0);
  const paidOrdersCount = orders.filter((o) => o.paymentStatus === 'paid').length;
  const pendingOrdersCount = orders.filter((o) => o.paymentStatus === 'pending').length;
  const avgTicket = paidOrdersCount > 0 ? Math.round(totalSalesRevenue / paidOrdersCount) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top CRM Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  CRM & Panel Administrativo
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Firebase Sync Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sesión: <strong className="text-slate-300">{adminEmail}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Tienda Pública</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 mt-4 border-t border-slate-800/80 pt-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('scraper')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'scraper'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Extractor Web (Scraper)</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inventario & Márgenes ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ventas & Clientes ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-300" />
            <span>Configuración & Contraseña</span>
          </button>
        </div>
      </header>

      {/* Main CRM Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ============================================================ */}
        {/* TAB 1: PRODUCT LINK SCRAPER / EXTRACTOR                      */}
        {/* ============================================================ */}
        {activeTab === 'scraper' && (
          <div className="space-y-6 animate-fade-in">
            {/* Scraper Hero Input Card */}
            <div className="bg-slate-950 p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
                  <Link2 className="w-3.5 h-3.5" />
                  <span>EXTRACTOR AUTOMÁTICO DE PRODUCTOS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Pega el link de la web para extraer productos o un artículo individual
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Ingresa el enlace de cualquier tienda, listado de productos o artículo particular. El sistema extraerá imágenes, títulos, descripciones y costo original, aplicando automáticamente tu margen de ganancia.
                </p>
              </div>

              {/* Input Bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Link2 className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="url"
                    placeholder="Ej: https://tienda.com/categoria-tech o https://tienda.com/articulo-reloj-ultra"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Markup setting */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3.5 py-2.5 rounded-2xl shrink-0">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-bold whitespace-nowrap">Margen a sumar:</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={markupPercent}
                    onChange={(e) => setMarkupPercent(Number(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs font-black text-amber-300 text-center focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>

                {/* Scrape button */}
                <button
                  onClick={() => handleScrape()}
                  disabled={isScraping}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isScraping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-200" />
                      <span>Extrayendo web...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Extraer Productos</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Preset Buttons for 1-click Test */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold">Enlaces de Prueba Rápida:</span>
                <button
                  type="button"
                  onClick={() => {
                    const demoUrl = 'https://demo-supplier.com/gadgets-catalog';
                    setScrapeUrl(demoUrl);
                    handleScrape(demoUrl);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  ⚡ Catálogo Tech & Gadgets (4 ítems)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const demoUrl = 'https://demo-supplier.com/moda-urbana';
                    setScrapeUrl(demoUrl);
                    handleScrape(demoUrl);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  👟 Catálogo Moda & Sneakers (2 ítems)
                </button>
              </div>

              {/* Error Alert */}
              {scrapeError && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{scrapeError}</span>
                </div>
              )}

              {/* Success Alert */}
              {importSuccessMessage && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-700 rounded-2xl text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="font-bold">{importSuccessMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTab('inventory')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                    >
                      Ver en Inventario ({products.length})
                    </button>
                    <button
                      onClick={onClose}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold rounded-xl text-xs border border-emerald-800 cursor-pointer"
                    >
                      Ver en la Tienda
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Items Review Grid */}
            {scrapedItems.length > 0 && (
              <div className="bg-slate-950 p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl space-y-5 animate-fade-in">
                {/* Header with Title and Primary Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-500/20 text-indigo-400 text-xs font-black px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                        {scrapedItems.length} Encontrado(s)
                      </span>
                      <h3 className="font-extrabold text-lg sm:text-xl text-white">
                        Productos Extraídos Listos para Cargar
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Puedes cargar un producto individual haciendo clic en <strong className="text-emerald-400">"Cargar a Tienda e Inventario"</strong> o seleccionar varios y cargarlos juntos.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedScrapedIds.length === scrapedItems.length) {
                          setSelectedScrapedIds([]);
                        } else {
                          setSelectedScrapedIds(scrapedItems.map((i) => i.id));
                        }
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                    >
                      {selectedScrapedIds.length === scrapedItems.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>

                    <button
                      type="button"
                      onClick={handleImportSelected}
                      disabled={selectedScrapedIds.length === 0 || isImporting}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                          <span>Cargando en Firebase...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Cargar Seleccionados ({selectedScrapedIds.length}) a Tienda e Inventario</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scrapedItems.map((item) => {
                    const isSelected = selectedScrapedIds.includes(item.id);
                    const isLoaded = importedIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isLoaded
                            ? 'bg-slate-900/90 border-emerald-500/60 ring-1 ring-emerald-500/30'
                            : isSelected
                            ? 'bg-slate-900 border-indigo-500/70'
                            : 'bg-slate-900/50 border-slate-800 opacity-80'
                        }`}
                      >
                        <div className="flex gap-3.5">
                          {/* Checkbox */}
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedScrapedIds([...selectedScrapedIds, item.id]);
                                } else {
                                  setSelectedScrapedIds(selectedScrapedIds.filter((id) => id !== item.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 cursor-pointer"
                            />
                          </div>

                          {/* Thumbnail */}
                          <div className="w-24 h-24 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700 relative">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                            {isLoaded && (
                              <span className="absolute top-1 right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateScrapedItem(item.id, { title: e.target.value })}
                              className="w-full px-2 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-xs font-bold text-white focus:outline-hidden focus:border-indigo-500"
                            />

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block">Costo Proveedor</span>
                                <input
                                  type="number"
                                  value={item.originalPrice}
                                  onChange={(e) =>
                                    handleUpdateScrapedItem(item.id, { originalPrice: Number(e.target.value) })
                                  }
                                  className="w-full px-1.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-slate-200"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block">Margen %</span>
                                <input
                                  type="number"
                                  value={item.markupPercentage}
                                  onChange={(e) =>
                                    handleUpdateScrapedItem(item.id, { markupPercentage: Number(e.target.value) })
                                  }
                                  className="w-full px-1.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-mono text-amber-300 font-bold"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block">Precio Venta</span>
                                <span className="font-mono font-black text-emerald-400 text-xs block py-1">
                                  {formatCurrency(item.finalPrice)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-0.5">
                              <span className="text-slate-400">
                                Ganancia:{' '}
                                <strong className="text-emerald-400">
                                  {formatCurrency(item.finalPrice - item.originalPrice)}
                                </strong>
                              </span>
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                                Stock: {item.stock} u.
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Individual Product Action Bar */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          {isLoaded ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-400" />
                                ✓ Ya cargado en la Tienda e Inventario
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('inventory')}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Ver Inventario
                                </button>
                                <button
                                  type="button"
                                  onClick={onClose}
                                  className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  Ver en Tienda
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleImportSingle(item)}
                              disabled={isImporting}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Cargar este producto a la Tienda e Inventario</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Bulk Action Bar */}
                {scrapedItems.length > 2 && (
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Total: <strong className="text-white">{scrapedItems.length}</strong> productos |{' '}
                      <strong className="text-emerald-400">{selectedScrapedIds.length}</strong> seleccionados
                    </span>
                    <button
                      type="button"
                      onClick={handleImportSelected}
                      disabled={selectedScrapedIds.length === 0 || isImporting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cargar Seleccionados ({selectedScrapedIds.length}) a Tienda e Inventario</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: INVENTORY & DYNAMIC MARGIN MANAGEMENT                 */}
        {/* ============================================================ */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-fade-in">
            {/* Centralized Profit Markup Banner */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 rounded-3xl border border-indigo-800/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-md border border-indigo-500/30">
                    CONTROL CENTRALIZADO
                  </span>
                  <h3 className="font-black text-base text-white">
                    Modificar Margen de Ganancia a Todo el Catálogo
                  </h3>
                </div>
                <p className="text-xs text-slate-400 max-w-xl">
                  Cambia de forma masiva el porcentaje de ganancia sobre el precio de costo del proveedor. Los precios de venta al público se recalcularán al instante en Firebase.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-slate-900 border border-indigo-700/60 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-slate-400 mr-2 font-bold">+</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={globalMarkupInput}
                    onChange={(e) => setGlobalMarkupInput(Number(e.target.value))}
                    className="w-16 bg-transparent text-sm font-black text-amber-300 text-center focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-400 font-bold ml-1">%</span>
                </div>

                <button
                  onClick={handleApplyGlobalMarkup}
                  disabled={isApplyingGlobalMarkup}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isApplyingGlobalMarkup ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  <span>Aplicar Margen a Todos</span>
                </button>
              </div>
            </div>

            {/* Inventory Controls & Table */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar producto en inventario..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNewProductModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar Manual</span>
                  </button>
                  <button
                    onClick={resetToInitialCatalog}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition-colors"
                    title="Restablecer catálogo base"
                  >
                    Recargar Catálogo
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-3">Categoría</th>
                      <th className="py-3 px-3">Costo Prov.</th>
                      <th className="py-3 px-3">Margen</th>
                      <th className="py-3 px-3">P. Venta</th>
                      <th className="py-3 px-3 text-center">Stock</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-700"
                          />
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-white block truncate">{p.title}</span>
                            <span className="text-[10px] text-slate-400">ID: {p.id.slice(-8)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{p.category}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {formatCurrency(p.originalPrice || Math.round(p.finalPrice / 1.4))}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-amber-400/10 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-400/20">
                            +{p.markupPercentage || 40}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                          {formatCurrency(p.finalPrice)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                            <button
                              onClick={() => updateStock(p.id, Math.max(0, p.stock - 1))}
                              className="text-slate-400 hover:text-white font-black px-1"
                            >
                              -
                            </button>
                            <span className={`font-bold ${p.stock <= 5 ? 'text-rose-400' : 'text-white'}`}>
                              {p.stock}
                            </span>
                            <button
                              onClick={() => updateStock(p.id, p.stock + 1)}
                              className="text-slate-400 hover:text-white font-black px-1"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Editar producto"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar ${p.title} del catálogo?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-white text-base">Editar Producto</h3>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Título</label>
                    <input
                      type="text"
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Costo Proveedor ($)</label>
                      <input
                        type="number"
                        value={editingProduct.originalPrice}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            originalPrice: Number(e.target.value)
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Margen de Ganancia (%)</label>
                      <input
                        type="number"
                        value={editingProduct.markupPercentage}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            markupPercentage: Number(e.target.value)
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-slate-400">Precio Final de Venta al Público:</span>
                    <span className="font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(
                        Math.round(editingProduct.originalPrice * (1 + editingProduct.markupPercentage / 100))
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Categoría</label>
                      <input
                        type="text"
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Stock</label>
                      <input
                        type="number"
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">URL de Imagen</label>
                    <input
                      type="text"
                      value={editingProduct.imageUrl}
                      onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveProductEdit}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add Manual Product Modal */}
            {isNewProductModalOpen && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <h3 className="font-extrabold text-white text-base">Nuevo Producto Manual</h3>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Título del Producto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Auriculares Bluetooth Pro"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Costo Proveedor ($)</label>
                      <input
                        type="number"
                        value={newProduct.originalPrice}
                        onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Margen de Ganancia (%)</label>
                      <input
                        type="number"
                        value={newProduct.markupPercentage}
                        onChange={(e) => setNewProduct({ ...newProduct, markupPercentage: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Categoría</label>
                      <input
                        type="text"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Stock Inicial</label>
                      <input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">URL de Imagen</label>
                    <input
                      type="text"
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setIsNewProductModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateNewProduct}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                    >
                      Crear Producto
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ORDERS & SALES CRM                                    */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Facturación Pagada</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">{formatCurrency(totalSalesRevenue)}</div>
                <span className="text-[11px] text-emerald-400">En tiempo real</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Pedidos Cobrados</span>
                  <PackageCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{paidOrdersCount}</div>
                <span className="text-[11px] text-indigo-400">Ventas completadas</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Pagos Pendientes</span>
                  <CreditCard className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">{pendingOrdersCount}</div>
                <span className="text-[11px] text-amber-400">Por verificar comprobante</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                  <span>Ticket Promedio</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{formatCurrency(avgTicket)}</div>
                <span className="text-[11px] text-blue-400">Por orden de compra</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Historial de Pedidos & Verificación de Stock (CRM)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Revisa las existencias de cada pedido antes de cobrar, genera el presupuesto y envía el link de Mercado Pago o datos de transferencia.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Aún no se han recibido pedidos. Cuando un cliente compre a través de la web, se reflejará aquí de forma automatizada.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Orden</th>
                        <th className="py-3 px-3">Cliente</th>
                        <th className="py-3 px-3">Estado Presupuesto</th>
                        <th className="py-3 px-3">Total Confirmado</th>
                        <th className="py-3 px-3">Estado Pago</th>
                        <th className="py-3 px-3 text-right">Acciones de Venta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {orders.map((o) => {
                        const cleanPhone = o.customerPhone.replace(/[^0-9]/g, '');
                        const isBudgetReady = o.budgetStatus === 'budget_ready';
                        const isPaid = o.paymentStatus === 'paid';

                        return (
                          <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-indigo-400">{o.id}</span>
                              <span className="block text-[10px] text-slate-500">
                                {new Date(o.createdAt).toLocaleDateString('es-AR')}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              <span className="font-bold text-white block">{o.customerName}</span>
                              <span className="text-[10px] text-slate-400 truncate block max-w-xs">
                                {o.customerPhone} • {o.items.length} ítems
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
                                  <Check className="w-3.5 h-3.5" />
                                  Cobrado & Listo
                                </span>
                              ) : isBudgetReady ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800">
                                  <Check className="w-3.5 h-3.5" />
                                  Presupuesto Enviado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-800 animate-pulse">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Verificar Stock / Cantidades
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                              {formatCurrency(o.adjustedTotal || o.totalAmount)}
                            </td>

                            <td className="py-3 px-3">
                              <select
                                value={o.paymentStatus}
                                onChange={(e) => updatePaymentStatus(o.id, e.target.value as any)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${
                                  o.paymentStatus === 'paid'
                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                    : 'bg-amber-950/80 text-amber-400 border-amber-800'
                                }`}
                              >
                                <option value="pending">Pendiente</option>
                                <option value="paid">Pagado</option>
                                <option value="failed">Rechazado</option>
                              </select>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Button to open stock verification & budget modal */}
                                <button
                                  onClick={() => {
                                    setBudgetModalOrder(o);
                                    setVerifiedItems(
                                      o.items.map((it) => ({
                                        ...it,
                                        verifiedStock: true,
                                        availableQuantity: it.quantity
                                      }))
                                    );
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Verificar cantidades y armar presupuesto"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                  <span>{isBudgetReady ? 'Ver Presupuesto' : 'Verificar Stock'}</span>
                                </button>

                                {/* Direct WhatsApp contact */}
                                <a
                                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                    `Hola ${o.customerName}, te escribimos de ${settings.companyName} sobre tu pedido #${o.id}.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Abrir WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: CONFIGURACIÓN & SEGURIDAD (CONTRASEÑA, EMPRESA, PAGOS) */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Sub-navigation inside Configuración */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
              <button
                type="button"
                onClick={() => setSettingsSubTab('password')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  settingsSubTab === 'password'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Key className="w-4 h-4 text-amber-300" />
                <span>🔐 Cambiar Contraseña & Acceso</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('company')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  settingsSubTab === 'company'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>🏢 Datos de la Empresa</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('payments')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  settingsSubTab === 'payments'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>💳 Cuentas Bancarias & Mercado Pago</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsSubTab('all' as any)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ml-auto ${
                  (settingsSubTab as any) === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Ver todo</span>
              </button>
            </div>

            {/* SECTION 1: PASSWORD & SECURITY (Shown when password or all) */}
            {(settingsSubTab === 'password' || (settingsSubTab as any) === 'all') && (
              <form onSubmit={handlePasswordSubmit} className="bg-slate-950 p-6 rounded-3xl border border-indigo-700/60 shadow-xl space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Key className="w-4 h-4 text-amber-300" />
                    <span>Seguridad y Contraseña del Administrador</span>
                  </div>
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Acceso CRM Activo
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">Cambiar Contraseña de Ingreso</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Actualiza tu contraseña para proteger el acceso a tus productos, clientes y pagos. El cambio se guarda inmediatamente en Firebase.
                  </p>
                </div>

                {passwordChangeStatus && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                      passwordChangeStatus.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-200 shadow-md'
                        : 'bg-rose-950/80 border border-rose-700 text-rose-200'
                    }`}
                  >
                    {passwordChangeStatus.type === 'success' ? (
                      <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold">{passwordChangeStatus.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Correo / Usuario de Acceso
                    </label>
                    <input
                      type="email"
                      value={passwordForm.adminEmailInput}
                      onChange={(e) => setPasswordForm({ ...passwordForm, adminEmailInput: e.target.value })}
                      placeholder="admin@gangastore.com"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Contraseña Actual
                      </label>
                      <span className="text-[10px] text-amber-300/80 font-mono">
                        (Clave por defecto: admin123)
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Ingresa tu contraseña actual (o admin123)"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Nueva Contraseña *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Nueva clave (mínimo 4 caracteres)"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Confirmar Nueva Contraseña *
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Repite la nueva contraseña"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800/80">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isChangingPassword ? 'Guardando en Firebase...' : 'Actualizar y Guardar Nueva Contraseña'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400">
                    Sincronización en tiempo real con Firebase Firestore
                  </span>
                </div>
              </form>
            )}

            {/* SECTION 2 & 3: COMPANY AND PAYMENTS (Shown when relevant) */}
            <form onSubmit={handleSaveSettingsSubmit} className="space-y-6">
              {/* Company Details Card */}
              {(settingsSubTab === 'company' || (settingsSubTab as any) === 'all') && (
                <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Building2 className="w-4 h-4" />
                    <span>Datos de la Empresa / Marca</span>
                  </div>
                  <h3 className="text-lg font-black text-white">Información Comercial y de Contacto</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Nombre Comercial *</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.companyName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Email de la Empresa *</label>
                      <input
                        type="email"
                        required
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Número de WhatsApp (con código país)</label>
                      <input
                        type="text"
                        value={settingsForm.whatsappNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                        placeholder="5491140557890"
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Dirección del Depósito / Oficina</label>
                      <input
                        type="text"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-300 block mb-1">Texto de la Barra Superior de Ofertas</label>
                      <input
                        type="text"
                        value={settingsForm.announcementText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingSettings}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingSettings ? 'Guardando en Firebase...' : 'Guardar Información de la Empresa'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Client Payment Details Card */}
              {(settingsSubTab === 'payments' || (settingsSubTab as any) === 'all') && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <CreditCard className="w-4 h-4" />
                      <span>Datos para el Pago de los Clientes</span>
                    </div>
                    <h3 className="text-lg font-black text-white">Cuentas Bancarias para Transferencias</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Banco Receptor</label>
                        <input
                          type="text"
                          value={settingsForm.bankName}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                          placeholder="Ej. Banco Santander / Galicia"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Titular de la Cuenta</label>
                        <input
                          type="text"
                          value={settingsForm.bankAccountHolder}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountHolder: e.target.value })}
                          placeholder="Bruzzone Distribuidora SRL"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">CBU / CVU / Alias de Cobro</label>
                        <input
                          type="text"
                          value={settingsForm.bankCbuAlias}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankCbuAlias: e.target.value })}
                          placeholder="MIEMPRESA.PAGOS.ALIAS"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">CUIT / CUIL</label>
                        <input
                          type="text"
                          value={settingsForm.bankCuit || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, bankCuit: e.target.value })}
                          placeholder="30-71894215-4"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Monto Mínimo para Envío Gratis ($)</label>
                        <input
                          type="number"
                          value={settingsForm.freeShippingThreshold}
                          onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Símbolo de Moneda</label>
                        <input
                          type="text"
                          value={settingsForm.currencySymbol}
                          onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingSettings ? 'Guardando en Firebase...' : 'Guardar Datos Bancarios'}</span>
                      </button>
                    </div>
                  </div>

                  {/* MERCADO PAGO INTEGRATION CARD */}
                  <div className="bg-slate-950 p-6 rounded-3xl border border-sky-800/40 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                        <CreditCard className="w-4 h-4" />
                        <span>Adhesión de Cuenta Mercado Pago</span>
                      </div>
                      {settingsForm.mercadoPagoAccessToken ? (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          ✓ Cuenta Adherida
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Modo Asistido / Demo
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">Configuración de Pasarela Mercado Pago</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Adhiere las credenciales de tu cuenta de Mercado Pago para que las notificaciones de pago impacten automáticamente en tu sistema y el cliente pueda abrir su app para pagar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Access Token de Mercado Pago (Producción o Pruebas)
                        </label>
                        <input
                          type="password"
                          value={settingsForm.mercadoPagoAccessToken || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, mercadoPagoAccessToken: e.target.value })}
                          placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Obtén tu Access Token en{' '}
                          <a
                            href="https://www.mercadopago.com/developers/panel/app"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 underline"
                          >
                            Mercado Pago Developers
                          </a>{' '}
                          (Credenciales de Producción).
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Public Key de Mercado Pago</label>
                        <input
                          type="text"
                          value={settingsForm.mercadoPagoPublicKey || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, mercadoPagoPublicKey: e.target.value })}
                          placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Alias / CVU de Mercado Pago (para transferencias directas)</label>
                        <input
                          type="text"
                          value={settingsForm.mercadoPagoAliasCvu || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, mercadoPagoAliasCvu: e.target.value })}
                          placeholder="DISTRIBUIDORA.BRUZZONE.MP"
                          className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold text-slate-300 block">
                          URL de Webhook para Notificaciones Automáticas de Pago:
                        </span>
                        <span className="font-mono text-xs text-sky-400 break-all select-all block bg-slate-950 p-2 rounded-lg border border-slate-800">
                          {window.location.origin}/api/mercadopago/webhook
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Configura esta URL en tu panel de Mercado Pago en la sección <em>Webhooks</em> para recibir la confirmación de pago al instante.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Credenciales de Mercado Pago</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* BUDGET VERIFICATION & MERCADO PAGO QUOTATION MODAL          */}
      {/* ============================================================ */}
      {budgetModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                    #{budgetModalOrder.id}
                  </span>
                  <h3 className="font-extrabold text-white text-base">
                    Verificación de Stock & Envío de Presupuesto
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cliente: <strong className="text-white">{budgetModalOrder.customerName}</strong> ({budgetModalOrder.customerPhone})
                </p>
              </div>

              <button
                onClick={() => setBudgetModalOrder(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Control de Artículos para el Presupuesto:
                </span>
                <p className="text-[11px] text-slate-400">
                  Verifica que dispongas de las cantidades solicitadas en stock con el proveedor. Si hay que ajustar cantidades o confirmar, hazlo aquí:
                </p>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {verifiedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate max-w-sm">{item.title}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Precio unitario: {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Cant. Confirmada</span>
                        <input
                          type="number"
                          min="1"
                          value={item.availableQuantity || item.quantity}
                          onChange={(e) => {
                            const newQty = Math.max(1, Number(e.target.value));
                            setVerifiedItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, availableQuantity: newQty } : it))
                            );
                          }}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white text-xs"
                        />
                      </div>

                      <span className="font-mono font-black text-emerald-400 text-sm">
                        {formatCurrency(item.price * (item.availableQuantity || item.quantity))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes to the client */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nota / Observaciones de Verificación para el Cliente:
                </label>
                <textarea
                  rows={2}
                  value={budgetNotes}
                  onChange={(e) => setBudgetNotes(e.target.value)}
                  placeholder="Ej. Stock confirmado al 100% sin faltantes. Reservado por 24hs..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Total Calculation */}
              {(() => {
                const verifiedTotal = verifiedItems.reduce(
                  (sum, it) => sum + it.price * (it.availableQuantity || it.quantity),
                  0
                );
                return (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-900/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Total Final del Presupuesto Confirmado:</span>
                      <p className="text-[10px] text-emerald-400">Sin faltantes de inventario</p>
                    </div>
                    <span className="text-xl font-mono font-black text-white">
                      {formatCurrency(verifiedTotal)}
                    </span>
                  </div>
                );
              })()}

              {/* If Mercado Pago link exists */}
              {budgetModalOrder.mercadoPagoPaymentLink && (
                <div className="p-3 bg-sky-950/60 border border-sky-800/80 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Link Oficial de Mercado Pago Generado:
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(budgetModalOrder.mercadoPagoPaymentLink || '');
                        setCopiedMpLink(true);
                        setTimeout(() => setCopiedMpLink(false), 2000);
                      }}
                      className="px-2 py-0.5 bg-sky-800 hover:bg-sky-700 text-white rounded text-[10px] font-bold flex items-center gap-1"
                    >
                      {copiedMpLink ? '¡Copiado!' : 'Copiar Link'}
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 block truncate">
                    {budgetModalOrder.mercadoPagoPaymentLink}
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={async () => {
                  if (confirm('¿Confirmas que el cliente ya pagó (por transferencia o efectivo)?')) {
                    await markOrderAsPaid(budgetModalOrder.id, 'bank_transfer');
                    setBudgetModalOrder(null);
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Marcar como Pagado Manualmente
              </button>

              <button
                type="button"
                disabled={isGeneratingMp}
                onClick={async () => {
                  setIsGeneratingMp(true);
                  const verifiedTotal = verifiedItems.reduce(
                    (sum, it) => sum + it.price * (it.availableQuantity || it.quantity),
                    0
                  );
                  const mpLink = await verifyAndSendBudget(
                    budgetModalOrder.id,
                    verifiedItems,
                    budgetNotes,
                    verifiedTotal
                  );
                  setIsGeneratingMp(false);

                  // Open WhatsApp to client with quotation
                  const cleanPhone = budgetModalOrder.customerPhone.replace(/[^0-9]/g, '');
                  const itemsList = verifiedItems
                    .map((it) => `• ${(it.availableQuantity || it.quantity)}x ${it.title}`)
                    .join('\n');

                  const waMessage =
                    `¡Hola ${budgetModalOrder.customerName}! Te escribimos de *${settings.companyName}* sobre tu pedido *#${budgetModalOrder.id}*.\n\n` +
                    `✅ *Presupuesto Verificado y Confirmado (Sin faltantes de stock)*\n` +
                    `${itemsList}\n\n` +
                    `*Total final:* ${formatCurrency(verifiedTotal)}\n\n` +
                    `*Nota:* ${budgetNotes}\n\n` +
                    `👉 *Pagar con tu app de Mercado Pago:* \n${mpLink || budgetModalOrder.mercadoPagoPaymentLink || ''}\n\n` +
                    `👉 *O Transferencia Bancaria (10% OFF):*\nAlias: *${settings.mercadoPagoAliasCvu || settings.bankCbuAlias || 'GANGA.DROP.PAGOS'}*\nBanco: ${settings.bankName}\n\n` +
                    `Avisanos por aquí una vez hecho el pago para despachar tu paquete. ¡Muchas gracias!`;

                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`, '_blank');
                  setBudgetModalOrder(null);
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{isGeneratingMp ? 'Generando Presupuesto...' : 'Aprobar y Enviar Presupuesto por WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
