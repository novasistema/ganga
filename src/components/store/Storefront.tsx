import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CATALOG_CATEGORIES, HERO_IMAGE } from '../../data/products';
import { handleImageError } from '../../utils/imageUtils';
import { ProductCard } from './ProductCard';
import { WholesaleNoticeBanner } from '../common/WholesaleNoticeBanner';
import { 
  Search, 
  SlidersHorizontal, 
  MessageCircle, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  Boxes,
  Percent,
  Plus
} from 'lucide-react';
import { generateWhatsAppLink, formatCurrency } from '../../utils/formatters';

export const Storefront: React.FC = () => {
  const { products, setActiveTab, isCrmAuthenticated, openCreateProductModal, catalogCategories = [], companySettings } = useStore();
  const brandName = companySettings?.companyName?.trim() || 'NUVOH';
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.brand));
    return ['Todas', ...Array.from(set)];
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesBrand = selectedBrand === 'Todas' || p.brand === selectedBrand;
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hook.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesBrand && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.priceUnit - b.priceUnit;
      if (sortBy === 'price_desc') return b.priceUnit - a.priceUnit;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedBrand, searchQuery, sortBy]);

  const whatsAppGeneralLink = generateWhatsAppLink(
    companySettings?.phone?.replace(/\D/g, '') || '5491149821100',
    `Hola ${brandName}, quiero recibir la lista de precios mayoristas completa y consultar por compras por mayor.`
  );

  return (
    <div className="min-h-screen bg-zinc-100/60 pb-20">
      
      {/* Hero Catalog Banner inspired by Page 1 of PDF */}
      <section className="bg-zinc-950 text-white relative overflow-hidden border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Bold Catalog Cover Typography */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                <Percent className="w-3.5 h-3.5" />
                <span>VENTA DIRECTA DE IMPORTADOR</span>
              </div>

              <div>
                <span className="block text-xs uppercase font-extrabold tracking-widest text-zinc-400 font-display">
                  T E C N O L O G Í A &nbsp; P A R A &nbsp; T U &nbsp; H O G A R
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white mt-1 leading-none">
                  CATÁLOGO <br />
                  <span className="text-orange-500">GENERAL 2026</span>
                </h1>
              </div>

              <div className="w-16 h-1 bg-orange-500 rounded-full my-2" />

              <p className="text-sm sm:text-base text-zinc-300 max-w-xl font-normal leading-relaxed">
                Precio de importador, stock real y envío a todo el país. Accedé a nuestras escalas de precios por volumen, surtido libre y pedidos desde {formatCurrency(companySettings?.minimumOrder || 100000)} ARS.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#catalogo-productos"
                  className="px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Ver Catálogo de Productos</span>
                </a>


                <a
                  href={whatsAppGeneralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Hablar con un Vendedor</span>
                </a>
              </div>
            </div>

            {/* Right Column: Hero Visual Cover Showcase */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-zinc-900 group">
                <img
                  src={HERO_IMAGE}
                  alt="Nuvoh Catálogo General"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                  className="w-full h-72 sm:h-80 object-cover object-center group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-bold text-white">6 Categorías Principales</span>
                  <span className="font-mono text-orange-400 font-bold">+100 Modelos en Stock</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Wholesale Pillars and Minimum Order Live Calculator */}
      <WholesaleNoticeBanner />

      {/* Main Catalog Explorer Section */}
      <div id="catalogo-productos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Admin Quick Action Banner when logged in */}
        {isCrmAuthenticated && (
          <div className="bg-zinc-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-zinc-800 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Modo Administrador Activo
                </span>
                <span className="text-[11px] text-zinc-400">
                  Podés agregar nuevos artículos o modificar los existentes con sincronización en tiempo real.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateProductModal}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Producto</span>
              </button>
              <button
                onClick={() => setActiveTab('crm')}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors border border-zinc-700"
              >
                Gestionar en CRM
              </button>
            </div>
          </div>
        )}

        {/* Category Pills Header (Matching Page 2 Index) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold block">
                CONTENIDO DE CATÁLOGO
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 font-display">
                Categorías Destacadas
              </h2>
            </div>
            <span className="text-xs text-zinc-500">
              {filteredProducts.length} productos disponibles
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {catalogCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU, marca..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-hidden"
            />
          </div>

          {/* Filters & Sorters */}
          <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5">
            {/* Brand */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-500 hidden sm:inline">Marca:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="text-xs p-2 rounded-xl border border-zinc-200 bg-zinc-50 font-medium outline-hidden"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs p-2 rounded-xl border border-zinc-200 bg-zinc-50 font-medium outline-hidden"
              >
                <option value="featured">Destacados de Catálogo</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="name">Alfabético A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200">
            <p className="text-zinc-600 font-medium text-sm">
              No se encontraron productos para los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Todos');
                setSearchQuery('');
                setSelectedBrand('Todas');
              }}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Commercial Trust Footer Section */}
        <div className="mt-16 bg-white rounded-3xl p-8 border border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 font-display">
                  ENVÍOS A TODO EL PAÍS
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Despachamos por expreso de tu confianza o transporte puerta a puerta en 24 a 48 horas hábiles.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 font-display">
                  GARANTÍA Y FACTURA A/B
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Todos nuestros productos cuentan con garantía oficial de importador y respaldo técnico directo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 font-display">
                  ASESOR COMERCIAL ASIGNADO
                </h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Atención directa para comercios, ferreterías, bazares y revendedores con cotizaciones por bulto cerrado.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
