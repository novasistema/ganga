import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  Check,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  FolderTree,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StoreCategory } from '../types';
import confetti from 'canvas-confetti';

const POPULAR_EMOJIS = [
  '📱', '🎧', '💡', '🍳', '🔧', '🎒', '💄', '🚗', '🎮', '⚽',
  '🔥', '📦', '💎', '🧸', '👕', '🧰', '⚡', '⌚', '🏠', '🔌',
  '🚲', '☕', '🎁', '📸', '👟', '🧴', '🛠️', '💻', '🏕️', '✨'
];

interface CategoryManagerProps {
  onFilterInventory?: (categoryName: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onFilterInventory }) => {
  const { categories, addCategory, updateCategory, deleteCategory, products } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingCat, setEditingCat] = useState<StoreCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('📦');
  const [formDesc, setFormDesc] = useState('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Compute products per category
  const productCountByCat = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  const filteredCategories = React.useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const q = searchTerm.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchTerm]);

  const handleOpenCreate = () => {
    setFormName('');
    setFormIcon('📦');
    setFormDesc('');
    setIsCreating(true);
    setEditingCat(null);
  };

  const handleOpenEdit = (cat: StoreCategory) => {
    setFormName(cat.name);
    setFormIcon(cat.icon || '📦');
    setFormDesc(cat.description || '');
    setEditingCat(cat);
    setIsCreating(false);
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      showNotification('error', 'Por favor ingresa un nombre para la categoría.');
      return;
    }

    try {
      if (isCreating) {
        // Check duplicate
        if (categories.some((c) => c.name.toLowerCase() === formName.trim().toLowerCase())) {
          showNotification('error', 'Ya existe una categoría con ese nombre.');
          return;
        }
        await addCategory({
          name: formName.trim(),
          icon: formIcon,
          description: formDesc.trim()
        });
        confetti({ particleCount: 40, spread: 45 });
        showNotification('success', `Categoría "${formName.trim()}" creada con éxito.`);
      } else if (editingCat) {
        await updateCategory(editingCat.id, {
          name: formName.trim(),
          icon: formIcon,
          description: formDesc.trim()
        });
        showNotification('success', `Categoría "${formName.trim()}" actualizada.`);
      }

      setIsCreating(false);
      setEditingCat(null);
    } catch (err: any) {
      showNotification('error', 'Error al guardar categoría: ' + err.message);
    }
  };

  const handleDeleteCategory = async (cat: StoreCategory) => {
    const count = productCountByCat[cat.name] || 0;
    if (
      !confirm(
        `¿Eliminar la categoría "${cat.name}"?${
          count > 0 ? `\nAtención: Tiene ${count} producto(s) asignado(s).` : ''
        }`
      )
    ) {
      return;
    }

    try {
      await deleteCategory(cat.id);
      showNotification('success', `Categoría "${cat.name}" eliminada.`);
    } catch (err: any) {
      showNotification('error', 'Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Manager Header */}
      <div className="bg-slate-950 p-5 sm:p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-2">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span>ORGANIZACIÓN & TAXONOMÍA DE LA TIENDA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Gestor de Categorías & Agrupación
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Crea categorías personalizadas, asigna emojis representativos y agrupa tus productos. Cuando importas productos desde enlaces web o PDFs, las categorías se detectan y crean automáticamente.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
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

      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categorías..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>
            Total: <strong className="text-white font-mono">{categories.length}</strong> categorías
          </span>
          <span>
            Artículos clasificados: <strong className="text-emerald-400 font-mono">{products.length}</strong>
          </span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const count = productCountByCat[cat.name] || 0;
          return (
            <div
              key={cat.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition-all flex flex-col justify-between gap-3 shadow-sm group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl p-2 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                  {cat.icon || '📦'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-white text-sm truncate">
                      {cat.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        count > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {count} {count === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {count > 0 && onFilterInventory ? (
                  <button
                    type="button"
                    onClick={() => onFilterInventory(cat.name)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Ver en Inventario</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500">Sin productos aún</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    title="Editar categoría"
                    className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    title="Eliminar categoría"
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE OR EDIT CATEGORY                              */}
      {/* ============================================================ */}
      {(isCreating || editingCat) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                  <Tag className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {isCreating ? 'Crear Nueva Categoría' : `Editar Categoría: ${editingCat?.name}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Se mostrará en la barra de categorías de la tienda y agrupará tus productos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCat(null);
                }}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Herramientas & Ferretería, Hogar, Tecnología..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-bold"
                  autoFocus
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Icono / Emoji Representativo
                </label>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl p-3 bg-slate-950 rounded-2xl border border-slate-700 text-center w-16 h-16 flex items-center justify-center shrink-0">
                    {formIcon}
                  </div>
                  <input
                    type="text"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="Emoji o icono"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-10 gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-28 overflow-y-auto">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`text-lg p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ${
                        formIcon === emoji ? 'bg-indigo-600/40 ring-1 ring-indigo-500' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Breve descripción de los artículos de esta categoría..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Live Preview Pill */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">
                  Vista Previa del Botón en Tienda:
                </span>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-white text-xs font-bold shadow-md">
                  <span className="text-base">{formIcon || '📦'}</span>
                  <span>{formName || 'Nombre Categoría'}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-black">
                    0
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCat(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveCategory}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isCreating ? 'Guardar Categoría' : 'Actualizar Categoría'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
