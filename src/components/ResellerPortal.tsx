import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Order, OrderItem } from '../types';
import confetti from 'canvas-confetti';
import {
  Lock,
  User,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Check,
  Send,
  MessageCircle,
  Truck,
  DollarSign,
  TrendingUp,
  Search,
  Eye,
  EyeOff,
  LogOut,
  MapPin,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  Package,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Share2,
  X
} from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';

const ARG_PROVINCES = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires (CABA)',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
];

interface ResellerPortalProps {
  onClose?: () => void;
}

export const ResellerPortal: React.FC<ResellerPortalProps> = ({ onClose }) => {
  const {
    products,
    orders,
    activeReseller,
    loginReseller,
    logoutReseller,
    createOrder,
    settings,
    updateReseller,
    isResellerPortalOpen,
    setIsResellerPortalOpen,
    activePriceList,
    setActivePriceList,
    priceLists,
    calculateProductPriceForViajante
  } = useStore();

  const handleClose = () => {
    setIsResellerPortalOpen(false);
    if (onClose) onClose();
  };

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Portal tabs
  const [activeTab, setActiveTab] = useState<'new_order' | 'my_orders' | 'catalog'>('new_order');

  // New Order State
  const [orderItems, setOrderItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('Todas');

  // Customer info form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerProvince, setCustomerProvince] = useState('Buenos Aires');
  const [customerPostalCode, setCustomerPostalCode] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState('Correo Argentino a Domicilio');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash_on_delivery' | 'mercadopago'>('bank_transfer');
  const [sellerNotes, setSellerNotes] = useState('');

  // Submit feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessOrder, setSubmitSuccessOrder] = useState<Order | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol || '$'} ${val.toLocaleString('es-AR')}`;
  };

  // Viajante markup calculation: Base is Store Final Price + List Markup % (or Reseller Commission)
  const getProductCalculations = (p: Product) => {
    const calc = calculateProductPriceForViajante(p, activePriceList);
    return {
      wholesalePrice: calc.storePrice,      // Lo que rinde a la distribuidora
      salePriceToCustomer: calc.viajantePrice, // Lo que el viajante le cobra al cliente
      profitPerUnit: calc.profitPerUnit,       // Ganancia neta para el viajante
      commissionPercent: calc.markupPercentage
    };
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await loginReseller(loginUsername, loginPassword);
      if (!res.success) {
        setLoginError(res.error || 'Credenciales inválidas.');
      } else {
        setLoginUsername('');
        setLoginPassword('');
      }
    } catch (err: any) {
      setLoginError('Error de conexión: ' + err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Cart operations
  const handleAddItem = (prod: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((it) => it.product.id === prod.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === prod.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (prodId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(prodId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((it) => (it.product.id === prodId ? { ...it, quantity } : it))
    );
  };

  const handleRemoveItem = (prodId: string) => {
    setOrderItems((prev) => prev.filter((it) => it.product.id !== prodId));
  };

  // Totals calculations for the order
  const wholesaleTotal = orderItems.reduce((sum, it) => {
    const calc = getProductCalculations(it.product);
    return sum + calc.wholesalePrice * it.quantity;
  }, 0);

  const customerTotal = orderItems.reduce((sum, it) => {
    const calc = getProductCalculations(it.product);
    return sum + calc.salePriceToCustomer * it.quantity;
  }, 0);

  const resellerProfitTotal = customerTotal - wholesaleTotal;

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (orderItems.length === 0) {
      setFormValidationError('Agrega al menos un producto a la venta.');
      return;
    }
    if (!customerName.trim()) {
      setFormValidationError('Ingresa el nombre y apellido del cliente.');
      return;
    }
    if (!customerPhone.trim()) {
      setFormValidationError('Ingresa el teléfono o WhatsApp del cliente.');
      return;
    }
    if (!customerAddress.trim()) {
      setFormValidationError('Ingresa la dirección completa de entrega.');
      return;
    }
    if (!customerCity.trim()) {
      setFormValidationError('Ingresa la ciudad o localidad.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems: OrderItem[] = orderItems.map((it) => {
        const calc = getProductCalculations(it.product);
        return {
          productId: it.product.id,
          title: it.product.title,
          price: calc.salePriceToCustomer,
          quantity: it.quantity,
          imageUrl: it.product.imageUrl || '',
          supplierUrl: it.product.supplierUrl || '',
          supplierName: it.product.supplierName || 'Nova Import',
          availableQuantity: it.quantity,
          verifiedStock: true
        };
      });

      const fullAddress = `${customerAddress.trim()}, ${customerCity.trim()} (${customerPostalCode.trim()}), ${customerProvince}`;

      const orderPayload: Omit<Order, 'id' | 'createdAt'> = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || `${customerPhone.replace(/[^0-9]/g, '')}@cliente.com`,
        customerAddress: fullAddress,
        customerCity: customerCity.trim(),
        customerProvince: customerProvince,
        customerPostalCode: customerPostalCode.trim(),
        shippingCarrier: shippingCarrier,
        customerNotes: sellerNotes.trim()
          ? `${sellerNotes.trim()} [Venta gestionada por Vendedor: ${activeReseller?.name}]`
          : `[Venta gestionada por Vendedor: ${activeReseller?.name}]`,
        items: formattedItems,
        totalAmount: customerTotal,
        paymentMethod: paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'presupuesto_pendiente',
        budgetStatus: 'stock_verification_pending',
        isResellerOrder: true,
        resellerId: activeReseller?.id,
        resellerName: activeReseller?.name,
        assignedPriceListId: activePriceList?.id || activeReseller?.assignedPriceListId || '',
        assignedPriceListName: activePriceList?.name || activeReseller?.assignedPriceListName || 'Lista General',
        resellerCommissionPercentage: activePriceList?.markupPercentage ?? activeReseller?.commissionPercentage ?? 20,
        resellerCommissionAmount: resellerProfitTotal,
        resellerWholesaleTotal: wholesaleTotal
      };

      const newOrderId = await createOrder(orderPayload);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Update reseller stats
      if (activeReseller) {
        await updateReseller(activeReseller.id, {
          totalOrdersCount: (activeReseller.totalOrdersCount || 0) + 1,
          totalSalesAmount: (activeReseller.totalSalesAmount || 0) + customerTotal
        });
      }

      setSubmitSuccessOrder({
        ...orderPayload,
        id: newOrderId,
        createdAt: new Date().toISOString()
      });

      // Reset form
      setOrderItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerCity('');
      setCustomerPostalCode('');
      setSellerNotes('');
    } catch (err: any) {
      setFormValidationError('Error al registrar pedido: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open WhatsApp receipt for customer
  const handleSendCustomerReceipt = (order: Order) => {
    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
    const storeName = settings.companyName || 'Nova Import';

    const itemsText = order.items
      .map((it) => `• ${it.quantity}x ${it.title} - ${formatCurrency(it.price * it.quantity)}`)
      .join('\n');

    const msg =
      `¡Hola *${order.customerName}*! Muchas gracias por tu compra.\n\n` +
      `Tu pedido *#${order.id}* ya fue registrado y enviado a depósito para ser preparado y despachado por *${storeName}* 📦\n\n` +
      `📝 *Detalle de Productos:*\n${itemsText}\n\n` +
      `💰 *Total a pagar:* *${formatCurrency(order.totalAmount)}*\n` +
      `🚚 *Dirección de Entrega:* ${order.customerAddress}\n` +
      `📦 *Empresa de Envío:* ${order.shippingCarrier || 'Envío a Domicilio'}\n\n` +
      `Te notificaremos en cuanto el paquete salga en camino con su número de seguimiento. ¡Muchas gracias!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filter products for the seller
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const filteredProducts = products.filter((p) => {
    const matchQ = p.title.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = productCategory === 'Todas' || p.category === productCategory;
    const matchStock = p.inStock && p.finalPrice > 0;
    return matchQ && matchCat && matchStock;
  });

  // Orders submitted by this seller
  const myOrders = orders.filter((o) => o.resellerId === activeReseller?.id);

  if (!isResellerPortalOpen) return null;

  // =========================================================================
  // VIEW 1: LOGIN SCREEN (IF NOT LOGGED IN)
  // =========================================================================
  if (!activeReseller) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Top glow */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Cerrar portal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <img
              src={resolveImageUrl(settings.logoUrl || '/assets/aistudio/LOGO_55e42e2f.jpg')}
              alt="Logo"
              className="w-16 h-16 object-contain rounded-2xl mx-auto border border-slate-700 bg-slate-950 p-1 shadow-md"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PORTAL OFICIAL DE VENDEDORES</span>
            </div>
            <h2 className="text-2xl font-black text-white">Ingreso para Revendedores</h2>
            <p className="text-xs text-slate-400">
              Ingresa con tu usuario y contraseña asignados por la distribuidora para cargar pedidos con los datos de tus clientes.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-2xl text-xs text-rose-300 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Usuario de Vendedor
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Tu usuario asignado..."
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tu contraseña..."
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? 'Iniciando Sesión...' : 'Ingresar al Portal'}</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Volver a la tienda pública
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED SELLER PORTAL
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md p-2 sm:p-6 animate-fade-in">
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Seller Portal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 sm:p-6 rounded-3xl border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MODO VIAJANTE ACTIVO</span>
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-emerald-700/60 rounded-lg px-2 py-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase">📋 Lista:</span>
                <select
                  value={activePriceList?.id || ''}
                  onChange={(e) => {
                    const match = priceLists.find((pl) => pl.id === e.target.value);
                    if (match) setActivePriceList(match);
                  }}
                  className="bg-transparent text-emerald-300 font-black text-xs focus:outline-hidden cursor-pointer"
                >
                  {priceLists.map((pl) => (
                    <option key={pl.id} value={pl.id} className="bg-slate-900 text-white">
                      {pl.name} (+{pl.markupPercentage ?? pl.resellerMarkupPercentage}%)
                    </option>
                  ))}
                </select>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-indigo-500/30">
                📈 Margen de Ganancia: +{activePriceList?.markupPercentage ?? activePriceList?.resellerMarkupPercentage ?? activeReseller.commissionPercentage}% s/ tienda
              </span>
              {activeReseller.zone && (
                <span className="bg-purple-500/20 text-purple-300 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-purple-500/30">
                  🗺️ Zona: {activeReseller.zone}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              ¡Hola, {activeReseller.name}!
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tus precios de venta al cliente ya tienen cargada tu ganancia del +{activePriceList?.markupPercentage ?? activeReseller.commissionPercentage}% sobre el precio de tienda online. Carga pedidos en la calle y despachamos directo a tu cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/?viajante=${encodeURIComponent(activeReseller.username)}`;
                navigator.clipboard.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
              }}
              className="px-3.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copiar link directo a la tienda con los precios de tu lista para compartir a tus clientes"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>{copiedLink ? '✓ ¡Link Copiado!' : 'Copiar Mi Link de Venta'}</span>
            </button>

            <button
              type="button"
              onClick={logoutReseller}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('new_order')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'new_order'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>🛒 Cargar Nuevo Pedido de Venta</span>
          {orderItems.length > 0 && (
            <span className="px-1.5 py-0.2 bg-white text-emerald-950 font-black text-[10px] rounded-full">
              {orderItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'my_orders'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📋 Mis Pedidos Cargados ({myOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: NEW SALES ORDER */}
      {activeTab === 'new_order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Product Catalog Picker (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  1. Seleccionar Productos para la Venta
                </h3>
                <p className="text-[11px] text-slate-400">
                  Agrega los artículos que compró tu cliente a la orden.
                </p>
              </div>

              {/* Category Filter */}
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="Todas">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar artículo en stock..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Product List */}
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const calc = getProductCalculations(p);
                const inCartItem = orderItems.find((it) => it.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveImageUrl(p.imageUrl)}
                        alt={p.title}
                        className="w-14 h-14 object-cover rounded-xl bg-slate-950 shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wide">
                          {p.category}
                        </span>
                        <h4 className="font-extrabold text-white text-xs truncate max-w-[280px]">
                          {p.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className="text-slate-400">
                            Costo: <strong className="font-mono text-slate-300">{formatCurrency(calc.wholesalePrice)}</strong>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            Ganancia: +{formatCurrency(calc.profitPerUnit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Precio Cliente:</span>
                        <span className="font-mono font-black text-amber-300 text-sm">
                          {formatCurrency(calc.salePriceToCustomer)}
                        </span>
                      </div>

                      {inCartItem ? (
                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, inCartItem.quantity - 1)}
                            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono font-bold text-xs text-white">
                            {inCartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, inCartItem.quantity + 1)}
                            className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddItem(p)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Customer Data & Order Finalization (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
            <div>
              <h3 className="font-extrabold text-white text-base">
                2. Datos del Cliente & Despacho
              </h3>
              <p className="text-[11px] text-slate-400">
                Esta orden llegará directamente a depósito para preparar y enviar al comprador.
              </p>
            </div>

            {/* Selected Items Summary */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">
                Artículos en la venta ({orderItems.length}):
              </span>

              {orderItems.length === 0 ? (
                <div className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl text-center text-xs text-slate-400">
                  Selecciona productos del catálogo a la izquierda.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {orderItems.map((it) => {
                    const calc = getProductCalculations(it.product);
                    return (
                      <div
                        key={it.product.id}
                        className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-white truncate text-[11px]">{it.product.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {it.quantity}x {formatCurrency(calc.salePriceToCustomer)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-amber-300 text-xs">
                            {formatCurrency(calc.salePriceToCustomer * it.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.product.id)}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {formValidationError && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formValidationError}</span>
              </div>
            )}

            {/* Customer Information Form */}
            <form onSubmit={handleSubmitOrder} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nombre y Apellido del Cliente Final *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Rossi"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 11 3456-7890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@gmail.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dirección de Entrega (Calle, Número, Piso/Depto) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. San Martín 1420, Piso 3 Depto B"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Ciudad / Localidad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Quilmes / Rosario"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 1878"
                    value={customerPostalCode}
                    onChange={(e) => setCustomerPostalCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Provincia *
                  </label>
                  <select
                    value={customerProvince}
                    onChange={(e) => setCustomerProvince(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    {ARG_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Método de Envío
                  </label>
                  <select
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Correo Argentino a Domicilio">Correo Argentino a Domicilio</option>
                    <option value="Andreani a Domicilio">Andreani a Domicilio</option>
                    <option value="Envío Moto Flex / Encomienda">Envío Moto Flex / Encomienda</option>
                    <option value="Retiro en Depósito">Retiro en Depósito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Método de Pago del Cliente
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="bank_transfer">Transferencia Bancaria (Alias / CBU)</option>
                  <option value="cash_on_delivery">Efectivo contra entrega / Cobro en destino</option>
                  <option value="mercadopago">Mercado Pago / Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Notas de Preparación o Entrega
                </label>
                <input
                  type="text"
                  placeholder="Ej: Entregar por la tarde, timbrar 3B..."
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Financial Breakdown Box */}
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Costo Mayorista Distribuidora:</span>
                  <span className="font-mono text-slate-300">{formatCurrency(wholesaleTotal)}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-xl border border-emerald-900/50">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>TU GANANCIA NETA (+{activeReseller.commissionPercentage}%):</span>
                  </span>
                  <span className="font-mono font-black text-sm">
                    +{formatCurrency(resellerProfitTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 font-extrabold text-sm text-white">
                  <span>TOTAL A COBRAR AL CLIENTE:</span>
                  <span className="font-mono text-amber-300 text-base">
                    {formatCurrency(customerTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || orderItems.length === 0}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Enviando a Depósito...' : 'Confirmar y Enviar Pedido a Despacho'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MY ORDERS LIST */}
      {activeTab === 'my_orders' && (
        <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base">Mis Pedidos Cargados</h3>
              <p className="text-xs text-slate-400">
                Historial de ventas enviadas al depósito y estado de preparación.
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300">
              Total: {myOrders.length} pedidos
            </span>
          </div>

          {myOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Package className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-xs">Aún no has cargado ningún pedido con tu cuenta.</p>
              <button
                type="button"
                onClick={() => setActiveTab('new_order')}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
              >
                Cargar mi primer pedido
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        #{o.id}
                      </span>
                      <h4 className="font-bold text-white text-sm">{o.customerName}</h4>
                      <span className="text-xs text-slate-400 font-mono">({o.customerPhone})</span>
                    </div>

                    <p className="text-xs text-slate-400">
                      📍 {o.customerAddress}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="text-slate-400">
                        {o.items.length} artículos: {o.items.map((it) => `${it.quantity}x ${it.title}`).join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Total Venta:</span>
                      <span className="font-mono font-black text-white text-sm">
                        {formatCurrency(o.totalAmount)}
                      </span>
                    </div>

                    {o.resellerCommissionAmount && (
                      <span className="text-xs font-bold text-emerald-400">
                        Tu Ganancia: +{formatCurrency(o.resellerCommissionAmount)}
                      </span>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.orderStatus === 'despachado' || o.orderStatus === 'entregado'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : o.orderStatus === 'en_preparacion'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {o.orderStatus === 'despachado'
                          ? '🚚 Despachado'
                          : o.orderStatus === 'en_preparacion'
                          ? '📦 En Preparación'
                          : '⏳ Recibido en Depósito'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSendCustomerReceipt(o)}
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Enviar resumen por WhatsApp al cliente"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUCCESS MODAL AFTER SUBMISSION */}
      {submitSuccessOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-emerald-700/60 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl text-slate-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-3xl border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-black text-white">¡Pedido Recibido con Éxito!</h3>
              <p className="text-xs text-slate-400">
                La orden <strong className="text-indigo-400 font-mono">#{submitSuccessOrder.id}</strong> ya ingresó al sistema de depósito para ser preparada y despachada a tu cliente.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <strong className="text-white">{submitSuccessOrder.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teléfono:</span>
                <span className="font-mono text-slate-300">{submitSuccessOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dirección:</span>
                <span className="text-slate-300 text-right max-w-xs truncate">{submitSuccessOrder.customerAddress}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Total Venta al Cliente:</span>
                <strong className="font-mono text-amber-300">{formatCurrency(submitSuccessOrder.totalAmount)}</strong>
              </div>
              {submitSuccessOrder.resellerCommissionAmount && (
                <div className="flex justify-between text-emerald-400 font-black">
                  <span>Tu Ganancia Vendedor:</span>
                  <span className="font-mono">+{formatCurrency(submitSuccessOrder.resellerCommissionAmount)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSendCustomerReceipt(submitSuccessOrder)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante al Cliente por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setSubmitSuccessOrder(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cargar Otro Pedido
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
