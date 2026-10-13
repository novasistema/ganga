export interface Product {
  id: string;
  title: string;
  sku: string;
  category: string;
  costPriceUSD: number;
  costARS?: number;
  markupPercent?: number;
  freightCostUSD: number;
  importDutiesUSD: number;
  exchangeRate: number;
  finalPriceARS: number;
  stock: number;
  minStock: number;
  supplier: string;
  containerBatch: string;
  imageUrl: string;
  description: string;
  sourceWebUrl?: string; // URL o página web de donde proviene el producto para realizar el pedido
  sourceWebName?: string; // Nombre de la página / proveedor de origen
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  priceTier: 'Minorista' | 'Mayorista' | 'Distribuidor';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  activeShipments: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  sku: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'Pendiente de Pago' | 'Pagado' | 'En Preparación' | 'Listo para Despacho' | 'Despachado' | 'Entregado' | 'Cancelado';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'Mercado Pago' | 'Transferencia Bancaria' | 'Efectivo';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  customerName: string;
  customerTaxId: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  taxIVA: number;
  total: number;
  issueDate: string;
  status: 'Emitida' | 'Anulada';
  cae: string;
  caeDueDate: string;
}

export interface MercadoPagoTransaction {
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'approved' | 'pending' | 'rejected';
  payerEmail: string;
  paymentMethodId: string;
  dateApproved: string;
  fee: number;
}
