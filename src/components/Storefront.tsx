import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Search, ShoppingCart, Star, Shield, Zap, Sparkles, SlidersHorizontal, Check, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface StorefrontProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const activeProducts = products.filter(product => product.active !== false);
  const categories = ['todos', ...Array.from(new Set(activeProducts.map(p => p.category)))];

  const filteredProducts = activeProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const [bannerIndex, setBannerIndex] = useState(0);
  const featuredProducts = activeProducts.length > 0 ? activeProducts : [];

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % featuredProducts.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

  const currentBannerProduct = featuredProducts[bannerIndex] || null;

  return (
    <div className="space-y-12 pb-20">
      
      {/* Hero Banner with Dynamic Catalog Product Showcase */}
      <div className="relative overflow-hidden glass-card rounded-[3rem] p-8 sm:p-12 border border-slate-200/80 shadow-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Facturación Automatizada & Stock en Vivo
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Tecnología, Bazar & <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Importados</span> de Alta Gama
            </h1>
            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-xl">
              Catálogo exclusivo con cotización en Pesos (ARS), importación directa optimizada y selección de artículos destacados listos para tu tienda.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <a
                href="#catalogo"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Ver Catálogo Completo
              </a>
            </div>
          </div>

          {/* Dynamic Catalog Product Banner Showcase */}
          <div className="lg:col-span-5 flex justify-center">
            {currentBannerProduct ? (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative group animate-fadeIn">
                <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow">
                  DESTACADO EN VIVO
                </div>
                <div className="h-56 bg-black/40 rounded-2xl overflow-hidden flex items-center justify-center p-4 relative mb-4">
                  <img
                    src={currentBannerProduct.imageUrl}
                    alt={currentBannerProduct.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                    {currentBannerProduct.category}
                  </span>
                  <h3 className="text-sm font-bold text-white line-clamp-1">{currentBannerProduct.title}</h3>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-black font-mono text-emerald-400">
                      $ {currentBannerProduct.finalPriceARS.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => onAddToCart(currentBannerProduct)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase rounded-xl transition shadow cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Banner Controls */}
                {featuredProducts.length > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10 text-xs text-slate-400">
                    <span>Artículo {bannerIndex + 1} de {featuredProducts.length}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setBannerIndex(prev => (prev - 1 + featuredProducts.length) % featuredProducts.length)}
                        className="p-1.5 bg-black/40 hover:bg-black/70 rounded-lg text-white transition cursor-pointer"
                        title="Anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setBannerIndex(prev => (prev + 1) % featuredProducts.length)}
                        className="p-1.5 bg-black/40 hover:bg-black/70 rounded-lg text-white transition cursor-pointer"
                        title="Siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center text-slate-300 text-xs">
                Agrega productos al inventario para mostrarlos en el banner destacado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search & Categories Bar */}
      <div id="catalogo" className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-200/80 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Buscador de Productos</h2>
            <p className="text-xs text-slate-500 font-medium">Encuentra rápidamente artículos por nombre, código SKU o categoría en stock.</p>
          </div>

          {/* Prominent Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-5 top-4 w-6 h-6 text-purple-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="¿Qué producto estás buscando hoy? (Ej. Carpa, Conservadora, Herramienta...)"
              className="w-full bg-slate-50 border-2 border-purple-500/40 rounded-2xl pl-14 pr-6 py-4 text-base text-slate-900 font-bold focus:outline-none focus:border-purple-600 transition shadow-lg placeholder:text-slate-400 placeholder:font-normal"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-4 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-200 px-3 py-2 rounded-xl"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Categories Pill Bar */}
          <div className="flex overflow-x-auto justify-center gap-2 pt-2 pb-1 no-scrollbar flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col justify-between p-4"
            >
              <div className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-4">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
                  CALIENTE
                </div>
                {product.stock <= product.minStock && product.stock > 0 && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white font-black px-2 py-0.5 rounded-full text-[9px] uppercase">
                    Stock Bajo
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs">
                    {product.stock > 0 ? (
                      <span className="text-purple-700 font-bold flex items-center gap-1">
                        ✓ En stock
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold">Agotado</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-slate-900 font-mono">
                      $ {product.finalPriceARS.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detalle
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock <= 0}
                      className="py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" /> Añadir Al Carrito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-y-auto">
          <div className="glass-card rounded-[2.5rem] max-w-2xl w-full p-8 text-white relative shadow-2xl border border-white/20 glow-indigo my-8">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
              <div className="h-72 bg-black/50 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-white/10">
                <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-violet-400">{selectedProduct.category}</span>
                  <h2 className="text-2xl font-black mt-1">{selectedProduct.title}</h2>
                  <p className="text-xs font-mono text-slate-400 mt-1">SKU: {selectedProduct.sku}</p>
                </div>
                <div className="bg-[#121624] p-4 rounded-2xl border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Precio Final ARS</span>
                  <p className="text-2xl font-black font-mono text-emerald-400">${selectedProduct.finalPriceARS.toLocaleString('es-AR')} ARS</p>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  Producto de alta gama con garantía oficial, importación directa y cotización actualizada en tiempo real.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      onAddToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Agregar al Carrito
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
