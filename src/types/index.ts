export interface Product {
  id: string;
  title: string;
  description: string;
  originalPrice: number;       // Costo en Pesos Argentinos (ARS)
  costCurrency?: 'ARS' | 'USD'; // Moneda original del costo ('ARS' o 'USD')
  costInUsd?: number;          // Costo en Dólares (U$D) para auto-pesificación
  markupPercentage: number;    // Margen de ganancia (ej: 40%)
  finalPrice: number;          // Precio de venta pesificado al público (ARS)
  category: string;
  imageUrl: string;
  galleryUrls?: string[];
  stock: number;
  supplierUrl?: string;
  supplierName?: string;
  supplierSku?: string;
  lastCostSyncAt?: string;
  lastVerifiedStatus?: 'in_stock' | 'out_of_stock' | 'price_changed' | 'verified';
  isSuperOffer?: boolean;
  superOfferDiscountLabel?: string;
  catalogPageSource?: number;
  inStock: boolean;
  featured?: boolean;
  hasInstallments?: boolean; // Permite activar o desactivar cuotas para este producto individualmente
  customInstallmentsCount?: number; // Cuotas específicas para este producto (ej: 3, 6, 12)
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuperOfferDeal {
  id: string;
  title: string;
  description: string;
  originalPrice: number;    // Precio de costo del catálogo
  markupPercentage: number; // Margen de ganancia aplicado (ej 40%)
  finalPrice: number;       // Precio de venta calculado con ganancia
  regularPrice?: number;    // Precio anterior tachado de referencia
  category: string;
  imageUrl: string;
  galleryUrls?: string[];
  stock: number;
  pageNumber?: number;      // Página o imagen de donde se extrajo
  supplierUrl?: string;     // Link directo de proveedor (ej Inova)
  supplierName?: string;
  supplierSku?: string;
  discountLabel?: string;   // Ej: "35% OFF", "OFERTA FLASH", "SUPER OFERTA"
  inStock: boolean;
  selected?: boolean;       // Seleccionado para importar / publicar
  isSyncedToInventory?: boolean;
  inventoryProductId?: string;
  priceStampConfig?: PriceStampConfig;
}

export interface PriceStampConfig {
  enabled: boolean;
  position: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-left';
  badgeStyle: 'red-gold' | 'yellow-black' | 'dark-neon' | 'blue-metal';
  badgeText: string;
  customPrice?: number;
  stampedImageUrl?: string;
}

export interface SuperOfferCatalog {
  id: string;
  title: string;
  description?: string;
  sourceType: 'pdf' | 'images' | 'inova' | 'manual';
  fileName?: string;
  filePagesCount?: number;
  createdAt: string;
  defaultMarkup: number;
  items: SuperOfferDeal[];
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
  supplierUrl?: string;
  supplierName?: string;
  verifiedStock?: boolean;
  availableQuantity?: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity?: string;
  customerDniCuit?: string;
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'bank_transfer' | 'mercadopago' | 'card_gateway' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus:
    | 'presupuesto_pendiente'
    | 'presupuesto_enviado'
    | 'pagado'
    | 'en_preparacion'
    | 'enviado'
    | 'despachado'
    | 'entregado'
    | 'cancelado';
  budgetStatus?: 'stock_verification_pending' | 'budget_ready' | 'order_confirmed' | 'rejected';
  budgetNotes?: string;
  mercadoPagoPreferenceId?: string;
  mercadoPagoPaymentLink?: string;
  mercadoPagoPaymentId?: string;
  adjustedTotal?: number;
  verifiedAt?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  dispatchedAt?: string;
  paymentProofUrl?: string;
  // Reseller / Vendedor attribution fields
  isResellerOrder?: boolean;
  resellerId?: string;
  resellerName?: string;
  resellerCommissionPercentage?: number;
  resellerCommissionAmount?: number;
  resellerWholesaleTotal?: number;
  assignedPriceListId?: string;
  assignedPriceListName?: string;
  shippingCarrier?: string;
  customerProvince?: string;
  customerPostalCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ResellerUser {
  id: string;
  name: string;
  username: string; // Login username or email
  password: string; // Password assigned by admin
  phone?: string;
  email?: string;
  zone?: string; // Zona asignada (ej: Interior, CABA, Gran Bs As, Ruta 2)
  assignedPriceListId?: string; // ID de la lista de precios asignada al viajante
  assignedPriceListName?: string; // Nombre cacheado de la lista asignada
  commissionPercentage: number; // % ganancia/margen default (ej 25)
  active: boolean;
  createdAt: string;
  notes?: string;
  totalOrdersCount?: number;
  totalSalesAmount?: number;
  lastLoginAt?: string;
}

export interface CustomerClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  dniCuit?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderId?: string;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupplierOrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitCost: number;        // Costo unitario a pagar al proveedor en ARS
  costCurrency?: 'ARS' | 'USD';
  unitCostUsd?: number;
  totalCost: number;       // quantity * unitCost
  customerSalePrice: number; // Precio vendido al cliente
  totalSalePrice: number;    // quantity * customerSalePrice
  supplierUrl?: string;    // Enlace directo al producto en la web del proveedor
  supplierSku?: string;
  imageUrl?: string;
}

export interface SupplierPurchaseOrder {
  id: string;                      // ej: "OC-1792400012"
  orderNumber: string;             // ej: "OC #0012"
  customerOrderId: string;         // ID del pedido del cliente asociado
  customerName: string;
  customerPhone?: string;
  supplierName: string;            // Proveedor asignado (ej: Inova ARG, Plutotec)
  supplierPhone?: string;          // WhatsApp del proveedor si se conoce
  supplierEmail?: string;
  items: SupplierOrderItem[];
  totalCostToPay: number;          // Total que debemos pagar al proveedor (ARS)
  totalCostUsd?: number;           // Total en USD si los productos están en dólares
  customerSaleTotal: number;       // Total que nos paga el cliente por estos items
  estimatedProfit: number;         // customerSaleTotal - totalCostToPay (Ganancia neta)
  status: 'pendiente_encargar' | 'encargado_pagado' | 'en_transito' | 'recibido_deposito' | 'cancelado';
  supplierOrderCode?: string;      // Nro de orden o factura que nos dio el proveedor
  notes?: string;
  trackingNumber?: string;
  orderedAt?: string;
  paidAt?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HeroBannerFeature {
  id: string;
  icon: 'zap' | 'credit-card' | 'shield' | 'flame' | 'truck' | 'tag' | 'gift' | 'clock' | 'sparkles' | 'badge';
  title: string;
  description: string;
}

export interface HeroBannerItem {
  id: string;
  badgeText: string;
  badgeIcon?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  showCountdown: boolean;
  countdownHours?: number;
  countdownMinutes?: number;
  countdownLabel?: string;
  primaryButtonText: string;
  primaryButtonAction?: 'scroll_catalog' | 'category' | 'link';
  primaryButtonTarget?: string;
  secondaryButtonText?: string;
  secondaryButtonCategory?: string;
  secondaryButtonLink?: string;
  backgroundGradient?: string;
  imageUrl?: string;
  features?: HeroBannerFeature[];
  showFeatures?: boolean; // Permite activar o desactivar las tarjetas de beneficios del banner
  featuredProductIds?: string[]; // IDs de productos del inventario vinculados como destacados
  active: boolean;
  sortOrder?: number;
}

export interface StoreCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  imageUrl?: string;
  isCustom?: boolean;
}

export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city?: string;
  cuit?: string;
  logoUrl?: string;
  defaultProfitMargin: number; // Margen en % (ej: 40 para 40%)
  usdExchangeRate: number;     // Cotización Dólar a Pesos ARS (ej: 1550)
  dollarRateType?: 'blue' | 'oficial' | 'manual';
  lastDollarSyncAt?: string;
  autoPesifyWithUsd?: boolean;
  autoSyncCostsEnabled?: boolean;     // Sincronización automática de costos periódica en segundo plano
  autoSyncIntervalMinutes?: number;  // Intervalo en minutos para auto-sincronizar (ej: 30)
  lastAutoCostSyncAt?: string;       // Timestamp del último auto-sync ejecutado
  currencySymbol: string;      // ej: "$"
  bankName: string;
  bankCbuAlias: string;
  bankAccountHolder: string;
  bankCuit?: string;
  gatewayEnabled: boolean;
  freeShippingThreshold: number;
  announcementText: string;
  banners?: HeroBannerItem[];
  categories?: StoreCategory[];
  // Mercado Pago configuration
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoAliasCvu?: string;
  mercadoPagoNotificationWebhookUrl?: string;
  priceLists?: ResellerPriceList[];
  resellers?: ResellerUser[];
  hideBannerFeatures?: boolean; // Permite desactivar globalmente las tarjetas de beneficios en todos los banners
  // Configuración de Cuotas / Financiación en productos en general
  enableInstallments?: boolean; // Habilitar o deshabilitar cuotas en productos en general (default: true)
  installmentsCount?: number;   // Cantidad de cuotas ofrecidas (ej: 3, 6, 9, 12. Default: 3)
  installmentsType?: 'fixed' | 'interest_free'; // 'interest_free' ("sin interés") o 'fixed' ("fijas")
  installmentsMinAmount?: number; // Monto mínimo en $ para ofrecer cuotas (0 para sin mínimo)
  updatedAt?: string;
}

