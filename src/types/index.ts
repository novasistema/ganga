export interface Product {
  id: string;
  title: string;
  description: string;
  originalPrice: number;
  markupPercentage: number;
  finalPrice: number;
  category: string;
  imageUrl: string;
  galleryUrls?: string[];
  stock: number;
  supplierUrl?: string;
  supplierSku?: string;
  inStock: boolean;
  featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string;
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
  customerNotes?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'bank_transfer' | 'mercadopago' | 'card_gateway' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'presupuesto_pendiente' | 'presupuesto_enviado' | 'pagado' | 'en_preparacion' | 'despachado' | 'entregado' | 'cancelado';
  budgetStatus?: 'stock_verification_pending' | 'budget_ready' | 'order_confirmed' | 'rejected';
  budgetNotes?: string;
  mercadoPagoPreferenceId?: string;
  mercadoPagoPaymentLink?: string;
  mercadoPagoPaymentId?: string;
  adjustedTotal?: number;
  verifiedAt?: string;
  trackingNumber?: string;
  paymentProofUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanySettings {
  companyName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  logoUrl?: string;
  defaultProfitMargin: number; // e.g. 35 for 35%
  currencySymbol: string;      // e.g. "$"
  bankName: string;
  bankCbuAlias: string;
  bankAccountHolder: string;
  bankCuit?: string;
  gatewayEnabled: boolean;
  freeShippingThreshold: number;
  announcementText: string;
  // Mercado Pago configuration
  mercadoPagoAccessToken?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoAliasCvu?: string;
  mercadoPagoNotificationWebhookUrl?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
