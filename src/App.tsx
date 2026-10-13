import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order } from './types';
import { db } from './firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { seedDatabaseIfEmpty, initialProducts, initialOrders } from './seedData';

import { Navbar } from './components/Navbar';
import { Storefront } from './components/Storefront';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { NotificationModal } from './components/NotificationModal';
import { Dashboard } from './components/Dashboard';
import { InventoryManager } from './components/InventoryManager';
import { SupplierManager } from './components/SupplierManager';
import { ClientsManager } from './components/ClientsManager';
import { PriceListManager } from './components/PriceListManager';
import { WarehouseManager } from './components/WarehouseManager';
import { InvoicingManager } from './components/InvoicingManager';
import { MercadoPagoManager } from './components/MercadoPagoManager';
import { BackupManager } from './components/BackupManager';
import { ReportsManager } from './components/ReportsManager';
import { CompanySettingsManager } from './components/CompanySettingsManager';
import { InovaSyncManager } from './components/InovaSyncManager';
import { CreatorPanel, SubscriptionConfig } from './components/CreatorPanel';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'ecommerce' | 'erp'>('ecommerce');
  const [erpTab, setErpTab] = useState<'creator' | 'dashboard' | 'invoicing' | 'inventory' | 'suppliers' | 'inova' | 'clients' | 'pricelists' | 'warehouse' | 'mercadopago' | 'backup' | 'reports' | 'settings'>('dashboard');

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ displayName: string; role: string } | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionConfig>({
    isActive: true,
    suspendedMessage: '⚠️ Suscripción vencida o suspendida por falta de pago. Por favor contacte al administrador.',
    enabledModules: {
      invoicing: true,
      inventory: true,
      suppliers: true,
      clients: true,
      pricelists: true,
      warehouse: true,
      mercadopago: true,
      reports: true,
    },
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        await seedDatabaseIfEmpty();
      } catch (e) {
        console.warn("Using local fallback data.");
      }
    };
    initApp();

    const loadSub = () => {
      try {
        const local = localStorage.getItem('ganaga_subscription_config');
        if (local) {
          setSubscription(JSON.parse(local));
        }
      } catch (e) {
        // ignore
      }
    };
    loadSub();
    const interval = setInterval(loadSub, 1500);

    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'),
      snapshot => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Product);
        setProducts(list);
      },
      error => console.warn("Products offline fallback:", error)
    );

    const unsubscribeOrders = onSnapshot(
      collection(db, 'orders'),
      snapshot => {
        const list = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Order);
        setOrders(list);
      },
      error => console.warn("Orders offline fallback:", error)
    );

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      clearInterval(interval);
    };
  }, []);

  const handleRefreshProducts = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      setProducts(snap.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Product));
    } catch (e) {
      console.warn("Manual refresh fallback:", e);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.product.id === productId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean) as CartItem[]);
  };

  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'Pagado' || o.status === 'En Preparación').length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const cartCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const isCreator = currentUser?.role === 'Creador';

  if (!subscription.isActive && !isCreator) {
    return (
      <div className="min-h-screen bg-[#07090E] text-white flex flex-col items-center justify-center p-6 selection:bg-fuchsia-500">
        <div className="glass-card max-w-lg w-full p-10 rounded-[3rem] text-center space-y-6 border border-rose-500/40 glow-magenta shadow-2xl">
          <div className="w-20 h-20 bg-rose-600/20 border border-rose-500/40 rounded-3xl flex items-center justify-center mx-auto text-rose-400 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-white">Aplicación Suspendida</h1>
            <p className="text-sm text-slate-300 font-medium leading-relaxed">{subscription.suspendedMessage}</p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión como Creador
          </button>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setViewMode('erp');
            if (user.role === 'Creador') setErpTab('creator');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-fuchsia-500 selection:text-white">
      <Navbar
        viewMode={viewMode}
        setViewMode={(mode) => {
          if (mode === 'erp' && !currentUser) {
            setIsAuthModalOpen(true);
            return;
          }
          setViewMode(mode);
        }}
        erpTab={erpTab}
        setErpTab={(tab) => {
          if (tab === 'creator' && !isCreator) {
            setIsAuthModalOpen(true);
            return;
          }
          setErpTab(tab);
        }}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
        pendingOrdersCount={pendingOrdersCount}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1 w-full max-w-[1750px] mx-auto px-4 sm:px-8 lg:px-12 py-10">
        {viewMode === 'ecommerce' ? (
          <Storefront products={products} onAddToCart={handleAddToCart} />
        ) : !currentUser ? (
          <div className="max-w-md mx-auto my-20 glass-card p-10 rounded-[3rem] text-center space-y-6 border border-white/10 glow-indigo shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto glow-indigo border border-white/20">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Sistema Protegido</h2>
              <p className="text-slate-400 text-xs font-medium">Debe iniciar sesión como operador o Creador para acceder al Sistema ERP.</p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider glow-indigo shadow-xl transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Iniciar Sesión ERP
            </button>
          </div>
        ) : (
          <div>
            {erpTab === 'creator' && isCreator && <CreatorPanel />}
            {erpTab === 'dashboard' && subscription.enabledModules.reports && <Dashboard products={products} orders={orders} />}
            {erpTab === 'invoicing' && subscription.enabledModules.invoicing && <InvoicingManager orders={orders} />}
            {erpTab === 'inventory' && subscription.enabledModules.inventory && <InventoryManager products={products} onRefresh={handleRefreshProducts} />}
            {erpTab === 'suppliers' && subscription.enabledModules.suppliers && <SupplierManager />}
            {erpTab === 'inova' && <InovaSyncManager products={products} onRefresh={handleRefreshProducts} />}
            {erpTab === 'clients' && subscription.enabledModules.clients && <ClientsManager />}
            {erpTab === 'pricelists' && subscription.enabledModules.pricelists && <PriceListManager products={products} />}
            {erpTab === 'warehouse' && subscription.enabledModules.warehouse && <WarehouseManager orders={orders} onRefresh={() => {}} />}
            {erpTab === 'mercadopago' && subscription.enabledModules.mercadopago && <MercadoPagoManager />}
            {erpTab === 'backup' && <BackupManager />}
            {erpTab === 'reports' && subscription.enabledModules.reports && <ReportsManager products={products} orders={orders} />}
            {erpTab === 'settings' && <CompanySettingsManager />}
          </div>
        )}
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onOrderSuccess={(newOrder) => {
          setCart([]);
          orders.unshift(newOrder);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setViewMode('erp');
          if (user.role === 'Creador') {
            setErpTab('creator');
          } else {
            setErpTab('dashboard');
          }
        }}
      />

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        products={products}
      />
    </div>
  );
}
