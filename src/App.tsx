import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LoginModal } from './components/LoginModal';
import { BudgetTrackingModal } from './components/BudgetTrackingModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { MessageCircle, ShoppingBag, Sparkles } from 'lucide-react';

function StoreApp() {
  const { products, activeCategory, searchQuery, isLoading, settings } = useStore();
  const { isAdmin } = useAuth();

  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          activeCategory === 'Todos' || p.category === activeCategory;
        const matchesQuery =
          !searchQuery.trim() ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.finalPrice - b.finalPrice;
        if (sortBy === 'price-desc') return b.finalPrice - a.finalPrice;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        // Default featured
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [products, activeCategory, searchQuery, sortBy]);

  const formatWhatsAppLink = () => {
    const cleanNumber = (settings.whatsappNumber || '5491140557890').replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hola ${settings.companyName}, quisiera consultar sobre sus productos.`);
    return `https://wa.me/${cleanNumber}?text=${message}`;
  };

  // If viewing admin panel and user is logged in
  if (isAdmin && isAdminView) {
    return (
      <AdminPanel onClose={() => setIsAdminView(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        onOpenAdmin={() => {
          if (isAdmin) setIsAdminView(true);
          else setIsLoginModalOpen(true);
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isAdminView={isAdminView}
        onToggleView={() => setIsAdminView(!isAdminView)}
      />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero banner with sale countdown & dropshipping highlights */}
        <HeroBanner />

        {/* Dynamic Category Filter & Sorting bar */}
        <CategoryFilter
          sortBy={sortBy}
          setSortBy={setSortBy}
          filteredCount={filteredProducts.length}
        />

        {/* Product Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl" />
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                  <div className="h-8 bg-gray-200 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-lg text-gray-900">
                No se encontraron artículos
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                No encontramos productos coincidentes en esta categoría. Prueba otra búsqueda o agrega artículos desde el panel CRM.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setIsAdminView(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  Extraer o Agregar Productos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating WhatsApp Contact Widget */}
      <a
        href={formatWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-xl shadow-emerald-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 group"
        title="Consultar por WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-white text-emerald-500" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-extrabold pr-1">
          ¿Dudas? Chatea con nosotros
        </span>
      </a>

      {/* Footer */}
      <Footer
        onOpenLogin={() => setIsLoginModalOpen(true)}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminView(true)}
      />

      {/* Modals & Drawers */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <BudgetTrackingModal />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => setIsAdminView(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <StoreApp />
      </StoreProvider>
    </AuthProvider>
  );
}
