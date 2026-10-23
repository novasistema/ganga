import React from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Layers, ArrowUpDown, LayoutGrid, FolderTree, Plus, Tag } from 'lucide-react';

interface CategoryFilterProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  filteredCount: number;
  viewMode: 'grid' | 'grouped';
  setViewMode: (mode: 'grid' | 'grouped') => void;
  onManageCategories?: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  sortBy,
  setSortBy,
  filteredCount,
  viewMode,
  setViewMode,
  onManageCategories
}) => {
  const { products, activeCategory, setActiveCategory, searchQuery, categories } = useStore();
  const { isAdmin } = useAuth();

  // Compute product count per category
  const productCountByCat = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      const cat = p.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Combine categories list ensuring unique and consistent ordering
  const displayCategories = React.useMemo(() => {
    const list = [{ id: 'all', name: 'Todos', icon: '✨' }];
    for (const c of categories) {
      if (c.name.toLowerCase() !== 'todos') {
        list.push({
          id: c.id,
          name: c.name,
          icon: c.icon || '🏷️'
        });
      }
    }
    return list;
  }, [categories]);

  return (
    <div id="catalog-section" className="max-w-[1760px] w-full mx-auto px-4 sm:px-8 xl:px-12 pt-8 pb-3">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catálogo Completo & Categorías</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Artículos Disponibles'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {filteredCount} {filteredCount === 1 ? 'artículo listo' : 'artículos listos para despacho inmediato'}
            {activeCategory !== 'Todos' && (
              <span className="ml-1 font-semibold text-indigo-600">
                en categoría <strong className="underline">{activeCategory}</strong>
              </span>
            )}
          </p>
        </div>

        {/* View mode toggle & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula estándar"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cuadrícula</span>
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              title="Vista agrupada por categorías con títulos de sección"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
              <span>Agrupar por Categorías</span>
            </button>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-500 hidden sm:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 focus:outline-hidden cursor-pointer pl-1 text-xs"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="stock-desc">Mayor Stock Disponible</option>
            </select>
          </div>

          {/* Admin category manager link */}
          {isAdmin && onManageCategories && (
            <button
              onClick={onManageCategories}
              title="Administrar o crear categorías en el panel"
              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Categorías</span>
            </button>
          )}
        </div>
      </div>

      {/* Dynamic Categories Scrollbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {displayCategories.map((cat) => {
          const isActive = activeCategory === cat.name;
          const count = cat.name === 'Todos' ? products.length : (productCountByCat[cat.name] || 0);

          return (
            <button
              key={cat.id || cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-300 scale-102 ring-2 ring-indigo-500'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-2xs'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-black ${
                  isActive ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
