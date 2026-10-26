import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  Order,
  CompanySettings,
  CartItem,
  HeroBannerItem,
  StoreCategory,
  CustomerClient,
  SupplierPurchaseOrder,
  SupplierOrderItem,
  ResellerUser,
  ResellerPriceList,
  PushNotification,
  NotificationSettings
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_PRODUCTS, DEFAULT_BANNERS, DEFAULT_CATEGORIES, DEFAULT_PRICE_LISTS } from '../data/initialData';
import { DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';
import {
  playNotificationChime,
  sendNativePushNotification,
  getBrowserNotificationPermission,
  requestPushNotificationPermission,
  ORDER_STATUS_LABELS
} from '../utils/notificationService';

interface StoreContextType {
  products: Product[];
  orders: Order[];
  clients: CustomerClient[];
  supplierOrders: SupplierPurchaseOrder[];
  settings: CompanySettings;
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  selectedProduct: Product | null;
  activeCategory: string;
  searchQuery: string;
  isLoading: boolean;
  setIsCartOpen: (open: boolean) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setSelectedProduct: (product: Product | null) => void;
  setActiveCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string>;
  addMultipleProducts: (products: Product[]) => Promise<number>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteMultipleProducts: (ids: string[]) => Promise<void>;
  updateStock: (id: string, newStock: number) => Promise<void>;
  updateGlobalMarkup: (marginPercentage: number) => Promise<void>;
  saveSettings: (settings: CompanySettings) => Promise<void>;
  categories: StoreCategory[];
  addCategory: (category: Omit<StoreCategory, 'id'>) => Promise<string>;
  updateCategory: (id: string, updates: Partial<StoreCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  ensureCategoryExists: (categoryName: string, icon?: string) => Promise<string>;
  banners: HeroBannerItem[];
  saveBanners: (banners: HeroBannerItem[]) => Promise<void>;
  isBudgetTrackingOpen: boolean;
  trackingOrderId: string;
  setIsBudgetTrackingOpen: (open: boolean) => void;
  setTrackingOrderId: (id: string) => void;
  isSuperOfertasOpen: boolean;
  setIsSuperOfertasOpen: (open: boolean) => void;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Promise<string>;
  verifyAndSendBudget: (orderId: string, updatedItems: any[], notes: string, adjustedTotal: number) => Promise<string>;
  generateMercadoPagoLink: (order: Order) => Promise<{ initPoint: string; deepLink: string; preferenceId: string }>;
  markOrderAsPaid: (orderId: string, method: string, proofUrl?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus']) => Promise<void>;
  resetToInitialCatalog: () => Promise<void>;
  addClient: (client: Omit<CustomerClient, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent'>) => Promise<string>;
  updateClient: (id: string, updates: Partial<CustomerClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  createSupplierOrder: (order: Omit<SupplierPurchaseOrder, 'id' | 'createdAt'>) => Promise<string>;
  createSupplierOrdersFromCustomerOrder: (customerOrder: Order) => Promise<SupplierPurchaseOrder[]>;
  updateSupplierOrderStatus: (orderId: string, status: SupplierPurchaseOrder['status'], notes?: string) => Promise<void>;
  deleteSupplierOrder: (orderId: string) => Promise<void>;
  syncProductCostFromLink: (productId: string, customUrl?: string) => Promise<{
    success: boolean;
    oldCost: number;
    newCost: number;
    newFinalPrice: number;
    priceChanged: boolean;
    diff: number;
    supplierName?: string;
    message: string;
  }>;
  syncAllProductCostsFromLinks: (onlyUnsynced?: boolean) => Promise<{
    total: number;
    updated: number;
    unchanged: number;
    failed: number;
    results: any[];
  }>;
  syncUnsyncedProductsFromLinks: () => Promise<{
    total: number;
    updated: number;
    unchanged: number;
    failed: number;
    results: any[];
  }>;
  resellers: ResellerUser[];
  activeReseller: ResellerUser | null;
  setActiveReseller: (reseller: ResellerUser | null) => void;
  loginReseller: (username: string, password: string) => Promise<{ success: boolean; error?: string; reseller?: ResellerUser }>;
  logoutReseller: () => void;
  addReseller: (resellerData: Omit<ResellerUser, 'id' | 'createdAt'>) => Promise<string>;
  updateReseller: (id: string, updates: Partial<ResellerUser>) => Promise<void>;
  deleteReseller: (id: string) => Promise<void>;
  isResellerPortalOpen: boolean;
  setIsResellerPortalOpen: (open: boolean) => void;
  // Price Lists & Viajantes System
  priceLists: ResellerPriceList[];
  activePriceList: ResellerPriceList | null;
  setActivePriceList: (list: ResellerPriceList | null) => void;
  addPriceList: (list: Omit<ResellerPriceList, 'id' | 'createdAt'>) => Promise<string>;
  updatePriceList: (id: string, updates: Partial<ResellerPriceList>) => Promise<void>;
  deletePriceList: (id: string) => Promise<void>;
  calculateProductPriceForViajante: (product: Product, customList?: ResellerPriceList | null) => {
    storePrice: number;
    viajantePrice: number;
    profitPerUnit: number;
    markupPercentage: number;
  };
  // Push & In-App Notification System
  notifications: PushNotification[];
  notificationSettings: NotificationSettings;
  unreadNotificationsCount: number;
  browserPermission: NotificationPermission | 'unsupported';
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  triggerPushNotification: (notif: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => Promise<string>;
  activeToastNotification: PushNotification | null;
  dismissToastNotification: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('dropstore_cached_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PRODUCTS;
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<CustomerClient[]>([]);
  const [supplierOrders, setSupplierOrders] = useState<SupplierPurchaseOrder[]>([]);
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('dropstore_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBudgetTrackingOpen, setIsBudgetTrackingOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string>('');
  const [isSuperOfertasOpen, setIsSuperOfertasOpen] = useState(false);
  const [resellers, setResellers] = useState<ResellerUser[]>([]);
  const [activeReseller, setActiveReseller] = useState<ResellerUser | null>(() => {
    try {
      const saved = localStorage.getItem('nova_reseller_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isResellerPortalOpen, setIsResellerPortalOpen] = useState(false);
  const [manualPriceList, setManualPriceList] = useState<ResellerPriceList | null>(null);

  // Push & In-App Notifications State
  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    try {
      const cached = localStorage.getItem('nova_notifications');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Initial welcome notification
    return [
      {
        id: 'notif-welcome',
        type: 'system',
        title: '🔔 ¡Bienvenido a Nova Import PRO!',
        message: 'Ahora puedes activar las notificaciones push para recibir cambios en tus pedidos y nuevos ingresos en inventario.',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const cached = localStorage.getItem('nova_notification_settings');
      return cached
        ? JSON.parse(cached)
        : {
            enabled: true,
            orderUpdates: true,
            newProducts: true,
            promos: true,
            soundEnabled: true
          };
    } catch {
      return {
        enabled: true,
        orderUpdates: true,
        newProducts: true,
        promos: true,
        soundEnabled: true
      };
    }
  });

  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeToastNotification, setActiveToastNotification] = useState<PushNotification | null>(null);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return getBrowserNotificationPermission();
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dropstore_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // 1. Sync Settings from Firestore
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'store_config');
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data() as CompanySettings;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...remoteData,
            companyName: remoteData.companyName || DEFAULT_SETTINGS.companyName,
            logoUrl: remoteData.logoUrl || DEFAULT_SETTINGS.logoUrl
          });
        } else {
          // Initialize with default settings in Firestore
          setDoc(settingsDocRef, DEFAULT_SETTINGS).catch((err) => {
            console.warn('Could not auto-seed settings in Firestore:', err.message);
          });
        }
      },
      (error) => {
        console.warn('Settings onSnapshot error (using local default):', error.message);
      }
    );

    return () => unsubSettings();
  }, []);

  // 2. Sync Products from Firestore
  useEffect(() => {
    const productsColRef = collection(db, 'products');
    const unsubProducts = onSnapshot(
      productsColRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as Product);
          });
          setProducts(list);
          try {
            localStorage.setItem('dropstore_cached_products', JSON.stringify(list));
            localStorage.setItem('dropstore_initialized', 'true');
          } catch {}
        } else {
          // If never initialized before in this browser/installation, seed once
          const isInit = localStorage.getItem('dropstore_initialized');
          if (!isInit) {
            seedInitialProducts();
          } else {
            // User intentionally cleared or deleted products
            setProducts([]);
            try {
              localStorage.setItem('dropstore_cached_products', JSON.stringify([]));
            } catch {}
          }
        }
        setIsLoading(false);
      },
      (error) => {
        console.warn('Products onSnapshot error, falling back to local list:', error.message);
        setIsLoading(false);
      }
    );

    return () => unsubProducts();
  }, []);

  // 3. Sync Orders from Firestore
  useEffect(() => {
    const ordersColRef = collection(db, 'orders');
    const q = query(ordersColRef, orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Order);
        });
        setOrders(list);
      },
      (error) => {
        console.warn('Orders onSnapshot error:', error.message);
      }
    );

    return () => unsubOrders();
  }, []);

  // 4. Sync Clients from Firestore
  useEffect(() => {
    const clientsColRef = collection(db, 'clients');
    const q = query(clientsColRef, orderBy('createdAt', 'desc'));
    const unsubClients = onSnapshot(
      q,
      (snapshot) => {
        const list: CustomerClient[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as CustomerClient);
        });
        setClients(list);
      },
      (error) => {
        console.warn('Clients onSnapshot error:', error.message);
      }
    );

    return () => unsubClients();
  }, []);

  // 5. Sync Supplier Purchase Orders from Firestore
  useEffect(() => {
    const supColRef = collection(db, 'supplier_orders');
    const q = query(supColRef, orderBy('createdAt', 'desc'));
    const unsubSupplierOrders = onSnapshot(
      q,
      (snapshot) => {
        const list: SupplierPurchaseOrder[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as SupplierPurchaseOrder);
        });
        setSupplierOrders(list);
      },
      (error) => {
        console.warn('Supplier orders onSnapshot error:', error.message);
      }
    );

    return () => unsubSupplierOrders();
  }, []);

  // 6. Sync Resellers & Sales Reps from Firestore
  useEffect(() => {
    const resColRef = collection(db, 'resellers');
    const q = query(resColRef, orderBy('createdAt', 'desc'));
    const unsubResellers = onSnapshot(
      q,
      (snapshot) => {
        const list: ResellerUser[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ResellerUser);
        });
        setResellers(list);

        // Keep activeReseller in sync with fresh Firestore values (commission, assigned list, zone, etc.)
        setActiveReseller((current) => {
          if (!current) return null;
          const match = list.find(
            (r) => r.id === current.id || r.username.toLowerCase() === current.username.toLowerCase()
          );
          if (match) {
            try {
              localStorage.setItem('nova_reseller_session', JSON.stringify(match));
            } catch {}
            return match;
          }
          return current;
        });
      },
      (error) => {
        console.warn('Resellers onSnapshot error:', error.message);
      }
    );

    return () => unsubResellers();
  }, []);

  // 7. Sync Notifications from Firestore
  useEffect(() => {
    const notifsColRef = collection(db, 'notifications');
    const q = query(notifsColRef, orderBy('timestamp', 'desc'));
    const unsubNotifs = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PushNotification[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as PushNotification);
          });
          setNotifications(list);
          try {
            localStorage.setItem('nova_notifications', JSON.stringify(list));
          } catch {}
        }
      },
      (error) => {
        console.warn('Notifications onSnapshot error:', error.message);
      }
    );

    return () => unsubNotifs();
  }, []);

  // Function to seed initial catalog to Firestore
  const seedInitialProducts = async () => {
    try {
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      setProducts(INITIAL_PRODUCTS);
    } catch (e) {
      console.warn('Could not seed products to Firestore:', e);
    }
  };

  const resetToInitialCatalog = async () => {
    await seedInitialProducts();
  };

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.finalPrice * item.quantity,
    0
  );

  // Firestore actions
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullProduct: Product = {
      ...productData,
      id: newId,
      supplierName: productData.supplierName || (productData.supplierUrl?.includes('inova') ? 'Inova ARG' : 'Proveedor Web'),
      supplierUrl: productData.supplierUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'products', newId), fullProduct);
      setProducts((prev) => [fullProduct, ...prev]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${newId}`);
      // Fallback
      setProducts((prev) => [fullProduct, ...prev]);
    }

    // Trigger push notification for new product
    await triggerPushNotification({
      type: 'new_product',
      title: `✨ ¡Nuevo ingreso: ${fullProduct.title}!`,
      message: `Ya disponible en el catálogo a $ ${fullProduct.finalPrice.toLocaleString('es-AR')} (${fullProduct.category}). ¡Stock listo para entrega!`,
      productId: newId,
      imageUrl: fullProduct.imageUrl
    });

    return newId;
  };

  const addMultipleProducts = async (productsList: Product[]): Promise<number> => {
    let count = 0;
    const itemsSaved: Product[] = [];

    for (const p of productsList) {
      // Always generate a unique ID for imported products so they never conflict or overwrite existing items
      const prodId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

      const itemToSave: Product = {
        ...p,
        id: prodId,
        inStock: p.inStock !== undefined ? p.inStock : true,
        stock: Number(p.stock) > 0 ? Number(p.stock) : 25,
        originalPrice: Number(p.originalPrice) || 12000,
        markupPercentage: Number(p.markupPercentage) || 35,
        finalPrice: Number(p.finalPrice) || Math.round((Number(p.originalPrice) || 12000) * 1.35),
        category: p.category || 'General',
        imageUrl: p.imageUrl || DEFAULT_PRODUCT_PLACEHOLDER,
        supplierName: p.supplierName || (p.supplierUrl?.includes('inova') ? 'Inova ARG' : 'Proveedor Web'),
        supplierUrl: p.supplierUrl || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'products', prodId), itemToSave);
      } catch (err: any) {
        console.warn('Firebase setDoc notice:', err.message);
      }

      count++;
      itemsSaved.push(itemToSave);
    }

    // Immediately update local React state so products appear at the very top of the store and inventory
    if (itemsSaved.length > 0) {
      setProducts((prev) => {
        const updated = [...itemsSaved, ...prev];
        try {
          localStorage.setItem('dropstore_cached_products', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });

      // Trigger push notification for bulk new arrivals
      await triggerPushNotification({
        type: 'new_product',
        title: `🚀 ¡${itemsSaved.length} Nuevos Productos en Catálogo!`,
        message: `Acabamos de incorporar ${itemsSaved.length} artículos a precios mayoristas y con stock verificado. ¡Descúbrelos ya!`,
        productId: itemsSaved[0].id,
        imageUrl: itemsSaved[0].imageUrl
      });
    }

    return count;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const updatedPayload = { ...updates, updatedAt: new Date().toISOString() };
    try {
      await updateDoc(doc(db, 'products', id), updatedPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedPayload } : p))
    );
  };

  const deleteProduct = async (id: string) => {
    // 1. Immediately remove from React state & localStorage so UI updates instantly
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('dropstore_cached_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    removeFromCart(id);

    // 2. Remove document from Firestore
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error: any) {
      console.warn('Notice deleting product from Firestore (removed locally):', error?.message);
    }
  };

  const deleteMultipleProducts = async (ids: string[]) => {
    // 1. Immediately remove from React state & localStorage
    setProducts((prev) => {
      const updated = prev.filter((p) => !ids.includes(p.id));
      try {
        localStorage.setItem('dropstore_cached_products', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    for (const id of ids) {
      removeFromCart(id);
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err: any) {
        console.warn('Notice batch deleting from Firestore:', err?.message);
      }
    }
  };

  const updateStock = async (id: string, newStock: number) => {
    const inStock = newStock > 0;
    await updateProduct(id, { stock: newStock, inStock });
  };

  // Centralized margin updater: changes the profit markup of all products
  const updateGlobalMarkup = async (marginPercentage: number) => {
    const margin = Number(marginPercentage);
    for (const prod of products) {
      const originalPrice = prod.originalPrice || Math.round(prod.finalPrice / 1.4);
      const newFinalPrice = Math.round(originalPrice * (1 + margin / 100));
      await updateProduct(prod.id, {
        markupPercentage: margin,
        finalPrice: newFinalPrice,
        originalPrice
      });
    }
    await saveSettings({
      ...settings,
      defaultProfitMargin: margin
    });
  };

  const saveSettings = async (newSettings: CompanySettings) => {
    const payload = {
      ...newSettings,
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(doc(db, 'settings', 'store_config'), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/store_config');
    }
    setSettings(payload);
  };

  // Helper to detect category icon emoji
  const detectCategoryEmoji = (name: string): string => {
    const low = name.toLowerCase();
    if (low.includes('tecno') || low.includes('gadget') || low.includes('smart') || low.includes('celular') || low.includes('movil') || low.includes('reloj')) return '📱';
    if (low.includes('audio') || low.includes('auricular') || low.includes('sonido') || low.includes('parlante') || low.includes('headphone')) return '🎧';
    if (low.includes('herramienta') || low.includes('ferreteria') || low.includes('taller') || low.includes('mecanic') || low.includes('extractor') || low.includes('llave') || low.includes('pinza')) return '🔧';
    if (low.includes('hogar') || low.includes('casa') || low.includes('luz') || low.includes('lamp') || low.includes('ilumin') || low.includes('velador') || low.includes('foco')) return '💡';
    if (low.includes('bazar') || low.includes('cocina') || low.includes('cuchill') || low.includes('termo') || low.includes('vaso') || low.includes('comida') || low.includes('afilador')) return '🍳';
    if (low.includes('moda') || low.includes('ropa') || low.includes('mochila') || low.includes('bolso') || low.includes('accesorio') || low.includes('valija')) return '🎒';
    if (low.includes('belleza') || low.includes('cuidado') || low.includes('barber') || low.includes('pelo') || low.includes('facial') || low.includes('afeitad')) return '💄';
    if (low.includes('auto') || low.includes('vehicul') || low.includes('moto') || low.includes('car')) return '🚗';
    if (low.includes('juguete') || low.includes('bebe') || low.includes('nino') || low.includes('gamer') || low.includes('game')) return '🎮';
    if (low.includes('deporte') || low.includes('fitness') || low.includes('gym') || low.includes('entren')) return '⚽';
    if (low.includes('oferta') || low.includes('super') || low.includes('liquidac') || low.includes('descuento')) return '🔥';
    return '📦';
  };

  // Computed categories from settings + dynamic discovery
  const categories: StoreCategory[] = React.useMemo(() => {
    const baseList = (settings.categories && settings.categories.length > 0)
      ? settings.categories
      : DEFAULT_CATEGORIES;
    const knownNames = new Set(baseList.map((c) => c.name.toLowerCase().trim()));
    const autoDiscovered: StoreCategory[] = [];
    for (const p of products) {
      const catName = p.category?.trim();
      if (catName && !knownNames.has(catName.toLowerCase()) && catName !== 'Todos') {
        knownNames.add(catName.toLowerCase());
        autoDiscovered.push({
          id: `cat-auto-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name: catName,
          icon: detectCategoryEmoji(catName),
          description: `Categoría detectada automáticamente de productos`,
          isCustom: true
        });
      }
    }
    return [...baseList, ...autoDiscovered];
  }, [settings.categories, products]);

  // Computed active banners
  const banners: HeroBannerItem[] = React.useMemo(() => {
    return (settings.banners && settings.banners.length > 0)
      ? settings.banners
      : DEFAULT_BANNERS;
  }, [settings.banners]);

  const saveBanners = async (newBanners: HeroBannerItem[]) => {
    const updated = {
      ...settings,
      banners: newBanners
    };
    await saveSettings(updated);
  };

  const addCategory = async (catData: Omit<StoreCategory, 'id'>) => {
    const cleanName = catData.name.trim();
    const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCat: StoreCategory = {
      id: newId,
      name: cleanName,
      icon: catData.icon || detectCategoryEmoji(cleanName),
      description: catData.description || '',
      imageUrl: catData.imageUrl,
      isCustom: true
    };
    const currentList = settings.categories && settings.categories.length > 0 ? settings.categories : DEFAULT_CATEGORIES;
    const updated = [...currentList, newCat];
    await saveSettings({
      ...settings,
      categories: updated
    });
    return newId;
  };

  const updateCategory = async (id: string, updates: Partial<StoreCategory>) => {
    const currentList = settings.categories && settings.categories.length > 0 ? settings.categories : DEFAULT_CATEGORIES;
    const oldCat = currentList.find((c) => c.id === id);
    const updatedList = currentList.map((c) => (c.id === id ? { ...c, ...updates } : c));
    await saveSettings({
      ...settings,
      categories: updatedList
    });
    // If category name changed, synchronize it on existing products
    if (updates.name && oldCat && updates.name !== oldCat.name) {
      for (const p of products) {
        if (p.category === oldCat.name) {
          await updateProduct(p.id, { category: updates.name.trim() });
        }
      }
    }
  };

  const deleteCategory = async (id: string) => {
    const currentList = settings.categories && settings.categories.length > 0 ? settings.categories : DEFAULT_CATEGORIES;
    const updatedList = currentList.filter((c) => c.id !== id);
    await saveSettings({
      ...settings,
      categories: updatedList
    });
  };

  const ensureCategoryExists = async (categoryName: string, icon?: string): Promise<string> => {
    if (!categoryName || !categoryName.trim()) return 'General';
    const cleanName = categoryName.trim();
    const currentList = settings.categories && settings.categories.length > 0 ? settings.categories : DEFAULT_CATEGORIES;
    const existing = currentList.find((c) => c.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      return existing.name;
    }
    const newCat: StoreCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      icon: icon || detectCategoryEmoji(cleanName),
      description: `Categoría importada automáticamente de enlace o proveedor`,
      isCustom: true
    };
    const updatedList = [...currentList, newCat];
    await saveSettings({
      ...settings,
      categories: updatedList
    });
    return cleanName;
  };


  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> => {
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const fullOrder: Order = {
      ...orderData,
      id: orderId,
      orderStatus: 'presupuesto_pendiente',
      budgetStatus: 'stock_verification_pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'orders', orderId), fullOrder);
      // Decrement stock in real time
      for (const item of orderData.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod && prod.stock > 0) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          await updateStock(prod.id, newStock);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    }

    // Automatically register or update buyer in Clientes (CRM)
    try {
      const clientEmail = (orderData.customerEmail || '').trim().toLowerCase();
      const clientPhone = (orderData.customerPhone || '').trim();
      const clientName = (orderData.customerName || '').trim();

      if (clientName || clientEmail || clientPhone) {
        const existingClient = clients.find(
          (c) =>
            (clientEmail && c.email.toLowerCase() === clientEmail) ||
            (clientPhone && c.phone === clientPhone)
        );

        if (existingClient) {
          const updatedClient: CustomerClient = {
            ...existingClient,
            name: clientName || existingClient.name,
            phone: clientPhone || existingClient.phone,
            email: clientEmail || existingClient.email,
            address: orderData.customerAddress || existingClient.address,
            city: orderData.customerCity || existingClient.city,
            dniCuit: orderData.customerDniCuit || existingClient.dniCuit,
            totalOrders: (existingClient.totalOrders || 0) + 1,
            totalSpent: (existingClient.totalSpent || 0) + (orderData.totalAmount || 0),
            lastOrderId: orderId,
            lastOrderDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'clients', existingClient.id), updatedClient);
          setClients((prev) => prev.map((c) => (c.id === existingClient.id ? updatedClient : c)));
        } else {
          const newClientId = `cli-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          const newClient: CustomerClient = {
            id: newClientId,
            name: clientName || 'Cliente Web',
            email: clientEmail || '',
            phone: clientPhone || '',
            address: orderData.customerAddress || '',
            city: orderData.customerCity || '',
            dniCuit: orderData.customerDniCuit || '',
            notes: orderData.budgetNotes || '',
            totalOrders: 1,
            totalSpent: orderData.totalAmount || 0,
            lastOrderId: orderId,
            lastOrderDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'clients', newClientId), newClient);
          setClients((prev) => [newClient, ...prev]);
        }
      }
    } catch (clientErr: any) {
      console.warn('Could not auto-register client in Firestore:', clientErr.message);
    }

    setOrders((prev) => [fullOrder, ...prev]);
    clearCart();

    // Auto-generate supplier purchase orders draft for easy one-click ordering
    try {
      createSupplierOrdersFromCustomerOrder(fullOrder).catch((err) => {
        console.warn('Auto-create supplier orders notice:', err.message);
      });
    } catch {}

    return orderId;
  };

  const addClient = async (
    clientData: Omit<CustomerClient, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent'>
  ): Promise<string> => {
    const newId = `cli-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const fullClient: CustomerClient = {
      ...clientData,
      id: newId,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'clients', newId), fullClient);
    setClients((prev) => [fullClient, ...prev]);
    return newId;
  };

  const updateClient = async (id: string, updates: Partial<CustomerClient>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await updateDoc(doc(db, 'clients', id), updated);
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
  };

  const deleteClient = async (id: string) => {
    await deleteDoc(doc(db, 'clients', id));
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const createSupplierOrder = async (
    orderData: Omit<SupplierPurchaseOrder, 'id' | 'createdAt'>
  ): Promise<string> => {
    const ocId = `OC-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const full: SupplierPurchaseOrder = {
      ...orderData,
      id: ocId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'supplier_orders', ocId), full);
    setSupplierOrders((prev) => [full, ...prev]);
    return ocId;
  };

  const createSupplierOrdersFromCustomerOrder = async (
    customerOrder: Order
  ): Promise<SupplierPurchaseOrder[]> => {
    // Group order items by supplier
    const supplierGroups: { [supplierName: string]: SupplierOrderItem[] } = {};

    for (const item of customerOrder.items) {
      const prod = products.find((p) => p.id === item.productId);
      const supplierName = (
        prod?.supplierName ||
        (prod?.supplierUrl?.toLowerCase().includes('plutotec') ? 'Plutotec' : '') ||
        (prod?.supplierUrl?.toLowerCase().includes('inova') ? 'Inova ARG' : '') ||
        'Inova ARG'
      ).trim();

      const unitCost = prod?.originalPrice || Math.round(item.price * 0.7);
      const unitCostUsd =
        prod?.costInUsd ||
        (prod?.costCurrency === 'USD'
          ? Math.round(unitCost / (settings.usdExchangeRate || 1555))
          : undefined);
      const supplierUrl = prod?.supplierUrl || '';
      const supplierSku = prod?.supplierSku || '';
      const imageUrl = prod?.imageUrl || item.imageUrl || '';

      const supItem: SupplierOrderItem = {
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        unitCost,
        costCurrency: prod?.costCurrency || 'ARS',
        unitCostUsd,
        totalCost: unitCost * item.quantity,
        customerSalePrice: item.price,
        totalSalePrice: item.price * item.quantity,
        supplierUrl,
        supplierSku,
        imageUrl
      };

      if (!supplierGroups[supplierName]) {
        supplierGroups[supplierName] = [];
      }
      supplierGroups[supplierName].push(supItem);
    }

    const createdList: SupplierPurchaseOrder[] = [];
    const suppliers = Object.keys(supplierGroups);

    for (let i = 0; i < suppliers.length; i++) {
      const supName = suppliers[i];
      const supItems = supplierGroups[supName];
      const totalCostToPay = supItems.reduce((acc, it) => acc + it.totalCost, 0);
      const customerSaleTotal = supItems.reduce((acc, it) => acc + it.totalSalePrice, 0);
      const estimatedProfit = customerSaleTotal - totalCostToPay;
      const totalCostUsd = supItems.some((it) => it.unitCostUsd)
        ? supItems.reduce((acc, it) => acc + (it.unitCostUsd || 0) * it.quantity, 0)
        : undefined;

      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const ocId = `OC-${Date.now().toString().slice(-6)}-${i + 1}`;
      const orderNumber = `OC #${Date.now().toString().slice(-4)}${randomSuffix}`;

      let supplierPhone = '';
      if (supName.toLowerCase().includes('inova')) supplierPhone = '+5491123456789';
      else if (supName.toLowerCase().includes('plutotec')) supplierPhone = '+5491198765432';

      const newOrder: SupplierPurchaseOrder = {
        id: ocId,
        orderNumber,
        customerOrderId: customerOrder.id,
        customerName: customerOrder.customerName,
        customerPhone: customerOrder.customerPhone,
        supplierName: supName,
        supplierPhone,
        items: supItems,
        totalCostToPay,
        totalCostUsd,
        customerSaleTotal,
        estimatedProfit,
        status: 'pendiente_encargar',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, 'supplier_orders', ocId), newOrder);
      } catch (err: any) {
        console.warn('Could not save supplier order in Firestore:', err.message);
      }

      createdList.push(newOrder);
    }

    setSupplierOrders((prev) => [...createdList, ...prev]);
    return createdList;
  };

  const updateSupplierOrderStatus = async (
    orderId: string,
    status: SupplierPurchaseOrder['status'],
    notes?: string
  ) => {
    const updates: Partial<SupplierPurchaseOrder> = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (notes !== undefined) updates.notes = notes;
    if (status === 'encargado_pagado') updates.paidAt = new Date().toISOString();
    if (status === 'recibido_deposito') updates.receivedAt = new Date().toISOString();

    try {
      await updateDoc(doc(db, 'supplier_orders', orderId), updates);
    } catch (err: any) {
      console.warn('Could not update supplier order in Firestore:', err.message);
    }

    setSupplierOrders((prev) =>
      prev.map((so) => (so.id === orderId ? { ...so, ...updates } : so))
    );
  };

  const deleteSupplierOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'supplier_orders', orderId));
    } catch (err: any) {
      console.warn('Could not delete supplier order in Firestore:', err.message);
    }
    setSupplierOrders((prev) => prev.filter((so) => so.id !== orderId));
  };

  // --- RESELLER / VENDEDOR MANAGEMENT & AUTH ---
  const addReseller = async (
    resellerData: Omit<ResellerUser, 'id' | 'createdAt'>
  ): Promise<string> => {
    const newId = `reseller-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newReseller: ResellerUser = {
      ...resellerData,
      id: newId,
      createdAt: new Date().toISOString(),
      totalOrdersCount: 0,
      totalSalesAmount: 0
    };

    try {
      await setDoc(doc(db, 'resellers', newId), newReseller);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `resellers/${newId}`);
    }

    setResellers((prev) => [newReseller, ...prev.filter((r) => r.id !== newId)]);
    return newId;
  };

  const updateReseller = async (id: string, updates: Partial<ResellerUser>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'resellers', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `resellers/${id}`);
    }

    setResellers((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
    if (activeReseller && activeReseller.id === id) {
      const updated = { ...activeReseller, ...updates };
      setActiveReseller(updated);
      try {
        localStorage.setItem('nova_reseller_session', JSON.stringify(updated));
      } catch {}
    }
  };

  const deleteReseller = async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'resellers', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `resellers/${id}`);
    }

    setResellers((prev) => prev.filter((r) => r.id !== id));
    if (activeReseller && activeReseller.id === id) {
      setActiveReseller(null);
      try {
        localStorage.removeItem('nova_reseller_session');
      } catch {}
    }
  };

  const loginReseller = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; reseller?: ResellerUser }> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const found = resellers.find(
      (r) =>
        (r.username.toLowerCase() === cleanUser || (r.email && r.email.toLowerCase() === cleanUser)) &&
        r.password === cleanPass
    );

    if (!found) {
      return { success: false, error: 'Usuario o contraseña incorrectos. Consulta con el administrador.' };
    }

    if (!found.active) {
      return { success: false, error: 'Tu cuenta de vendedor se encuentra inactiva. Contacta a administración.' };
    }

    const updatedUser = { ...found, lastLoginAt: new Date().toISOString() };
    setActiveReseller(updatedUser);
    try {
      localStorage.setItem('nova_reseller_session', JSON.stringify(updatedUser));
      await updateDoc(doc(db, 'resellers', found.id), { lastLoginAt: updatedUser.lastLoginAt });
    } catch {}
    return { success: true, reseller: updatedUser };
  };

  const logoutReseller = () => {
    setActiveReseller(null);
    setManualPriceList(null);
    try {
      localStorage.removeItem('nova_reseller_session');
    } catch {}
  };

  // =========================================================================
  // PRICE LISTS & VIAJANTES MARGINS SYSTEM
  // =========================================================================
  const priceLists: ResellerPriceList[] = (settings.priceLists && settings.priceLists.length > 0)
    ? settings.priceLists
    : DEFAULT_PRICE_LISTS;

  const activePriceList: ResellerPriceList | null = useMemo(() => {
    if (manualPriceList) return manualPriceList;
    if (!activeReseller) return null;

    // 1. Match by assignedPriceListId
    if (activeReseller.assignedPriceListId) {
      const match = priceLists.find((pl) => pl.id === activeReseller.assignedPriceListId);
      if (match) return match;
    }
    // 2. Match by assignedPriceListName
    if (activeReseller.assignedPriceListName) {
      const match = priceLists.find(
        (pl) => pl.name.toLowerCase().trim() === activeReseller.assignedPriceListName?.toLowerCase().trim()
      );
      if (match) return match;
    }
    // 3. Match by commission percentage
    if (typeof activeReseller.commissionPercentage === 'number') {
      const match = priceLists.find(
        (pl) => (pl.markupPercentage ?? pl.resellerMarkupPercentage) === activeReseller.commissionPercentage
      );
      if (match) return match;
    }
    // 4. Default to first available list
    return priceLists[0] || null;
  }, [manualPriceList, activeReseller, priceLists]);

  const setActivePriceList = (list: ResellerPriceList | null) => {
    setManualPriceList(list);
  };

  // URL Parameter Detection: ?viajante=username or ?lista=listId
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const viajanteParam = params.get('viajante') || params.get('vendedor');
      if (viajanteParam && resellers.length > 0) {
        const match = resellers.find(
          (r) => r.username.toLowerCase() === viajanteParam.toLowerCase() || r.id === viajanteParam
        );
        if (match && (!activeReseller || activeReseller.id !== match.id)) {
          setActiveReseller(match);
        }
      }
      const listParam = params.get('lista') || params.get('price_list');
      if (listParam && priceLists.length > 0) {
        const matchPl = priceLists.find((pl) => pl.id === listParam || pl.name.toLowerCase().includes(listParam.toLowerCase()));
        if (matchPl) {
          setManualPriceList(matchPl);
        }
      }
    } catch {
      // ignore
    }
  }, [resellers, priceLists]);

  const calculateProductPriceForViajante = (product: Product, customList?: ResellerPriceList | null) => {
    const listToUse = customList !== undefined ? customList : activePriceList;
    const storePrice = product.finalPrice;

    let markup = 20; // default 20%
    if (listToUse && typeof listToUse.markupPercentage === 'number') {
      markup = listToUse.markupPercentage;
    } else if (listToUse && typeof listToUse.resellerMarkupPercentage === 'number') {
      markup = listToUse.resellerMarkupPercentage;
    } else if (activeReseller && typeof activeReseller.commissionPercentage === 'number') {
      markup = activeReseller.commissionPercentage;
    }

    // Base calculation: 'store_price' (default) uses product.finalPrice; 'wholesale_cost' uses product.originalPrice
    const calcBase = listToUse?.calculationBase || 'store_price';
    const basePrice = (calcBase === 'wholesale_cost' && product.originalPrice)
      ? product.originalPrice
      : storePrice;

    const viajantePrice = Math.round(basePrice * (1 + markup / 100));
    const profitPerUnit = viajantePrice - storePrice;

    return {
      storePrice,
      viajantePrice,
      profitPerUnit: Math.max(0, profitPerUnit),
      markupPercentage: markup
    };
  };

  const addPriceList = async (listData: Omit<ResellerPriceList, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `list-${Date.now()}`;
    const newList: ResellerPriceList = {
      ...listData,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const currentLists = settings.priceLists && settings.priceLists.length > 0 ? settings.priceLists : DEFAULT_PRICE_LISTS;
    const updated = [newList, ...currentLists];
    await saveSettings({
      ...settings,
      priceLists: updated
    });
    return newId;
  };

  const updatePriceList = async (id: string, updates: Partial<ResellerPriceList>): Promise<void> => {
    const currentLists = settings.priceLists && settings.priceLists.length > 0 ? settings.priceLists : DEFAULT_PRICE_LISTS;
    const updated = currentLists.map((pl) => (pl.id === id ? { ...pl, ...updates, updatedAt: new Date().toISOString() } : pl));
    await saveSettings({
      ...settings,
      priceLists: updated
    });
  };

  const deletePriceList = async (id: string): Promise<void> => {
    const currentLists = settings.priceLists && settings.priceLists.length > 0 ? settings.priceLists : DEFAULT_PRICE_LISTS;
    const updated = currentLists.filter((pl) => pl.id !== id);
    await saveSettings({
      ...settings,
      priceLists: updated
    });
  };

  // =========================================================================
  // PUSH & IN-APP NOTIFICATION METHODS
  // =========================================================================
  const triggerPushNotification = async (
    notifData: Omit<PushNotification, 'id' | 'timestamp' | 'read'>
  ): Promise<string> => {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullNotif: PushNotification = {
      ...notifData,
      id: notifId,
      timestamp: new Date().toISOString(),
      read: false
    };

    // 1. Play soft synthesized chime if sound is enabled
    if (notificationSettings.enabled && notificationSettings.soundEnabled) {
      playNotificationChime();
    }

    // 2. Trigger native push notification if enabled by category
    if (notificationSettings.enabled) {
      const isCategoryEnabled =
        (fullNotif.type === 'order_status' && notificationSettings.orderUpdates) ||
        (fullNotif.type === 'new_product' && notificationSettings.newProducts) ||
        (fullNotif.type === 'promo' && notificationSettings.promos) ||
        fullNotif.type === 'system';

      if (isCategoryEnabled) {
        sendNativePushNotification({
          title: fullNotif.title,
          body: fullNotif.message,
          icon: fullNotif.imageUrl || settings.logoUrl || '/assets/aistudio/LOGO_55e42e2f.jpg',
          tag: fullNotif.orderId || fullNotif.productId || notifId,
          onClick: () => {
            if (fullNotif.orderId) {
              setTrackingOrderId(fullNotif.orderId);
              setIsBudgetTrackingOpen(true);
            }
          }
        });
      }
    }

    // 3. Show in-app banner toast
    setActiveToastNotification(fullNotif);
    setTimeout(() => {
      setActiveToastNotification((current) => (current?.id === notifId ? null : current));
    }, 6000);

    // 4. Save to Firestore and local state
    try {
      await setDoc(doc(db, 'notifications', notifId), fullNotif);
    } catch (err: any) {
      console.warn('Notice saving notification to Firestore:', err.message);
    }

    setNotifications((prev) => [fullNotif, ...prev.filter((n) => n.id !== notifId)]);
    return notifId;
  };

  const markNotificationAsRead = async (id: string): Promise<void> => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch {}
  };

  const markAllNotificationsAsRead = async (): Promise<void> => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    for (const n of notifications) {
      if (!n.read) {
        try {
          await updateDoc(doc(db, 'notifications', n.id), { read: true });
        } catch {}
      }
    }
  };

  const clearNotifications = async (): Promise<void> => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    try {
      localStorage.setItem('nova_notifications', JSON.stringify([]));
    } catch {}
    for (const id of ids) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch {}
    }
  };

  const updateNotificationSettings = (newSettings: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('nova_notification_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const requestPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    const res = await requestPushNotificationPermission();
    setBrowserPermission(res);
    if (res === 'granted') {
      playNotificationChime();
      sendNativePushNotification({
        title: '🎉 ¡Notificaciones Push Activadas!',
        body: 'Te avisaremos cuando tu pedido cambie de estado o lleguen novedades al inventario.',
        icon: settings.logoUrl || '/assets/aistudio/LOGO_55e42e2f.jpg'
      });
    }
    return res;
  };

  const dismissToastNotification = () => {
    setActiveToastNotification(null);
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const generateMercadoPagoLink = async (order: Order) => {
    try {
      const res = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          items: order.items,
          customerEmail: order.customerEmail,
          customerName: order.customerName,
          totalAmount: order.adjustedTotal || order.totalAmount,
          accessToken: settings.mercadoPagoAccessToken
        })
      });

      const data = await res.json();
      if (data.success) {
        return {
          initPoint: data.initPoint,
          deepLink: data.deepLink,
          preferenceId: data.preferenceId
        };
      }
      throw new Error(data.error || 'No se pudo generar preferencia MP');
    } catch (err: any) {
      console.warn('Error generating Mercado Pago link, using fallback:', err.message);
      const simPref = `PREF-${Date.now()}-${order.id}`;
      return {
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/payment/redirect/?preference-id=${simPref}`,
        deepLink: `mercadopago://checkout?pref_id=${simPref}`,
        preferenceId: simPref
      };
    }
  };

  const verifyAndSendBudget = async (
    orderId: string,
    updatedItems: any[],
    notes: string,
    adjustedTotal: number
  ): Promise<string> => {
    const existingOrder = orders.find((o) => o.id === orderId);
    let mpLink = '';

    if (existingOrder) {
      const orderForMp = {
        ...existingOrder,
        items: updatedItems,
        adjustedTotal
      };
      const mpData = await generateMercadoPagoLink(orderForMp);
      mpLink = mpData.initPoint;

      const updates: Partial<Order> = {
        items: updatedItems,
        adjustedTotal,
        budgetNotes: notes,
        budgetStatus: 'budget_ready',
        orderStatus: 'presupuesto_enviado',
        mercadoPagoPaymentLink: mpLink,
        mercadoPagoPreferenceId: mpData.preferenceId,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        await updateDoc(doc(db, 'orders', orderId), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
      );
    }
    return mpLink;
  };

  const markOrderAsPaid = async (orderId: string, method: string, proofUrl?: string) => {
    const updates: Partial<Order> = {
      paymentStatus: 'paid',
      orderStatus: 'en_preparacion',
      budgetStatus: 'order_confirmed',
      paymentMethod: method as any,
      paymentProofUrl: proofUrl || '',
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'orders', orderId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
    );
  };

  const updateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        orderStatus: status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: status } : o))
    );

    // Trigger Push Notification for order status change
    const targetOrder = orders.find((o) => o.id === orderId);
    const statusMeta = ORDER_STATUS_LABELS[status] || {
      label: status,
      emoji: '📦',
      desc: 'El estado del pedido ha sido actualizado.'
    };

    await triggerPushNotification({
      type: 'order_status',
      title: `${statusMeta.emoji} Pedido #${orderId}: ${statusMeta.label}`,
      message: targetOrder?.customerName
        ? `Hola ${targetOrder.customerName}, tu pedido ha cambiado a: ${statusMeta.desc}`
        : `Tu pedido #${orderId} cambió a: ${statusMeta.label}. ${statusMeta.desc}`,
      orderId: orderId,
      newStatus: status,
      imageUrl: targetOrder?.items?.[0]?.imageUrl || undefined
    });
  };

  const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: status } : o))
    );
  };

  const syncProductCostFromLink = async (productId: string, customUrl?: string) => {
    const prod = products.find((p) => p.id === productId);
    const targetUrl = customUrl || prod?.supplierUrl;
    if (!targetUrl || !targetUrl.trim().startsWith('http')) {
      throw new Error('El producto no tiene un enlace de proveedor asignado.');
    }

    const res = await fetch('/api/sync-product-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl.trim(),
        markupPercentage: prod?.markupPercentage || settings.defaultProfitMargin || 40,
        currentOriginalPrice: prod?.originalPrice || 0,
        costCurrency: prod?.costCurrency || 'ARS',
        usdExchangeRate: settings.usdExchangeRate || 1550
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'No se pudo leer el costo desde el enlace.');
    }

    const isOut = Boolean(data.isDiscontinuedOrNotFound) || data.inStock === false || data.originalPrice === 0 || data.finalPrice === 0;

    const updates: Partial<Product> = {
      originalPrice: isOut ? 0 : data.originalPrice,
      costCurrency: data.costCurrency || prod?.costCurrency || 'ARS',
      costInUsd: isOut ? 0 : (data.costInUsd !== undefined ? data.costInUsd : prod?.costInUsd),
      finalPrice: isOut ? 0 : data.finalPrice, // ALWAYS IN ARS! $0 if out of stock
      supplierUrl: targetUrl.trim(),
      inStock: !isOut,
      stock: isOut ? 0 : (prod?.stock ?? 25),
      lastVerifiedStatus: isOut ? 'out_of_stock' : 'in_stock',
      lastCostSyncAt: data.syncedAt || new Date().toISOString()
    };
    if (data.supplierName) updates.supplierName = data.supplierName;

    await updateProduct(productId, updates);

    return {
      success: true,
      oldCost: data.oldCost,
      newCost: isOut ? 0 : data.originalPrice,
      newFinalPrice: isOut ? 0 : data.finalPrice,
      priceChanged: Boolean(data.priceChanged),
      diff: Number(data.diff) || 0,
      supplierName: data.supplierName,
      inStock: !isOut,
      isDiscontinuedOrNotFound: isOut,
      message: isOut
        ? `⚠️ El producto no está más en la web del proveedor. Se agregó el cartel de AGOTADO y su precio se fijó en $0.`
        : data.priceChanged
        ? `Costo actualizado de $${data.oldCost?.toLocaleString('es-AR')} a $${data.originalPrice?.toLocaleString('es-AR')}`
        : `Costo sin cambios ($${data.originalPrice?.toLocaleString('es-AR')})`
    };
  };

  const syncAllProductCostsFromLinks = async (onlyUnsynced: boolean = false) => {
    let linkedProducts = products.filter(
      (p) => p.supplierUrl && p.supplierUrl.trim().startsWith('http')
    );

    if (onlyUnsynced) {
      linkedProducts = linkedProducts.filter((p) => !p.lastCostSyncAt);
    }

    if (linkedProducts.length === 0) {
      return { total: 0, updated: 0, unchanged: 0, failed: 0, results: [] };
    }

    const res = await fetch('/api/sync-multiple-costs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usdExchangeRate: settings.usdExchangeRate || 1550,
        products: linkedProducts.map((p) => ({
          id: p.id,
          title: p.title,
          supplierUrl: p.supplierUrl,
          markupPercentage: p.markupPercentage || settings.defaultProfitMargin || 40,
          costCurrency: p.costCurrency || 'ARS',
          costInUsd: p.costInUsd,
          originalPrice: p.originalPrice,
          finalPrice: p.finalPrice
        }))
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al sincronizar costos masivos');
    }

    // Apply updates to products in state and Firestore
    const updatedResults = data.results || [];
    for (const r of updatedResults) {
      if (r.isDiscontinuedOrNotFound || r.inStock === false || r.newCost === 0 || r.newFinalPrice === 0) {
        await updateProduct(r.id, {
          originalPrice: 0,
          costInUsd: 0,
          finalPrice: 0, // $0
          inStock: false,
          stock: 0,
          lastVerifiedStatus: 'out_of_stock',
          lastCostSyncAt: data.syncedAt || new Date().toISOString()
        });
      } else if (r.success && r.newCost > 0) {
        await updateProduct(r.id, {
          originalPrice: r.newCost,
          finalPrice: r.newFinalPrice, // ALWAYS IN ARS!
          inStock: true,
          lastVerifiedStatus: 'in_stock',
          lastCostSyncAt: data.syncedAt || new Date().toISOString()
        });
      }
    }

    return {
      total: data.total || linkedProducts.length,
      updated: data.updated || 0,
      unchanged: data.unchanged || 0,
      failed: data.failed || 0,
      results: updatedResults
    };
  };

  const syncUnsyncedProductsFromLinks = async () => {
    return syncAllProductCostsFromLinks(true);
  };

  // Automatic Background Cost Sync:
  // Detects if supplier costs change and automatically updates our store in real time
  useEffect(() => {
    if (settings.autoSyncCostsEnabled === false) return;

    let isCancelled = false;

    // 1. Initial background check after 8 seconds of page load to sync any unsynchronized products
    const initialTimer = setTimeout(async () => {
      if (isCancelled) return;
      const unsynced = products.filter(
        (p) => p.supplierUrl && p.supplierUrl.trim().startsWith('http') && !p.lastCostSyncAt
      );
      if (unsynced.length > 0) {
        console.log(`[GangaStore AutoSync] Sincronizando ${unsynced.length} productos pendientes de enlace...`);
        try {
          await syncAllProductCostsFromLinks(true);
        } catch (err: any) {
          console.warn('[GangaStore AutoSync] Notificación inicial:', err.message);
        }
      }
    }, 8000);

    // 2. Periodic background sync for all linked products to automatically detect cost changes
    const intervalMinutes = settings.autoSyncIntervalMinutes || 30;
    const intervalMs = Math.max(5, intervalMinutes) * 60 * 1000;

    const periodicInterval = setInterval(async () => {
      if (isCancelled) return;
      const linked = products.filter(
        (p) => p.supplierUrl && p.supplierUrl.trim().startsWith('http')
      );
      if (linked.length > 0) {
        console.log(`[GangaStore AutoSync] Verificando costos de proveedores en segundo plano (${linked.length} productos)...`);
        try {
          await syncAllProductCostsFromLinks(false);
        } catch (err: any) {
          console.warn('[GangaStore AutoSync] Error periódico:', err.message);
        }
      }
    }, intervalMs);

    return () => {
      isCancelled = true;
      clearTimeout(initialTimer);
      clearInterval(periodicInterval);
    };
  }, [settings.autoSyncCostsEnabled, settings.autoSyncIntervalMinutes, products.length]);

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        clients,
        supplierOrders,
        settings,
        cart,
        cartCount,
        cartTotal,
        isCartOpen,
        isCheckoutOpen,
        selectedProduct,
        activeCategory,
        searchQuery,
        isLoading,
        setIsCartOpen,
        setIsCheckoutOpen,
        setSelectedProduct,
        setActiveCategory,
        setSearchQuery,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addProduct,
        addMultipleProducts,
        updateProduct,
        deleteProduct,
        deleteMultipleProducts,
        updateStock,
        updateGlobalMarkup,
        saveSettings,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        ensureCategoryExists,
        banners,
        saveBanners,
        isBudgetTrackingOpen,
        trackingOrderId,
        setIsBudgetTrackingOpen,
        setTrackingOrderId,
        isSuperOfertasOpen,
        setIsSuperOfertasOpen,
        createOrder,
        verifyAndSendBudget,
        generateMercadoPagoLink,
        markOrderAsPaid,
        updateOrderStatus,
        updatePaymentStatus,
        resetToInitialCatalog,
        addClient,
        updateClient,
        deleteClient,
        createSupplierOrder,
        createSupplierOrdersFromCustomerOrder,
        updateSupplierOrderStatus,
        deleteSupplierOrder,
        syncProductCostFromLink,
        syncAllProductCostsFromLinks,
        syncUnsyncedProductsFromLinks,
        resellers,
        activeReseller,
        setActiveReseller,
        loginReseller,
        logoutReseller,
        addReseller,
        updateReseller,
        deleteReseller,
        isResellerPortalOpen,
        setIsResellerPortalOpen,
        // Price Lists & Viajantes
        priceLists,
        activePriceList,
        setActivePriceList,
        addPriceList,
        updatePriceList,
        deletePriceList,
        calculateProductPriceForViajante,
        // Notifications
        notifications,
        notificationSettings,
        isNotificationCenterOpen,
        unreadNotificationsCount,
        browserPermission,
        requestPermission,
        updateNotificationSettings,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
        setIsNotificationCenterOpen,
        triggerPushNotification,
        activeToastNotification,
        dismissToastNotification
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
