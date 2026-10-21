import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductSpec } from '../../types';
import { CATALOG_CATEGORIES, HERO_IMAGE } from '../../data/products';
import { formatCurrency } from '../../utils/formatters';
import { ASSET_IMAGES, resolveProductImage, handleImageError } from '../../utils/imageUtils';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Calculator, 
  Eye, 
  Layers, 
  Tag, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Flame,
  Wind,
  Clock,
  Zap,
  Battery,
  Monitor,
  Wrench,
  Cpu,
  ShieldCheck,
  Maximize2,
  Users
} from 'lucide-react';

const PRESET_IMAGES = [
  { label: 'Horno Eléctrico 50L (Nuvoh)', url: ASSET_IMAGES.horno },
  { label: 'Cafetera Expresso Vintage (Nuvoh)', url: ASSET_IMAGES.cafetera },
  { label: 'Taladro 48V con Maletín (Nuvoh)', url: ASSET_IMAGES.taladro },
  { label: 'Silla Gamer Ergonómica (Nuvoh)', url: ASSET_IMAGES.silla },
  { label: 'Portada Catálogo Nuvoh', url: ASSET_IMAGES.hero },
  { label: 'Pava Eléctrica Inox', url: 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=600&q=80' },
  { label: 'Licuadora de Mesa', url: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80' },
  { label: 'Ventilador de Pie', url: 'https://images.unsplash.com/photo-1618944847828-82e943c3bdb7?auto=format&fit=crop&w=600&q=80' },
  { label: 'Herramientas Set Pro', url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80' }
];

const AVAILABLE_ICONS = [
  { name: 'maximize', label: 'Medida / Capacidad' },
  { name: 'clock', label: 'Timer / Tiempo' },
  { name: 'flame', label: 'Calor / Fuego' },
  { name: 'wind', label: 'Viento / Convección' },
  { name: 'zap', label: 'Potencia / Watts' },
  { name: 'battery', label: 'Batería / Litio' },
  { name: 'tool', label: 'Herramienta / Maletín' },
  { name: 'shield', label: 'Seguridad / Garantía' },
  { name: 'layers', label: 'Materiales / Capas' },
  { name: 'cpu', label: 'Digital / Chip' },
  { name: 'users', label: 'Uso Familiar' },
  { name: 'sparkles', label: 'Diseño / Calidad' }
];

export const ProductEditModal: React.FC = () => {
  const { 
    isProductEditModalOpen, 
    closeProductEditModal, 
    productToEdit, 
    addProduct, 
    updateProduct,
    companySettings
  } = useStore();

  const isEditing = Boolean(productToEdit);

  // Form State
  const [name, setName] = useState('');
  const [hook, setHook] = useState('');
  const [category, setCategory] = useState<Product['category']>('Cocina y Electro');
  const [sku, setSku] = useState('');
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('Nuvoh');
  const [priceUnit, setPriceUnit] = useState<number>(100000);
  const [tier5, setTier5] = useState<number>(98000);
  const [tier10, setTier10] = useState<number>(96000);
  const [tier100, setTier100] = useState<number>(93000);
  const [stock, setStock] = useState<number>(20);
  const [image, setImage] = useState('');
  const [badges, setBadges] = useState<string[]>([]);
  const [newBadgeText, setNewBadgeText] = useState('');
  const [specs, setSpecs] = useState<ProductSpec[]>([]);
  const [featured, setFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'pricing' | 'specs' | 'image'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when opening modal
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setHook(productToEdit.hook);
      setCategory(productToEdit.category);
      setSku(productToEdit.sku);
      setCode(productToEdit.code || '');
      setBrand(productToEdit.brand);
      setPriceUnit(productToEdit.priceUnit);
      setTier5(productToEdit.priceTiers?.tier5 || Math.round(productToEdit.priceUnit * 0.98));
      setTier10(productToEdit.priceTiers?.tier10 || Math.round(productToEdit.priceUnit * 0.96));
      setTier100(productToEdit.priceTiers?.tier100 || Math.round(productToEdit.priceUnit * 0.93));
      setStock(productToEdit.stock);
      setImage(productToEdit.image);
      setBadges(productToEdit.badges || []);
      setSpecs(productToEdit.specs || []);
      setFeatured(Boolean(productToEdit.featured));
      setIsNew(Boolean(productToEdit.isNew));
    } else {
      // Defaults for brand new product
      const randomSkuNum = Math.floor(100 + Math.random() * 900);
      setName('');
      setHook('');
      setCategory('Cocina y Electro');
      setSku(`EH-COC-${randomSkuNum}`);
      setCode('');
      setBrand('Nuvoh');
      setPriceUnit(120000);
      setTier5(117600);
      setTier10(115200);
      setTier100(111600);
      setStock(30);
      setImage(ASSET_IMAGES.horno);
      setBadges(['STOCK INMEDIATO', 'GARANTÍA OFICIAL']);
      setSpecs([
        { label: 'POTENCIA / CAPACIDAD', desc: 'Rendimiento industrial para hogar y comercio', iconName: 'zap' },
        { label: 'MATERIALES', desc: 'Terminación premium de alta durabilidad', iconName: 'layers' },
        { label: 'CONTROL', desc: 'Fácil uso con perillas mecánicas de precisión', iconName: 'clock' },
        { label: 'ACCESORIOS', desc: 'Kit completo incluido listo para usar', iconName: 'check-circle' }
      ]);
      setFeatured(true);
      setIsNew(true);
    }
    setErrorMsg('');
  }, [productToEdit, isProductEditModalOpen]);

  if (!isProductEditModalOpen) return null;

  // Auto-suggest wholesale tiers based on unit price (-2%, -4%, -7%)
  const handleCalculateTiers = () => {
    if (!priceUnit || priceUnit <= 0) return;
    const roundToHundred = (n: number) => Math.round(n / 100) * 100;
    setTier5(roundToHundred(priceUnit * 0.98));
    setTier10(roundToHundred(priceUnit * 0.96));
    setTier100(roundToHundred(priceUnit * 0.93));
  };

  const handleAddBadge = () => {
    const trimmed = newBadgeText.trim().toUpperCase();
    if (trimmed && !badges.includes(trimmed)) {
      setBadges([...badges, trimmed]);
      setNewBadgeText('');
    }
  };

  const handleRemoveBadge = (index: number) => {
    setBadges(badges.filter((_, i) => i !== index));
  };

  const handleAddSpec = () => {
    setSpecs([
      ...specs,
      { label: 'NUEVA ESPECIFICACIÓN', desc: 'Detalle técnico relevante para el cliente', iconName: 'maximize' }
    ]);
  };

  const handleUpdateSpec = (index: number, field: keyof ProductSpec, value: string) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], [field]: value };
    setSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre comercial del producto es obligatorio.');
      setActiveTab('info');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('El código SKU es obligatorio.');
      setActiveTab('info');
      return;
    }
    if (!priceUnit || priceUnit <= 0) {
      setErrorMsg('El precio unitario debe ser mayor a 0.');
      setActiveTab('pricing');
      return;
    }
    if (!image.trim()) {
      setErrorMsg('Debe seleccionar o indicar una imagen para el producto.');
      setActiveTab('image');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const productPayload: Omit<Product, 'id'> = {
        name: name.trim().toUpperCase(),
        hook: hook.trim().toUpperCase() || `${brand.toUpperCase()} CALIDAD SUPERIOR`,
        category,
        sku: sku.trim().toUpperCase(),
        code: code.trim() || undefined,
        brand: brand.trim(),
        priceUnit: Number(priceUnit),
        priceTiers: {
          tier5: Number(tier5) || undefined,
          tier10: Number(tier10) || undefined,
          tier100: Number(tier100) || undefined
        },
        badges: badges.length > 0 ? badges : ['MAYORISTA'],
        specs: specs.length > 0 ? specs : [],
        image: image.trim(),
        stock: Number(stock) || 0,
        featured,
        isNew
      };

      if (isEditing && productToEdit) {
        await updateProduct({
          ...productPayload,
          id: productToEdit.id
        });
      } else {
        await addProduct(productPayload);
      }

      closeProductEditModal();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setErrorMsg(err.message || 'Error al guardar el producto.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/75 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-zinc-900 text-white px-6 py-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black shadow-md shadow-orange-600/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase bg-orange-600/30 text-orange-400 px-2 py-0.5 rounded border border-orange-500/40">
                  {isEditing ? 'MODO EDICIÓN' : 'ALTA DE PRODUCTO'}
                </span>
                <span className="text-xs text-zinc-400">
                  Catálogo Mayorista {companySettings?.companyName || 'NUVOH'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-display mt-0.5 tracking-tight">
                {isEditing ? `Modificar: ${productToEdit?.name}` : 'Agregar Nuevo Producto al Catálogo'}
              </h2>
            </div>
          </div>

          <button
            onClick={closeProductEditModal}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 flex items-center gap-2 overflow-x-auto py-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            <span>Datos Básicos &amp; Categoría</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-orange-500" />
            <span>Precios Mayoristas &amp; Escalas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'image'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
            <span>Imagen &amp; Foto Catálogo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'specs'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'text-zinc-600 hover:bg-zinc-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span>Ficha Técnica 4 Puntos ({specs.length})</span>
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: INFORMACIÓN BÁSICA */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Nombre Comercial Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. HORNO ELÉCTRICO PIONEER HOME 50L"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                  />
                  <span className="text-[11px] text-zinc-600 mt-1 block">
                    Nombre en mayúsculas tal como figura en la lista de precios o catálogo.
                  </span>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Hook Comercial / Subtítulo Catálogo *
                  </label>
                  <input
                    type="text"
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="Ej. 50 LITROS 2000 W HORNO DE MESA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                  />
                  <span className="text-[11px] text-zinc-600 mt-1 block">
                    Frase de impacto que resalta en color naranja en la ficha del catálogo.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Product['category'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-semibold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden bg-white"
                  >
                    {CATALOG_CATEGORIES.filter((c) => c !== 'Todos').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Pioneer, Nuvoh, Kanji, etc."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-sm font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Código SKU Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="EH-COC-071"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm uppercase font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Código EAN / Modelo Secundario
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="7798123456789 (Opcional)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Stock Disponible en Depósito (Unidades) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 font-mono text-sm font-bold focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                  />
                </div>

                {/* Badges Toggles */}
                <div className="flex flex-col justify-end gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl hover:bg-zinc-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded border-zinc-300 focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-zinc-800">Destacar en portada del catálogo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl hover:bg-zinc-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded border-zinc-300 focus:ring-orange-500"
                    />
                    <span className="text-xs font-bold text-zinc-800">Marcar como "Lanzamiento / Nuevo"</span>
                  </label>
                </div>

              </div>

              {/* Badges / Etiquetas destacadas */}
              <div className="pt-3 border-t border-zinc-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Insignias y Etiquetas del Catálogo
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold font-mono border border-orange-200"
                    >
                      {badge}
                      <button
                        type="button"
                        onClick={() => handleRemoveBadge(idx)}
                        className="text-orange-600 hover:text-red-700 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBadge();
                      }
                    }}
                    placeholder="Escribir etiqueta y presionar Agregar (Ej: 2000 W, CONVECCIÓN, 2 AÑOS)"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-300 uppercase font-mono outline-hidden focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBadge}
                    className="px-3 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800"
                  >
                    Agregar
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRECIOS Y ESCALAS MAYORISTAS */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    Cálculo Inteligente de Escalas Mayoristas
                  </h4>
                  <p className="text-xs text-orange-800 mt-0.5">
                    Calcula automáticamente los descuentos mayoristas por volumen recomendados (-2%, -4%, -7%).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCalculateTiers}
                  className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Sugerir Escalas Automáticas</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Unit Price */}
                <div className="bg-zinc-900 text-white rounded-2xl p-4 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-orange-400 mb-1">
                    PRECIO BASE (1 A 4 UNIDADES)
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="100"
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white font-mono text-base font-bold focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-1.5">
                    Precio unitario para compras menores.
                  </span>
                </div>

                {/* Tier 5 */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-700 mb-1">
                    ESCALA DESDE 5 U. (C/U)
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      step="100"
                      value={tier5}
                      onChange={(e) => setTier5(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-zinc-300 font-mono text-base font-bold focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                    {priceUnit > 0 ? `-${Math.round((1 - tier5 / priceUnit) * 100)}% de descuento` : ''}
                  </span>
                </div>

                {/* Tier 10 */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-700 mb-1">
                    ESCALA DESDE 10 U. (C/U)
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      step="100"
                      value={tier10}
                      onChange={(e) => setTier10(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-zinc-300 font-mono text-base font-bold focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                    {priceUnit > 0 ? `-${Math.round((1 - tier10 / priceUnit) * 100)}% de descuento` : ''}
                  </span>
                </div>

                {/* Tier 100 */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-700 mb-1">
                    ESCALA BULTO 100 U. (C/U)
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      step="100"
                      value={tier100}
                      onChange={(e) => setTier100(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-zinc-300 font-mono text-base font-bold focus:border-orange-500 outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-1.5">
                    {priceUnit > 0 ? `-${Math.round((1 - tier100 / priceUnit) * 100)}% de descuento` : ''}
                  </span>
                </div>

              </div>

              {/* Price Table Preview */}
              <div className="bg-white rounded-2xl p-4 border border-zinc-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Vista previa de la tabla en la tarjeta del catálogo:
                </h4>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-orange-600 text-white rounded-xl p-2">
                    <span className="text-[9px] uppercase font-bold block opacity-90">1 A 4 UNIDADES</span>
                    <span className="text-xs font-bold font-mono">{formatCurrency(priceUnit, false)}</span>
                  </div>
                  <div className="bg-zinc-100 rounded-xl p-2 border border-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-600 block">DESDE 5 U.</span>
                    <span className="text-xs font-bold font-mono">{formatCurrency(tier5, false)}</span>
                  </div>
                  <div className="bg-zinc-100 rounded-xl p-2 border border-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-600 block">DESDE 10 U.</span>
                    <span className="text-xs font-bold font-mono">{formatCurrency(tier10, false)}</span>
                  </div>
                  <div className="bg-zinc-100 rounded-xl p-2 border border-zinc-200">
                    <span className="text-[9px] uppercase font-bold text-zinc-600 block">DESDE 100 U.</span>
                    <span className="text-xs font-bold font-mono">{formatCurrency(tier100, false)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: IMAGEN Y FOTO DE CATÁLOGO */}
          {activeTab === 'image' && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  URL Directa de Imagen del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://... o ruta local /src/assets/images/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-hidden"
                />
              </div>

              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  O Seleccionar de la Galería Oficial / Catálogo:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                        image === preset.url
                          ? 'border-orange-600 bg-orange-50/70 ring-2 ring-orange-500/20 shadow-xs'
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <img
                        src={resolveProductImage(preset.url)}
                        alt={preset.label}
                        onError={(e) => handleImageError(e)}
                        className="w-12 h-12 object-contain rounded-lg bg-white p-1 border border-zinc-200 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-zinc-900 block truncate">
                          {preset.label}
                        </span>
                        <span className="text-[10px] text-zinc-600 block">
                          Clic para usar
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Preview Box */}
              {image && (
                <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col items-center">
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                    Vista Previa de la Fotografía:
                  </span>
                  <div className="w-56 h-48 bg-white rounded-xl border border-zinc-200 p-2 flex items-center justify-center overflow-hidden shadow-xs">
                    <img
                      src={resolveProductImage(image, category)}
                      alt="Vista previa"
                      onError={(e) => handleImageError(e, category)}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: FICHA TÉCNICA 4 PUNTOS ESTILO NUVOH */}
          {activeTab === 'specs' && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Ficha Técnica de 4 Puntos Oficial
                  </h4>
                  <p className="text-xs text-zinc-500">
                    Se muestra en círculos naranjas bajo la imagen en la tarjeta del catálogo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSpec}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Punto</span>
                </button>
              </div>

              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    {/* Spec Label */}
                    <div className="w-full sm:w-1/3">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase block mb-0.5">
                        Título / Característica
                      </label>
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) => handleUpdateSpec(index, 'label', e.target.value.toUpperCase())}
                        placeholder="Ej. 50 LITROS"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs font-bold uppercase focus:border-orange-500 outline-hidden"
                      />
                    </div>

                    {/* Spec Description */}
                    <div className="w-full sm:flex-1">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase block mb-0.5">
                        Descripción o Detalle
                      </label>
                      <input
                        type="text"
                        value={spec.desc}
                        onChange={(e) => handleUpdateSpec(index, 'desc', e.target.value)}
                        placeholder="Ej. Entra una fuente grande para familia."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-300 text-xs focus:border-orange-500 outline-hidden"
                      />
                    </div>

                    {/* Icon Select */}
                    <div className="w-full sm:w-36">
                      <label className="text-[10px] font-bold text-zinc-700 uppercase block mb-0.5">
                        Ícono
                      </label>
                      <select
                        value={spec.iconName || 'maximize'}
                        onChange={(e) => handleUpdateSpec(index, 'iconName', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 text-xs bg-white focus:border-orange-500 outline-hidden"
                      >
                        {AVAILABLE_ICONS.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(index)}
                      className="p-2 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-200 transition-colors self-end sm:self-center"
                      title="Eliminar punto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeProductEditModal}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando en Base de Datos...' : isEditing ? 'Guardar Cambios' : 'Publicar Nuevo Producto'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
