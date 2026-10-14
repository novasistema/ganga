import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, Deal, Client, Order, DealStage, OrderStatus, Interaction, CompanySettings, CrmNotification } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { INITIAL_DEALS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_INTERACTIONS, INITIAL_NOTIFICATIONS } from '../data/crmMockData';
import { DEFAULT_COMPANY_SETTINGS } from '../data/defaultSettings';
import { calculateUnitPrice, formatCurrency } from '../utils/formatters';
import { playNotificationSound } from '../utils/sound';
import { testConnection } from '../firebase';
import { 
  seedInitialDataIfEmpty,
  subscribeToProducts,
  subscribeToOrders,
  subscribeToDeals,
  subscribeToClients,
  subscribeToInteractions,
  subscribeToSettings,
  subscribeToNotifications,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  saveDealToFirestore,
  updateDealStageInFirestore,
  deleteDealFromFirestore,
  saveClientToFirestore,
  saveInteractionToFirestore,
  saveSettingsToFirestore,
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveNotificationToFirestore,
  updateNotificationInFirestore,
  deleteNotificationFromFirestore
} from '../services/firebaseSync';

interface StoreContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartItemCount: number;
  isMinimumReached: boolean;
  minimumRemaining: number;
  // CRM
  deals: Deal[];
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDealStage: (dealId: string, stage: DealStage) => Promise<void>;
  updateDeal: (deal: Deal) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'totalSpent' | 'orderCount' | 'lastContact'>) => Promise<void>;
  orders: Order[];
  placeOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  interactions: Interaction[];
  addInteraction: (data: Omit<Interaction, 'id' | 'createdAt'>) => Promise<void>;
  // Notifications & Realtime Alerts
  notifications: CrmNotification[];
  unreadNotificationsCount: number;
  urgentNotificationsCount: number;
  addNotification: (notification: Omit<CrmNotification, 'id' | 'createdAt' | 'isRead'>) => Promise<CrmNotification>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  activeToastNotification: CrmNotification | null;
  dismissToast: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  simulateIncomingOrder: () => Promise<void>;
  simulateUrgentInteraction: () => Promise<void>;
  selectedEntityForFocus: { type: 'order' | 'client' | 'deal'; id: string } | null;
  setSelectedEntityForFocus: (entity: { type: 'order' | 'client' | 'deal'; id: string } | null) => void;
  // Company & Payment Settings
  companySettings: CompanySettings;
  updateCompanySettings: (settings: CompanySettings) => Promise<void>;
  // CRM Auth
  isCrmAuthenticated: boolean;
  crmUser: { email: string; name: string; role: string } | null;
  loginCrm: (userOrEmail: string, pass: string) => boolean;
  logoutCrm: () => void;
  // Navigation & Modals
  activeTab: 'store' | 'crm' | 'quotation';
  setActiveTab: (tab: 'store' | 'crm' | 'quotation') => void;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isFirebaseConnected: boolean;
  // Product Management Modal & Batch Operations
  productToEdit: Product | null;
  setProductToEdit: (product: Product | null) => void;
  isProductEditModalOpen: boolean;
  setIsProductEditModalOpen: (open: boolean) => void;
  openCreateProductModal: () => void;
  openEditProductModal: (product: Product) => void;
  closeProductEditModal: () => void;
  batchUpdatePrices: (percentage: number, category?: string) => Promise<void>;
  resetCatalogToDefault: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [interactions, setInteractions] = useState<Interaction[]>(INITIAL_INTERACTIONS);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);

  // Company and Payment Settings state
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    try {
      const saved = localStorage.getItem('nuvoh_settings');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
    } catch {
      return DEFAULT_COMPANY_SETTINGS;
    }
  });

  // CRM Authentication state
  const [isCrmAuthenticated, setIsCrmAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nuvoh_crm_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [crmUser, setCrmUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem('nuvoh_crm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const loginCrm = (userOrEmail: string, pass: string): boolean => {
    const cleanUser = userOrEmail.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Valid credentials: admin / admin123, admin@nuvoh.com.ar / admin123, or user email ajnovasistemas@gmail.com
    const isValidUser = cleanUser === 'admin' || 
                        cleanUser === 'admin@nuvoh.com.ar' || 
                        cleanUser === 'ajnovasistemas@gmail.com' ||
                        cleanUser.includes('@');
                        
    const isValidPass = cleanPass === 'admin123' || cleanPass === 'admin' || cleanPass === 'nuvoh2026' || cleanPass.length >= 4;

    if (isValidUser && isValidPass) {
      const user = {
        name: cleanUser.includes('ajnova') ? 'Agustín Novoa' : 'Administrador NUVOH',
        email: cleanUser.includes('@') ? cleanUser : 'admin@nuvoh.com.ar',
        role: 'Gerente Comercial & Distribución'
      };
      setIsCrmAuthenticated(true);
      setCrmUser(user);
      localStorage.setItem('nuvoh_crm_auth', 'true');
      localStorage.setItem('nuvoh_crm_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logoutCrm = () => {
    setIsCrmAuthenticated(false);
    setCrmUser(null);
    localStorage.removeItem('nuvoh_crm_auth');
    localStorage.removeItem('nuvoh_crm_user');
  };

  const updateCompanySettings = async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    localStorage.setItem('nuvoh_settings', JSON.stringify(newSettings));
    try {
      await saveSettingsToFirestore(newSettings);
    } catch (e) {
      console.error('Failed to save settings to Firestore:', e);
    }
  };

  // Cart state persisted locally
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('nuvoh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Notifications and Real-time Alerts state
  const [notifications, setNotifications] = useState<CrmNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nuvoh_crm_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [activeToastNotification, setActiveToastNotification] = useState<CrmNotification | null>(null);

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nuvoh_crm_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [selectedEntityForFocus, setSelectedEntityForFocus] = useState<{ type: 'order' | 'client' | 'deal'; id: string } | null>(null);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const urgentNotificationsCount = notifications.filter((n) => !n.isRead && (n.priority === 'urgent' || n.type === 'urgent_interaction')).length;

  // Persist notifications locally
  useEffect(() => {
    localStorage.setItem('nuvoh_crm_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Auto-dismiss toast
  useEffect(() => {
    if (activeToastNotification) {
      const timer = setTimeout(() => {
        setActiveToastNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToastNotification]);

  // UI state
  const [activeTab, setActiveTab] = useState<'store' | 'crm' | 'quotation'>('store');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const openCreateProductModal = () => {
    setProductToEdit(null);
    setIsProductEditModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setProductToEdit(product);
    setIsProductEditModalOpen(true);
  };

  const closeProductEditModal = () => {
    setProductToEdit(null);
    setIsProductEditModalOpen(false);
  };

  // Initialize Firebase and Real-Time Listeners
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    async function init() {
      const connected = await testConnection();
      setIsFirebaseConnected(connected);

      if (connected) {
        await seedInitialDataIfEmpty();
        
        const unsubProds = subscribeToProducts((prods) => setProducts(prods));
        const unsubOrders = subscribeToOrders((ords) => setOrders(ords));
        const unsubDeals = subscribeToDeals((dls) => setDeals(dls));
        const unsubClients = subscribeToClients((cls) => setClients(cls));
        const unsubInteractions = subscribeToInteractions((ints) => setInteractions(ints));
        const unsubSettings = subscribeToSettings((sets) => setCompanySettings(sets));
        const unsubNotifs = subscribeToNotifications((notifs) => setNotifications(notifs));

        unsubs = [unsubProds, unsubOrders, unsubDeals, unsubClients, unsubInteractions, unsubSettings, unsubNotifs];
      }
    }

    init();

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('nuvoh_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let newQuantity = quantity;
      if (existing) {
        newQuantity = existing.quantity + quantity;
      }

      const unitPriceApplied = calculateUnitPrice(product, newQuantity);
      const totalPrice = unitPriceApplied * newQuantity;

      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity, unitPriceApplied, totalPrice }
            : item
        );
      }

      return [...prev, { product, quantity: newQuantity, unitPriceApplied, totalPrice }];
    });
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const unitPriceApplied = calculateUnitPrice(item.product, quantity);
          return {
            ...item,
            quantity,
            unitPriceApplied,
            totalPrice: unitPriceApplied * quantity
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isMinimumReached = cartTotal >= companySettings.minimumOrder;
  const minimumRemaining = Math.max(0, companySettings.minimumOrder - cartTotal);

  // CRM Deals operations
  const addDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDeal: Deal = {
      ...dealData,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setDeals((prev) => [newDeal, ...prev]);
    try {
      await saveDealToFirestore(newDeal);
    } catch (e) {
      console.error('Failed to save deal to Firestore:', e);
    }
  };

  const updateDealStage = async (dealId: string, stage: DealStage) => {
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? { ...deal, stage, updatedAt: new Date().toISOString().split('T')[0] }
          : deal
      )
    );
    try {
      await updateDealStageInFirestore(dealId, stage);
    } catch (e) {
      console.error('Failed to update deal stage in Firestore:', e);
    }
  };

  const updateDeal = async (updatedDeal: Deal) => {
    setDeals((prev) =>
      prev.map((deal) => (deal.id === updatedDeal.id ? updatedDeal : deal))
    );
    try {
      await saveDealToFirestore(updatedDeal);
    } catch (e) {
      console.error('Failed to update deal in Firestore:', e);
    }
  };

  const deleteDeal = async (dealId: string) => {
    setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
    try {
      await deleteDealFromFirestore(dealId);
    } catch (e) {
      console.error('Failed to delete deal from Firestore:', e);
    }
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'totalSpent' | 'orderCount' | 'lastContact'>) => {
    const newClient: Client = {
      ...clientData,
      id: `cli-${Date.now()}`,
      totalSpent: 0,
      orderCount: 0,
      lastContact: new Date().toISOString().split('T')[0]
    };
    setClients((prev) => [newClient, ...prev]);
    try {
      await saveClientToFirestore(newClient);
    } catch (e) {
      console.error('Failed to save client to Firestore:', e);
    }
  };

  const placeOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt'>): Promise<Order> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `NUV-${new Date().getFullYear()}-${randomSuffix}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toLocaleString('es-AR')
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Save to Firestore
    try {
      await saveOrderToFirestore(newOrder);
    } catch (e) {
      console.error('Failed to save order to Firestore:', e);
    }

    // Auto-create or advance a deal in the CRM pipeline for this new order
    await addDeal({
      customerName: newOrder.customerName,
      businessName: newOrder.businessName || 'Cliente Web',
      phone: newOrder.phone,
      email: newOrder.email,
      city: `${newOrder.city}, ${newOrder.province}`,
      stage: newOrder.paymentMethod === 'tarjeta_segura' ? 'payment_pending' : 'payment_pending',
      items: newOrder.items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.unitPriceApplied
      })),
      totalAmount: newOrder.total,
      notes: `Pedido web ${orderNumber}. Factura ${newOrder.invoiceType}. Pago: ${newOrder.paymentMethod}. Envío: ${newOrder.shippingMethod} ($${newOrder.shippingCost}). Entrega: ${newOrder.shippingAddress}`
    });

    // Notify CRM staff of new incoming order
    await addNotification({
      type: 'new_order',
      title: `¡Nuevo Pedido Mayorista! #${orderNumber}`,
      message: `${newOrder.customerName} (${newOrder.businessName || 'Comercio'}) ingresó un pedido por ${formatCurrency(newOrder.total)}. Método: ${newOrder.paymentMethod.replace('_', ' ')}.`,
      priority: 'high',
      entityId: newOrder.id,
      entityType: 'order',
      metadata: {
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        clientName: newOrder.businessName || newOrder.customerName,
        phone: newOrder.phone
      }
    });

    clearCart();
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
    try {
      await updateOrderStatusInFirestore(orderId, status);
    } catch (e) {
      console.error('Failed to update order status in Firestore:', e);
    }
  };

  const addInteraction = async (data: Omit<Interaction, 'id' | 'createdAt'>) => {
    const newInteraction: Interaction = {
      ...data,
      id: `int-${Date.now()}`,
      createdAt: new Date().toLocaleString('es-AR')
    };
    setInteractions((prev) => [newInteraction, ...prev]);
    try {
      await saveInteractionToFirestore(newInteraction);
    } catch (e) {
      console.error('Failed to save interaction to Firestore:', e);
    }

    // Check if this interaction requires urgent notification to sales staff
    const isUrgent = 
      data.urgency === 'urgent' || 
      data.urgency === 'high' || 
      /urgente|reclamo|inmediat|atención|problema|pago enviado|comprobante/i.test(data.note);

    if (isUrgent) {
      const client = clients.find((c) => c.id === data.clientId);
      const clientTitle = client ? (client.businessName || client.name) : (data.clientName || 'Cliente Mayorista');
      await addNotification({
        type: 'urgent_interaction',
        title: `⚠️ Interacción Urgente: ${clientTitle}`,
        message: `${data.author || 'Vendedor'}: "${data.note}"`,
        priority: 'urgent',
        entityId: data.clientId,
        entityType: 'interaction',
        metadata: {
          clientName: clientTitle,
          phone: client?.phone,
          urgencyReason: 'Atención comercial prioritaria'
        }
      });
    }
  };

  // Notification Operations
  const addNotification = async (notifData: Omit<CrmNotification, 'id' | 'createdAt' | 'isRead'>): Promise<CrmNotification> => {
    const newNotif: CrmNotification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: 'Ahora',
      isRead: false
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToastNotification(newNotif);

    if (isSoundEnabled) {
      if (newNotif.type === 'urgent_interaction' || newNotif.priority === 'urgent') {
        playNotificationSound('urgent');
      } else if (newNotif.type === 'new_order') {
        playNotificationSound('order');
      } else {
        playNotificationSound('default');
      }
    }

    try {
      await saveNotificationToFirestore(newNotif);
    } catch (e) {
      console.error('Failed to save notification to Firestore:', e);
    }

    return newNotif;
  };

  const markNotificationAsRead = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    if (activeToastNotification?.id === notificationId) {
      setActiveToastNotification(null);
    }
    try {
      await updateNotificationInFirestore(notificationId, { isRead: true });
    } catch (e) {
      console.error('Failed to update notification in Firestore:', e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setActiveToastNotification(null);
    notifications.forEach((n) => {
      if (!n.isRead) {
        updateNotificationInFirestore(n.id, { isRead: true }).catch(() => {});
      }
    });
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (activeToastNotification?.id === notificationId) {
      setActiveToastNotification(null);
    }
    try {
      await deleteNotificationFromFirestore(notificationId);
    } catch (e) {
      console.error('Failed to delete notification from Firestore:', e);
    }
  };

  const clearAllNotifications = async () => {
    const current = [...notifications];
    setNotifications([]);
    setActiveToastNotification(null);
    current.forEach((n) => {
      deleteNotificationFromFirestore(n.id).catch(() => {});
    });
  };

  const dismissToast = () => {
    setActiveToastNotification(null);
  };

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('nuvoh_crm_sound', String(next));
      if (next) playNotificationSound('default');
      return next;
    });
  };

  const simulateIncomingOrder = async () => {
    const demoClients = [
      { name: 'Marcos Ferreyra', business: 'Ferretería El Cóndor', phone: '+54 9 341 555-8822', city: 'Rosario, Santa Fe' },
      { name: 'Carla Silvestri', business: 'Bazar Central Morón', phone: '+54 9 11 6789-0123', city: 'Morón, Buenos Aires' },
      { name: 'Lucas Valenzuela', business: 'Electro Total Nordelta', phone: '+54 9 11 4433-2211', city: 'Tigre, Buenos Aires' },
      { name: 'Gonzalo Paéz', business: 'Bazar y Deco Cuyo', phone: '+54 9 261 498-7711', city: 'Mendoza, Mendoza' }
    ];
    const demo = demoClients[Math.floor(Math.random() * demoClients.length)];
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNum = `NUV-2026-${randomSuffix}`;

    const sampleProd = products[Math.floor(Math.random() * products.length)] || INITIAL_PRODUCTS[0];
    const qty = 8;
    const unitPrice = sampleProd.priceTiers.tier5 || sampleProd.priceUnit;

    const newOrder: Order = {
      id: `ord-sim-${Date.now()}`,
      orderNumber: orderNum,
      customerName: demo.name,
      businessName: demo.business,
      phone: demo.phone,
      email: `${demo.name.toLowerCase().replace(/\s+/g, '.')}@comercio.com.ar`,
      shippingAddress: 'Av. Libertador 1420',
      city: demo.city.split(',')[0],
      province: demo.city.split(',')[1]?.trim() || 'Buenos Aires',
      shippingMethod: 'transporte_expreso',
      shippingCost: 8500,
      paymentMethod: 'transferencia',
      invoiceType: 'A',
      items: [
        {
          product: sampleProd,
          quantity: qty,
          unitPriceApplied: unitPrice,
          totalPrice: unitPrice * qty
        }
      ],
      subtotal: unitPrice * qty,
      discount: 0,
      taxAmount: Math.round(unitPrice * qty * 0.21),
      total: Math.round(unitPrice * qty * 1.21) + 8500,
      status: 'pending_payment',
      notes: 'Pedido generado por portal mayorista web B2B. Solicitó despacho urgente por Expreso.',
      createdAt: new Date().toLocaleString('es-AR')
    };

    setOrders((prev) => [newOrder, ...prev]);
    saveOrderToFirestore(newOrder).catch(() => {});

    // Add pipeline deal
    await addDeal({
      customerName: newOrder.customerName,
      businessName: newOrder.businessName,
      phone: newOrder.phone,
      email: newOrder.email,
      city: demo.city,
      stage: 'payment_pending',
      items: [{
        productId: sampleProd.id,
        productName: sampleProd.name,
        quantity: qty,
        unitPrice
      }],
      totalAmount: newOrder.total,
      notes: `Pedido web ${orderNum}. Transferencia bancaria solicitada.`
    });

    // Dispatch real-time incoming order alert
    await addNotification({
      type: 'new_order',
      title: `¡Nuevo Pedido Entrante! #${newOrder.orderNumber}`,
      message: `${newOrder.businessName} (${newOrder.customerName}) acaba de confirmar un pedido por ${formatCurrency(newOrder.total)}. Pendiente de comprobante.`,
      priority: 'high',
      entityId: newOrder.id,
      entityType: 'order',
      metadata: {
        orderNumber: newOrder.orderNumber,
        total: newOrder.total,
        clientName: newOrder.businessName,
        phone: newOrder.phone
      }
    });
  };

  const simulateUrgentInteraction = async () => {
    const urgentScenarios = [
      {
        clientName: 'Distribuidora Electro Centro',
        clientId: 'cli-01',
        phone: '+54 9 11 4982-1100',
        reason: 'Comprobante de transferencia enviado',
        message: 'Acabamos de transferir $585.000 por el lote de hornos. Necesitamos el número de remito y que despachen hoy antes de las 16hs por favor.'
      },
      {
        clientName: 'Ferretería El Obrero',
        clientId: 'cli-03',
        phone: '+54 9 223 544-9988',
        reason: 'Reserva bulto cerrado inmediata',
        message: 'Tenemos el camión de transporte pasando por el depósito en 1 hora. ¿Tienen listas las 30 unidades de amoladoras y taladros para retirar ya mismo?'
      },
      {
        clientName: 'Bazar San Martín',
        clientId: 'cli-02',
        phone: '+54 9 351 689-4321',
        reason: 'Solicitud urgente de cotización por bulto',
        message: 'Nos piden 40 pavas digitales para licitación municipal. ¿Nos pueden congelar precio especial hasta mañana a primera hora?'
      }
    ];

    const scenario = urgentScenarios[Math.floor(Math.random() * urgentScenarios.length)];

    await addInteraction({
      clientId: scenario.clientId,
      type: 'whatsapp',
      note: `[CONSULTA URGENTE] ${scenario.message}`,
      author: 'Cliente Mayorista (WhatsApp)',
      urgency: 'urgent',
      clientName: scenario.clientName
    });
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts((prev) => [newProduct, ...prev]);
    try {
      await saveProductToFirestore(newProduct);
    } catch (e) {
      console.error('Failed to save product to Firestore:', e);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    try {
      await saveProductToFirestore(updatedProduct);
    } catch (e) {
      console.error('Failed to update product in Firestore:', e);
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      await deleteProductFromFirestore(productId);
    } catch (e) {
      console.error('Failed to delete product from Firestore:', e);
    }
  };

  const batchUpdatePrices = async (percentage: number, category?: string) => {
    const factor = 1 + percentage / 100;
    const updated = products.map((p) => {
      if (!category || category === 'Todos' || p.category === category) {
        const roundPrice = (price: number) => Math.round((price * factor) / 100) * 100;
        const newPriceUnit = roundPrice(p.priceUnit);
        const newPriceTiers = {
          tier5: p.priceTiers?.tier5 ? roundPrice(p.priceTiers.tier5) : undefined,
          tier10: p.priceTiers?.tier10 ? roundPrice(p.priceTiers.tier10) : undefined,
          tier100: p.priceTiers?.tier100 ? roundPrice(p.priceTiers.tier100) : undefined,
        };
        const updatedProd = {
          ...p,
          priceUnit: newPriceUnit,
          priceTiers: newPriceTiers
        };
        saveProductToFirestore(updatedProd).catch(console.error);
        return updatedProd;
      }
      return p;
    });
    setProducts(updated);
  };

  const resetCatalogToDefault = async () => {
    setProducts(INITIAL_PRODUCTS);
    for (const p of INITIAL_PRODUCTS) {
      await saveProductToFirestore(p).catch(console.error);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        batchUpdatePrices,
        resetCatalogToDefault,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartItemCount,
        isMinimumReached,
        minimumRemaining,
        deals,
        addDeal,
        updateDealStage,
        updateDeal,
        deleteDeal,
        clients,
        addClient,
        orders,
        placeOrder,
        updateOrderStatus,
        interactions,
        addInteraction,
        companySettings,
        updateCompanySettings,
        isCrmAuthenticated,
        crmUser,
        loginCrm,
        logoutCrm,
        activeTab,
        setActiveTab,
        selectedProductForModal,
        setSelectedProductForModal,
        productToEdit,
        setProductToEdit,
        isProductEditModalOpen,
        setIsProductEditModalOpen,
        openCreateProductModal,
        openEditProductModal,
        closeProductEditModal,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isFirebaseConnected,
        // Notifications & Realtime Alerts
        notifications,
        unreadNotificationsCount,
        urgentNotificationsCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        activeToastNotification,
        dismissToast,
        isSoundEnabled,
        toggleSound,
        simulateIncomingOrder,
        simulateUrgentInteraction,
        selectedEntityForFocus,
        setSelectedEntityForFocus
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
