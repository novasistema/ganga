export interface ProductSpec {
  label: string;
  desc: string;
  iconName?: string;
}

export interface ProductTierPricing {
  tier5?: number;
  tier10?: number;
  tier100?: number;
}

export interface Product {
  id: string;
  name: string;
  hook: string;
  category: string;
  sku: string;
  code?: string;
  brand: string;
  priceUnit: number;
  priceTiers: ProductTierPricing;
  badges: string[];
  specs: ProductSpec[];
  image: string;
  stock: number;
  isNew?: boolean;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPriceApplied: number;
  totalPrice: number;
}

export type DealStage = 'lead' | 'contacted' | 'quoted' | 'payment_pending' | 'won' | 'lost';

export interface Deal {
  id: string;
  customerName: string;
  businessName?: string;
  phone: string;
  email?: string;
  city: string;
  stage: DealStage;
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  assignedSalesperson?: string;
}

export type OrderStatus = 'pending_payment' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  businessName?: string;
  documentId?: string; // DNI o CUIT
  phone: string;
  email?: string;
  shippingAddress: string;
  city: string;
  province: string;
  shippingMethod: 'transporte_expreso' | 'retiro_deposito' | 'correo_argentino';
  shippingCost: number;
  paymentMethod: 'transferencia' | 'tarjeta_segura' | 'efectivo_deposito' | 'acuerdo_comercial';
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
    transactionId?: string;
  };
  invoiceType: 'A' | 'B';
  items: CartItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  cuitOrDni: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  tier: 'Minorista' | 'Mayorista Plata' | 'Mayorista Oro' | 'Distribuidor';
  totalSpent: number;
  orderCount: number;
  notes: string;
  lastContact: string;
}

export interface Interaction {
  id: string;
  clientId: string;
  dealId?: string;
  type: 'whatsapp' | 'llamada' | 'email' | 'reunion' | 'nota';
  note: string;
  author: string;
  createdAt: string;
  urgency?: 'normal' | 'high' | 'urgent';
  clientName?: string;
}

export type NotificationType = 'new_order' | 'urgent_interaction' | 'payment_received' | 'low_stock' | 'deal_won';
export type NotificationPriority = 'normal' | 'high' | 'urgent';

export interface CrmNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  priority: NotificationPriority;
  entityId?: string;
  entityType?: 'order' | 'interaction' | 'deal' | 'client';
  metadata?: {
    orderNumber?: string;
    total?: number;
    clientName?: string;
    phone?: string;
    urgencyReason?: string;
  };
}

export interface CompanySettings {
  companyName: string;
  legalName: string;
  cuit: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  minimumOrder: number;
  bankName: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cardPaymentsEnabled: boolean;
  installmentsAllowed: number[];
  updatedAt: string;
}

export type SupplierPlatform = 'WooCommerce' | 'Shopify' | 'Tiendanube' | 'Magento' | 'MercadoLibre / Custom';
export type RoundingRule = 'none' | 'hundred' | 'nine_ninety' | 'thousand';
export type SupplierProductStatus = 'draft' | 'published' | 'hidden';

export interface SupplierSource {
  id: string;
  name: string;
  url: string;
  platform: SupplierPlatform;
  skuPrefix: string;
  defaultMarginPercent: number;
  status: 'active' | 'inactive' | 'syncing';
  lastSyncAt: string;
  productsCount: number;
  notes?: string;
  currency?: 'ARS' | 'USD';
  exchangeRate?: number;
}

export interface SupplierProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  sourceUrl: string;
  originalTitle: string;
  sanitizedTitle: string;
  originalSku: string;
  internalSku: string;
  category: Product['category'];
  costArs: number;
  previousCostArs?: number;
  costChangeDelta?: number;
  stock: number;
  image: string;
  description?: string;
  specs?: ProductSpec[];
  marginPercent: number;
  fixedMarkupArs: number;
  roundingRule: RoundingRule;
  finalSalePrice: number;
  status: SupplierProductStatus;
  publishedProductId?: string;
  lastCheckedAt: string;
  hasCostChanged: boolean;
}

