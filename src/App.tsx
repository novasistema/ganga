import React from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Storefront } from './components/store/Storefront';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { QuotationBuilder } from './components/crm/QuotationBuilder';
import { ProductDetailModal } from './components/store/ProductDetailModal';
import { CartDrawer } from './components/store/CartDrawer';
import { CheckoutModal } from './components/store/CheckoutModal';
import { ProductEditModal } from './components/crm/ProductEditModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const AppContent: React.FC = () => {
  const { activeTab, companySettings } = useStore();
  const brandName = companySettings?.companyName?.trim() || 'NUVOH';

  React.useEffect(() => {
    document.title = `${brandName} Mayorista & CRM Ventas | Catálogo Online`;
  }, [brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafaf9]">
      <Header />

      <main className="flex-1">
        <ErrorBoundary>
          {activeTab === 'store' && <Storefront />}
          {activeTab === 'crm' && <CrmDashboard />}
          {activeTab === 'quotation' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <QuotationBuilder />
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* Global Modals & Drawers */}
      <ProductDetailModal />
      <ProductEditModal />
      <CartDrawer />
      <CheckoutModal />

      {/* Global Footer (No-print) */}
      <footer className="no-print bg-zinc-950 text-zinc-400 text-xs py-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-orange-600 text-white font-black text-xs flex items-center justify-center font-display">
              {brandName.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-white tracking-wide font-display">
              {brandName.toUpperCase()} · TECNOLOGÍA PARA TU HOGAR
            </span>
          </div>
          <div className="text-center sm:text-right text-[11px] text-zinc-500">
            Catálogo Oficial de Precios Mayoristas · Venta por Escala y Distribución B2B
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </ErrorBoundary>
  );
}
