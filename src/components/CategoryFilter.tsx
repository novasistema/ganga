import React from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Layers, ArrowUpDown } from 'lucide-react';

interface CategoryFilterProps {
  sortBy: string;
  setSortBy: (sort: string) => void;
  filteredCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  sortBy,
  setSortBy,
  filteredCount
}) => {
  const { products, activeCategory, setActiveCategory, searchQuery } = useStore();

  // Dynamically extract categories from current catalog
  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];

  return (
    <div id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catálogo Completo Dropshipping</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Artículos Disponibles'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {filteredCount} {filteredCount === 1 ? 'producto encontrado' : 'productos listos para envío inmediato'}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium text-gray-500">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-semibold text-gray-800 focus:outline-hidden cursor-pointer pl-1"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="stock-desc">Mayor Stock Disponible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        {categories.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'bg-gray-900 text-white shadow-md shadow-gray-300 scale-102'
                  : 'bg-white text-gray-600 border border-gray-200/90 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {category === 'Todos' && <Layers className="w-3.5 h-3.5 inline-block mr-1.5 opacity-70" />}
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};