export interface ResellerPriceList {
  id: string;
  name: string;
  description?: string;
  resellerName?: string;
  markupPercentage: number;           // % de ganancia / recargo ARRIBA del precio de venta de los productos de la tienda (ej: 20%)
  calculationBase?: 'store_price' | 'wholesale_cost'; // Por defecto 'store_price' (arriba del precio de venta online)
  wholesaleMarkupPercentage?: number; // Retrocompatibilidad
  resellerMarkupPercentage?: number;  // Retrocompatibilidad
  hideOriginalCost: boolean;          // Ocultar costo base del proveedor
  showResellerProfit: boolean;        // Mostrar ganancia neta del revendedor en $
  showSuggestedPvp: boolean;          // Mostrar PVP sugerido
  categoryFilter?: string;            // 'Todas' o categoría específica
  selectedProductIds?: string[];      // Lista de IDs seleccionados o vacío para todos
  notes?: string;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type NotificationType = 'order_status' | 'new_product' | 'promo' | 'system';

export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  orderId?: string;
  productId?: string;
  newStatus?: Order['orderStatus'];
  imageUrl?: string;
  actionUrl?: string;
}

export interface NotificationSettings {
  enabled: boolean;          // Master toggle for notifications
  orderUpdates: boolean;     // Alert on order status changes
  newProducts: boolean;      // Alert on new products added to inventory
  promos: boolean;           // Alert on promotions and flash sales
  soundEnabled: boolean;     // Play sound on notification
}

