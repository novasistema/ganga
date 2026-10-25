import React, { useState } from 'react';
import {
  Flame,
  Zap,
  CreditCard,
  ShieldCheck,
  Truck,
  Tag,
  Gift,
  Clock,
  Sparkles,
  Award,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Eye,
  Check,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layers,
  Image as ImageIcon,
  Palette,
  Star,
  Search,
  X,
  EyeOff
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { HeroBannerItem, HeroBannerFeature, Product } from '../types';
import confetti from 'canvas-confetti';
import { resolveImageUrl, DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';

const GRADIENT_PRESETS = [
  {
    id: 'indigo-night',
    name: 'Índigo Noche (Default)',
    value: 'from-slate-900 via-indigo-950 to-slate-900',
    accent: 'bg-indigo-600'
  },
  {
    id: 'crimson-fire',
    name: 'Fuego & Rubí',
    value: 'from-slate-950 via-rose-950/80 to-slate-900',
    accent: 'bg-rose-600'
  },
  {
    id: 'emerald-cyber',
    name: 'Esmeralda Neón',
    value: 'from-slate-950 via-emerald-950/80 to-slate-900',
    accent: 'bg-emerald-600'
  },
  {
    id: 'royal-blue',
    name: 'Azul Imperial',
    value: 'from-slate-950 via-blue-950/80 to-slate-900',
    accent: 'bg-blue-600'
  },
  {
    id: 'amber-sunset',
    name: 'Ámbar & Oro',
    value: 'from-slate-950 via-amber-950/70 to-slate-900',
    accent: 'bg-amber-600'
  },
  {
    id: 'violet-cyberpunk',
    name: 'Cyberpunk Violeta',
    value: 'from-slate-950 via-purple-950/80 to-slate-900',
    accent: 'bg-purple-600'
  }
];

const FEATURE_ICONS: { id: HeroBannerFeature['icon']; label: string }[] = [
  { id: 'zap', label: 'Rayo (Velocidad)' },
  { id: 'credit-card', label: 'Tarjeta (Pagos/Cuotas)' },
  { id: 'shield', label: 'Escudo (Garantía)' },
  { id: 'flame', label: 'Fuego (Oferta/Popular)' },
  { id: 'truck', label: 'Camión (Envíos)' },
  { id: 'tag', label: 'Etiqueta (Descuento)' },
  { id: 'gift', label: 'Regalo (Promoción)' },
  { id: 'sparkles', label: 'Destello (Calidad)' },
  { id: 'clock', label: 'Reloj (Tiempo)' },
  { id: 'badge', label: 'Insignia (Oficial)' }
];

export const BannerManager: React.FC = () => {
  const { banners, saveBanners, categories, products, settings, saveSettings } = useStore();

  const [editingBanner, setEditingBanner] = useState<HeroBannerItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'editor' | 'preview'>('editor');
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('Todas');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleActive = async (bannerId: string) => {
    const updated = banners.map((b) => (b.id === bannerId ? { ...b, active: !b.active } : b));
    await saveBanners(updated);
    showNotification('success', 'Estado del banner actualizado');
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newBanners = [...banners];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBanners.length) return;

    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    await saveBanners(newBanners);
    showNotification('success', 'Orden de banners actualizado');
  };

  const handleDuplicate = async (banner: HeroBannerItem) => {
    const duplicate: HeroBannerItem = {
      ...banner,
      id: `banner-${Date.now()}`,
      title: `${banner.title} (Copia)`,
      active: true,
      sortOrder: banners.length + 1
    };
    const updated = [...banners, duplicate];
    await saveBanners(updated);
    confetti({ particleCount: 40, spread: 45 });
    showNotification('success', 'Banner duplicado con éxito. Ahora puedes editarlo.');
  };

  const handleDelete = async (bannerId: string) => {
    if (banners.length <= 1) {
      showNotification('error', 'Debes conservar al menos 1 banner en la tienda.');
      return;
    }
    if (!confirm('¿Estás seguro de que deseas eliminar este banner?')) return;
    const updated = banners.filter((b) => b.id !== bannerId);
    await saveBanners(updated);
    showNotification('success', 'Banner eliminado.');
  };

  const handleCreateNew = () => {
    const newBanner: HeroBannerItem = {
      id: `banner-${Date.now()}`,
      badgeText: '🔥 NUEVA PROMOCIÓN EXCLUSIVA • ENVÍO GRATIS',
      badgeIcon: 'flame',
      title: 'Grandes Oportunidades con Descuento Mayorista',
      titleHighlight: 'Descuento Mayorista',
      description: 'Encuentra las mejores ofertas con despacho rápido a todo el país y financiación en cuotas sin interés.',
      showCountdown: true,
      countdownHours: 12,
      countdownMinutes: 0,
      countdownLabel: 'Promoción válida por:',
      primaryButtonText: 'Ver Productos en Oferta',
      primaryButtonAction: 'scroll_catalog',
      primaryButtonTarget: '#catalog-section',
      secondaryButtonText: 'Ver Categorías',
      secondaryButtonCategory: 'Todos',
      backgroundGradient: 'from-slate-900 via-indigo-950 to-slate-900',
      active: true,
      featuredProductIds: products.slice(0, 2).map((p) => p.id), // Precargar con los primeros 2 de catálogo
      features: [
        { id: 'f1', icon: 'truck', title: 'Despacho Rápido', description: 'Envíos asegurados directo a domicilio.' },
        { id: 'f2', icon: 'credit-card', title: 'Hasta 3 Cuotas', description: 'Facilidades de pago y transferencia.' },
        { id: 'f3', icon: 'shield', title: 'Garantía Total', description: 'Cambio inmediato en 30 días.' },
        { id: 'f4', icon: 'zap', title: 'Stock Confirmado', description: 'Inventario listo para despacho.' }
      ]
    };
    setEditingBanner(newBanner);
  };

  const handleSaveEditing = async () => {
    if (!editingBanner) return;
    if (!editingBanner.title.trim()) {
      showNotification('error', 'El título del banner no puede estar vacío.');
      return;
    }

    const exists = banners.some((b) => b.id === editingBanner.id);
    let updated: HeroBannerItem[];
    if (exists) {
      updated = banners.map((b) => (b.id === editingBanner.id ? editingBanner : b));
    } else {
      updated = [...banners, editingBanner];
    }

    await saveBanners(updated);
    setEditingBanner(null);
    confetti({ particleCount: 50, spread: 50 });
    showNotification('success', '¡Banner guardado y actualizado en la tienda en tiempo real!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-950 p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
            <span>PORTADA & MARKETING DE LA TIENDA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Banners de Portada & Promociones
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Edita el banner principal o crea múltiples banners en carrusel. Configura el texto destacado, cuenta regresiva, botones de llamado a la acción y las 4 tarjetas de beneficios.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Banner</span>
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/80 border-rose-700 text-rose-200'
          }`}
        >
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* Global Quick Switch for Benefit Cards */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-3 rounded-2xl border shrink-0 ${
              settings.hideBannerFeatures
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            {settings.hideBannerFeatures ? <EyeOff className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-white">
                Tarjetas de Beneficios en Banners
              </h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  settings.hideBannerFeatures
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {settings.hideBannerFeatures ? '🔴 DESACTIVADAS GLOBALMENTE' : '🟢 ACTIVADAS'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Recuadros de "Despacho Rápido", "Compra con Confianza", "Garantía Total" y "Stock Confirmado". Puedes desactivarlas en toda la tienda con 1 clic o configurarlas por cada banner.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            const newHide = !settings.hideBannerFeatures;
            await saveSettings({ ...settings, hideBannerFeatures: newHide });
            showNotification(
              'success',
              newHide
                ? 'Tarjetas de beneficios desactivadas en toda la tienda'
                : 'Tarjetas de beneficios activadas en la tienda'
            );
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg ${
            settings.hideBannerFeatures
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
          }`}
        >
          {settings.hideBannerFeatures ? (
            <>
              <Eye className="w-4 h-4" />
              <span>Activar Tarjetas en la Tienda</span>
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Desactivar Tarjetas de Beneficios</span>
            </>
          )}
        </button>
      </div>

      {/* Banners List Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Banners Configurados ({banners.length})
          </span>
          <span className="text-xs text-slate-500">
            {banners.filter((b) => b.active).length} activos en carrusel
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {banners.map((banner, idx) => {
            return (
              <div
                key={banner.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  banner.active
                    ? 'bg-slate-900/90 border-slate-700 shadow-lg'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                {/* Banner Info */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                      #{idx + 1}
                    </span>

                    {/* Active status pill */}
                    <button
                      onClick={() => handleToggleActive(banner.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
                        banner.active
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {banner.active ? '● Activo en Tienda' : '○ Desactivado'}
                    </button>

                    {/* Badge text */}
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 truncate max-w-xs">
                      {banner.badgeText}
                    </span>

                    {banner.showCountdown && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md font-mono border border-amber-500/20">
                        ⏱️ Cronómetro ({banner.countdownHours || 8}h)
                      </span>
                    )}

                    {banner.featuredProductIds && banner.featuredProductIds.length > 0 && (
                      <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold border border-amber-500/30 flex items-center gap-1">
                        <span>⭐</span>
                        <span>{banner.featuredProductIds.length} {banner.featuredProductIds.length === 1 ? 'destacado' : 'destacados'}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {banner.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 max-w-3xl">
                    {banner.description}
                  </p>

                  {/* Actions & Button targets preview */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>
                      Botón Principal:{' '}
                      <strong className="text-amber-400">{banner.primaryButtonText}</strong>
                    </span>
                    {banner.secondaryButtonText && (
                      <span>
                        Botón Secundario:{' '}
                        <strong className="text-slate-300">{banner.secondaryButtonText}</strong> (
                        {banner.secondaryButtonCategory || 'Todos'})
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <span>Tarjetas:</span>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newShow = banner.showFeatures === false ? true : false;
                          const updated = banners.map((b) =>
                            b.id === banner.id ? { ...b, showFeatures: newShow } : b
                          );
                          await saveBanners(updated);
                          showNotification(
                            'success',
                            newShow
                              ? 'Tarjetas de beneficios activadas para este banner'
                              : 'Tarjetas de beneficios desactivadas para este banner'
                          );
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                          banner.showFeatures === false
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                        title="Clic para activar o desactivar las 4 tarjetas de beneficios en este banner"
                      >
                        {banner.showFeatures === false ? (
                          <>
                            <EyeOff className="w-3 h-3 text-rose-400" />
                            <span>Desactivadas</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-emerald-400" />
                            <span>Activadas ({banner.features?.length || 4})</span>
                          </>
                        )}
                      </button>
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      title="Mover arriba"
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg cursor-pointer transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === banners.length - 1}
                      title="Mover abajo"
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 rounded-lg cursor-pointer transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(banner)}
                    title="Duplicar este banner"
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => setEditingBanner({ ...banner })}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Banner</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(banner.id)}
                    title="Eliminar banner"
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer border border-rose-900/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* BANNER MODAL EDITOR                                         */}
      {/* ============================================================ */}
      {editingBanner && (
        <div
          ref={(node) => {
            if (node) node.scrollTop = 0;
          }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-4 sm:pt-8 animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-5 shadow-2xl text-slate-200 max-h-[92vh] flex flex-col mb-12">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Edit3 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base sm:text-lg">
                    {banners.some((b) => b.id === editingBanner.id) ? 'Editar Banner de Portada' : 'Crear Nuevo Banner'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Personaliza textos, enlaces, cronómetro y tarjetas para impactar a tus compradores.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Modal Body / Tabs: Editor Form or Live Preview */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {/* Form Fields */}
              <div className="space-y-4">
                {/* 1. Header & Badge */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      1. Etiqueta Superior / Oferta Flash
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                      <input
                        type="checkbox"
                        checked={editingBanner.active}
                        onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.checked })}
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 cursor-pointer"
                      />
                      <span>Banner Activo en Portada</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Icono del Badge</label>
                      <select
                        value={editingBanner.badgeIcon || 'flame'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, badgeIcon: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white cursor-pointer"
                      >
                        <option value="flame">🔥 Fuego (Ofertas Flash)</option>
                        <option value="zap">⚡ Rayo (Liquidación / Veloz)</option>
                        <option value="sparkles">✨ Destellos (Novedades)</option>
                        <option value="tag">🏷️ Etiqueta (Descuento Mayorista)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-400 block mb-1">Texto del Badge</label>
                      <input
                        type="text"
                        value={editingBanner.badgeText}
                        onChange={(e) => setEditingBanner({ ...editingBanner, badgeText: e.target.value })}
                        placeholder="Ej: OFERTAS FLASH DE TEMPORADA • HASTA 50% OFF"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Main Title & Description */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                    2. Títulos y Mensaje Principal
                  </span>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Título Principal</label>
                    <input
                      type="text"
                      value={editingBanner.title}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      placeholder="Ej: Los Productos en Tendencia con Entrega Directa a tu Hogar"
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Palabra / Frase a Destacar en Color con Gradiente
                    </label>
                    <input
                      type="text"
                      value={editingBanner.titleHighlight || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, titleHighlight: e.target.value })}
                      placeholder="Ej: Entrega Directa"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-amber-300 font-bold"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Esta palabra dentro del título se pintará con un degradado llamativo amarillo/rosa/índigo.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Descripción / Subtítulo</label>
                    <textarea
                      rows={2}
                      value={editingBanner.description}
                      onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                      placeholder="Ej: Descubre artículos importados exclusivos de alta demanda, con garantía oficial..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                {/* 3. Countdown Timer */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      3. Reloj de Liquidación / Cuenta Regresiva
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                      <input
                        type="checkbox"
                        checked={editingBanner.showCountdown}
                        onChange={(e) =>
                          setEditingBanner({ ...editingBanner, showCountdown: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 cursor-pointer"
                      />
                      <span>Mostrar Reloj Regresivo</span>
                    </label>
                  </div>

                  {editingBanner.showCountdown && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Texto del Reloj</label>
                        <input
                          type="text"
                          value={editingBanner.countdownLabel || 'La liquidación finaliza en:'}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, countdownLabel: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Horas Iniciales</label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={editingBanner.countdownHours || 8}
                          onChange={(e) =>
                            setEditingBanner({
                              ...editingBanner,
                              countdownHours: Number(e.target.value) || 8
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Action Buttons */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                    4. Botones de Acción
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary Button */}
                    <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-amber-400 block">Botón Principal (Amarillo)</span>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Texto del Botón</label>
                        <input
                          type="text"
                          value={editingBanner.primaryButtonText}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, primaryButtonText: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Acción al Clic</label>
                        <select
                          value={editingBanner.primaryButtonAction || 'scroll_catalog'}
                          onChange={(e) =>
                            setEditingBanner({
                              ...editingBanner,
                              primaryButtonAction: e.target.value as any
                            })
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="scroll_catalog">Desplazar hacia el catálogo</option>
                          <option value="category">Filtrar por Categoría específica</option>
                        </select>
                      </div>

                      {editingBanner.primaryButtonAction === 'category' && (
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Categoría Destino</label>
                          <select
                            value={editingBanner.primaryButtonTarget || ''}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, primaryButtonTarget: e.target.value })
                            }
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                          >
                            <option value="">Selecciona categoría</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.icon} {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Secondary Button */}
                    <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-300 block">Botón Secundario (Oscuro)</span>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Texto del Botón</label>
                        <input
                          type="text"
                          value={editingBanner.secondaryButtonText || ''}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, secondaryButtonText: e.target.value })
                          }
                          placeholder="Ej: Ver Tecnología & Gadgets"
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Categoría a Filtrar</label>
                        <select
                          value={editingBanner.secondaryButtonCategory || 'Todos'}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, secondaryButtonCategory: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                        >
                          <option value="Todos">Todas las categorías</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Background Style */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                    5. Estilo y Fondo del Banner
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {GRADIENT_PRESETS.map((p) => {
                      const isSelected = editingBanner.backgroundGradient === p.value;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, backgroundGradient: p.value })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${p.accent} shrink-0`} />
                          <span className="text-xs font-bold truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Four Features Cards */}
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                          6. Cuatro Tarjetas de Beneficios Laterales
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            editingBanner.showFeatures === false
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {editingBanner.showFeatures === false ? 'DESACTIVADAS' : 'ACTIVADAS'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tarjetas de Despacho Rápido, Compra con Confianza, Garantía Total y Stock Confirmado.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingBanner({
                          ...editingBanner,
                          showFeatures: editingBanner.showFeatures === false ? true : false
                        })
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                        editingBanner.showFeatures === false
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      {editingBanner.showFeatures === false ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                          <span>Desactivadas (Clic para Activar)</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Activadas (Clic para Desactivar)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {editingBanner.showFeatures === false ? (
                    <div className="p-4 bg-slate-900/80 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-rose-300">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                          <EyeOff className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <span className="font-bold text-white block">Tarjetas de beneficios desactivadas</span>
                          <span className="text-[11px] text-slate-400">
                            Este banner se mostrará limpio sin los 4 recuadros laterales de beneficios.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingBanner({ ...editingBanner, showFeatures: true })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-md"
                      >
                        Activar Tarjetas
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(editingBanner.features || []).map((feat, fIdx) => (
                        <div key={feat.id || fIdx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase">
                              Tarjeta #{fIdx + 1}
                            </span>
                            <select
                              value={feat.icon}
                              onChange={(e) => {
                                const newFeats = [...(editingBanner.features || [])];
                                newFeats[fIdx] = { ...newFeats[fIdx], icon: e.target.value as any };
                                setEditingBanner({ ...editingBanner, features: newFeats });
                              }}
                              className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded cursor-pointer"
                            >
                              {FEATURE_ICONS.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={feat.title}
                              onChange={(e) => {
                                const newFeats = [...(editingBanner.features || [])];
                                newFeats[fIdx] = { ...newFeats[fIdx], title: e.target.value };
                                setEditingBanner({ ...editingBanner, features: newFeats });
                              }}
                              placeholder="Título (ej: Despacho Veloz)"
                              className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-white"
                            />
                          </div>

                          <div>
                            <input
                              type="text"
                              value={feat.description}
                              onChange={(e) => {
                                const newFeats = [...(editingBanner.features || [])];
                                newFeats[fIdx] = { ...newFeats[fIdx], description: e.target.value };
                                setEditingBanner({ ...editingBanner, features: newFeats });
                              }}
                              placeholder="Descripción (ej: Envíos rastreados directo a la puerta)"
                              className="w-full px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-300"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7. Featured Products Attached to this Banner */}
                <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-4 shadow-lg shadow-amber-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          7. Artículos Destacados Vinculados a este Banner
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Selecciona productos del inventario para exhibirlos como destacados en la portada con foto, precio en pesos y compra rápida.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-xs font-bold">
                        {editingBanner.featuredProductIds?.length || 0} seleccionados
                      </span>
                      {(editingBanner.featuredProductIds?.length || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, featuredProductIds: [] })}
                          className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                        >
                          Limpiar todos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected Products Preview Cards */}
                  {editingBanner.featuredProductIds && editingBanner.featuredProductIds.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Orden de visualización en el banner (los primeros se muestran destacados):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {editingBanner.featuredProductIds.map((prodId, pIdx) => {
                          const prod = products.find((p) => p.id === prodId);
                          if (!prod) return null;
                          return (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between p-2.5 bg-slate-900 border border-amber-500/40 rounded-xl gap-2 shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-amber-400/40">
                                  #{pIdx + 1}
                                </span>
                                <img
                                  src={resolveImageUrl(prod.imageUrl)}
                                  alt={prod.title}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-700"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_PLACEHOLDER;
                                  }}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate max-w-[130px]" title={prod.title}>
                                    {prod.title}
                                  </p>
                                  <p className="text-[11px] font-mono text-emerald-400 font-bold">
                                    $ {prod.finalPrice.toLocaleString('es-AR')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...(editingBanner.featuredProductIds || [])];
                                    if (pIdx > 0) {
                                      const tmp = list[pIdx];
                                      list[pIdx] = list[pIdx - 1];
                                      list[pIdx - 1] = tmp;
                                      setEditingBanner({ ...editingBanner, featuredProductIds: list });
                                    }
                                  }}
                                  disabled={pIdx === 0}
                                  title="Mover a la izquierda"
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowUp className="w-3 h-3 sm:hidden" />
                                  <ArrowRight className="w-3 h-3 hidden sm:block rotate-180" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = [...(editingBanner.featuredProductIds || [])];
                                    if (pIdx < list.length - 1) {
                                      const tmp = list[pIdx];
                                      list[pIdx] = list[pIdx + 1];
                                      list[pIdx + 1] = tmp;
                                      setEditingBanner({ ...editingBanner, featuredProductIds: list });
                                    }
                                  }}
                                  disabled={pIdx === ((editingBanner.featuredProductIds?.length || 0) - 1)}
                                  title="Mover a la derecha"
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                >
                                  <ArrowDown className="w-3 h-3 sm:hidden" />
                                  <ArrowRight className="w-3 h-3 hidden sm:block" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const list = (editingBanner.featuredProductIds || []).filter((id) => id !== prod.id);
                                    setEditingBanner({ ...editingBanner, featuredProductIds: list });
                                  }}
                                  title="Quitar de destacados"
                                  className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                      Ningún producto seleccionado. Haz clic en "+ Agregar" en los productos abajo.
                    </div>
                  )}

                  {/* Search and Category Filter for Available Products */}
                  <div className="space-y-2 pt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative flex-1 w-full">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Buscar producto por nombre..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                        />
                      </div>

                      <select
                        value={productCatFilter}
                        onChange={(e) => setProductCatFilter(e.target.value)}
                        className="w-full sm:w-48 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 cursor-pointer"
                      >
                        <option value="Todas">Todas las categorías</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.icon || '🏷️'} {c.name}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const top4 = products.slice(0, 4).map((p) => p.id);
                          setEditingBanner({ ...editingBanner, featuredProductIds: top4 });
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer transition-colors"
                      >
                        ⚡ Top 4 Productos
                      </button>
                    </div>

                    {/* Products Grid to Choose From */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-slate-800/80 p-2 bg-slate-900/30">
                      {products
                        .filter((p) => {
                          const matchesQuery = !productSearch || p.title.toLowerCase().includes(productSearch.toLowerCase());
                          const matchesCat = productCatFilter === 'Todas' || p.category.toLowerCase() === productCatFilter.toLowerCase();
                          return matchesQuery && matchesCat;
                        })
                        .map((prod) => {
                          const isFeatured = (editingBanner.featuredProductIds || []).includes(prod.id);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => {
                                const current = editingBanner.featuredProductIds || [];
                                const updated = isFeatured
                                  ? current.filter((id) => id !== prod.id)
                                  : [...current, prod.id];
                                setEditingBanner({ ...editingBanner, featuredProductIds: updated });
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                                isFeatured
                                  ? 'bg-amber-500/15 border-amber-500/60 shadow-xs'
                                  : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isFeatured}
                                  onChange={() => {}} // handled by parent onClick
                                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 cursor-pointer"
                                />
                                <img
                                  src={resolveImageUrl(prod.imageUrl)}
                                  alt={prod.title}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-700"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_PLACEHOLDER;
                                  }}
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-white truncate max-w-sm">
                                    {prod.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                      {prod.category}
                                    </span>
                                    <span>Stock: {prod.stock}</span>
                                    {prod.supplierName && (
                                      <span className="text-indigo-400 truncate max-w-[100px]">
                                        📦 {prod.supplierName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-emerald-400 font-bold text-xs">
                                  $ {prod.finalPrice.toLocaleString('es-AR')}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
                                    isFeatured
                                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  }`}
                                >
                                  {isFeatured ? '✓ Destacado' : '+ Agregar'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEditingBanner(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveEditing}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Publicar en Tienda</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
