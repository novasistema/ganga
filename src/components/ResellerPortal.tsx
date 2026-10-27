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
  X,
  Smartphone,
  ShoppingCart,
  Printer,
  List,
  Grid,
  FileDown,
  Download
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
  const [activeTab, setActiveTab] = useState<'new_order' | 'my_orders' | 'catalog' | 'pdf_catalog'>('new_order');

  // PDF / Printable Catalog state inside Reseller Portal
  const [pdfLayout, setPdfLayout] = useState<'table' | 'cards'>('table');
  const [pdfSearch, setPdfSearch] = useState('');
  const [pdfCategory, setPdfCategory] = useState('Todas');
  const [pdfShowProfit, setPdfShowProfit] = useState(false);

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

  // Viajante markup calculation: Base es SIEMPRE el precio final de la tienda + porcentaje del vendedor
  const getProductCalculations = (p: Product) => {
    const margin = activePriceList?.markupPercentage ?? activePriceList?.resellerMarkupPercentage ?? activeReseller?.commissionPercentage ?? 20;
    const storeFinalPrice = p.finalPrice > 0 ? p.finalPrice : (p.originalPrice || 0);
    // PRECIO FINAL DE VENTA = Precio final tienda + porcentaje del vendedor
    const salePriceToCustomer = Math.round(storeFinalPrice * (1 + margin / 100));
    const profitPerUnit = salePriceToCustomer - storeFinalPrice;

    return {
      storeFinalPrice,
      wholesalePrice: storeFinalPrice,
      salePriceToCustomer, // PRECIO FINAL DE VENTA
      profitPerUnit,
      commissionPercent: margin
    };
  };

  // Download Standalone Interactive HTML Catalog with Real Photos for Seller
  const handleDownloadHtmlCatalogForSeller = () => {
    const sellerItems = products.filter((p) => {
      const matchQ = p.title.toLowerCase().includes(pdfSearch.toLowerCase());
      const matchCat = pdfCategory === 'Todas' || p.category === pdfCategory;
      const matchStock = p.inStock && p.finalPrice > 0;
      return matchQ && matchCat && matchStock;
    });

    const storeName = settings.companyName || 'Nova Import';
    const sellerName = activeReseller?.name || 'Vendedor';
    const sellerPhone = activeReseller?.phone || settings.whatsappNumber || '';
    const cleanPhone = sellerPhone.replace(/[^0-9]/g, '');

    const productCardsHtml = sellerItems.map((p, idx) => {
      const calc = getProductCalculations(p);
      const imgSrc = resolveImageUrl(p.imageUrl);
      const waMsg = encodeURIComponent(`Hola ${sellerName}! Te quiero consultar o encargar este producto de tu catálogo:\n*${p.title}*\nPrecio: ${formatCurrency(calc.salePriceToCustomer)}`);
      const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMsg}` : '#';

      return `
        <div class="product-card" data-title="${p.title.toLowerCase()}" data-category="${(p.category || '').toLowerCase()}">
          <div class="img-wrap">
            <img src="${imgSrc}" alt="${p.title}" loading="lazy" />
            <span class="badge">#${idx + 1}</span>
          </div>
          <div class="card-content">
            <span class="cat-tag">${p.category || 'General'}</span>
            <h3 class="prod-title">${p.title}</h3>
            <div class="price-box">
              <span class="price-label">PRECIO FINAL DE VENTA:</span>
              <span class="price-val">${formatCurrency(calc.salePriceToCustomer)}</span>
            </div>
            ${cleanPhone ? `<a href="${waLink}" target="_blank" class="btn-wa">📲 Pedir por WhatsApp</a>` : ''}
          </div>
        </div>
      `;
    }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Catálogo de Productos - ${sellerName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 20px; padding: 24px; margin-bottom: 24px; text-align: center; }
    h1 { font-size: 26px; font-weight: 900; color: #fff; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #94a3b8; display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 10px; }
    .meta span { background: #334155; padding: 4px 10px; border-radius: 8px; }
    .search-box { width: 100%; max-width: 500px; margin: 20px auto 0; display: block; padding: 12px 18px; border-radius: 12px; border: 1px solid #475569; background: #1e293b; color: white; font-size: 14px; outline: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
    .product-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; }
    .img-wrap { position: relative; width: 100%; aspect-ratio: 1 / 1; background: #0b1120; }
    .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; }
    .card-content { padding: 16px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .cat-tag { font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; }
    .prod-title { font-size: 14px; font-weight: 700; color: white; margin: 6px 0 12px; line-height: 1.3; }
    .price-box { background: #0f172a; padding: 10px 14px; border-radius: 10px; border: 1px solid #334155; margin-bottom: 12px; }
    .price-label { font-size: 10px; color: #94a3b8; font-weight: 700; display: block; }
    .price-val { font-size: 20px; font-weight: 900; color: #fbbf24; font-family: monospace; }
    .btn-wa { display: block; text-align: center; background: #10b981; color: white; text-decoration: none; padding: 10px; border-radius: 10px; font-weight: 700; font-size: 13px; }
    .btn-wa:hover { background: #059669; }
    footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${storeName.toUpperCase()}</h1>
      <p style="color: #cbd5e1; font-weight: 600;">Catálogo Digital con Fotos</p>
      <div class="meta">
        <span>👤 Vendedor: <strong>${sellerName}</strong></span>
        ${sellerPhone ? `<span>📲 WhatsApp: <strong>${sellerPhone}</strong></span>` : ''}
        ${activeReseller?.zone ? `<span>🗺️ Zona: <strong>${activeReseller.zone}</strong></span>` : ''}
        <span>📦 ${sellerItems.length} Artículos</span>
        <span>📅 ${new Date().toLocaleDateString('es-AR')}</span>
      </div>
      <input type="text" id="q" class="search-box" placeholder="🔍 Buscar producto en el catálogo..." oninput="search(this.value)" />
    </header>
    <div class="grid" id="grid">
      ${productCardsHtml}
    </div>
    <footer>
      ${storeName} • Contacto Comercial: ${sellerName} ${sellerPhone ? `(${sellerPhone})` : ''}
    </footer>
  </div>
  <script>
    function search(val) {
      val = val.toLowerCase();
      document.querySelectorAll('.product-card').forEach(el => {
        const title = el.getAttribute('data-title') || '';
        const cat = el.getAttribute('data-category') || '';
        el.style.display = (title.includes(val) || cat.includes(val)) ? 'flex' : 'none';
      });
    }
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-fotos-${sellerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download CSV / Excel Price List with Final Seller Prices
  const handleExportCsvForSeller = () => {
    const sellerItems = products.filter((p) => {
      const matchQ = p.title.toLowerCase().includes(pdfSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(pdfSearch.toLowerCase());
      const matchCat = pdfCategory === 'Todas' || p.category === pdfCategory;
      const matchStock = p.inStock && p.finalPrice > 0;
      return matchQ && matchCat && matchStock;
    });

    if (sellerItems.length === 0) {
      alert('No hay productos disponibles para exportar con el filtro actual.');
      return;
    }

    const sellerName = activeReseller?.name || 'Vendedor';
    const sellerPhone = activeReseller?.phone || settings.whatsappNumber || '';
    const margin = activePriceList?.markupPercentage ?? activeReseller?.commissionPercentage ?? 20;

    const headers = [
      '#',
      'Producto',
      'Categoría',
      'Precio Final Vendedor ($)',
      ...(pdfShowProfit ? ['Costo Base Tienda ($)', 'Ganancia Vendedor ($)'] : []),
      'Stock',
      'SKU',
      'Vendedor',
      'WhatsApp Vendedor'
    ];

    const rows = sellerItems.map((p, idx) => {
      const calc = getProductCalculations(p);
      return [
        idx + 1,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.category || 'General'}"`,
        calc.salePriceToCustomer,
        ...(pdfShowProfit ? [calc.wholesalePrice, calc.profitPerUnit] : []),
        p.stock,
        `"${p.supplierSku || p.id.slice(0, 8)}"`,
        `"${sellerName}"`,
        `"${sellerPhone}"`
      ];
    });

    const metaComments = [
      `"# Lista de Precios Oficial - ${settings.companyName || 'Nova Import'}"`,
      `"# Vendedor: ${sellerName} | WhatsApp: ${sellerPhone || 'N/A'}${activeReseller?.zone ? ' | Zona: ' + activeReseller.zone : ''}"`,
      `"# Margen Asignado: +${margin}% sobre precio tienda"`,
      `"# Fecha de Descarga: ${new Date().toLocaleDateString('es-AR')}"`,
      ''
    ];

    const csvContent = '\uFEFF' + [...metaComments, headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lista-precios-${sellerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md p-2 sm:p-6 pb-28 sm:pb-8 animate-fade-in">
      <div className="space-y-6 max-w-7xl mx-auto py-2">
        {/* Seller Portal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-4 sm:p-6 rounded-3xl border border-emerald-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MODO VIAJANTE ACTIVO</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                <span>100% ADAPTADO CELULAR</span>
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
                📈 Margen: +{activePriceList?.markupPercentage ?? activePriceList?.resellerMarkupPercentage ?? activeReseller.commissionPercentage}% s/ tienda
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
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">
              Tus precios de venta al cliente ya tienen cargada tu ganancia del +{activePriceList?.markupPercentage ?? activeReseller.commissionPercentage}% sobre el precio de tienda online. Carga pedidos en la calle o desde el celular y despachamos directo a tu cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('pdf_catalog')}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
                activeTab === 'pdf_catalog'
                  ? 'bg-sky-600 text-white border-sky-400 shadow-lg shadow-sky-900/40 ring-2 ring-sky-300/40'
                  : 'bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border-sky-500/40'
              }`}
              title="Exportar lista de precios en PDF con fotos para imprimir o enviar"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>📄 Lista PDF con Fotos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const link = `${window.location.origin}/?viajante=${encodeURIComponent(activeReseller.username)}`;
                navigator.clipboard.writeText(link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 3000);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
              title="Copiar link directo a la tienda con los precios de tu lista para compartir a tus clientes"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>{copiedLink ? '✓ ¡Link Copiado!' : 'Copiar Mi Link de Venta'}</span>
            </button>

            <button
              type="button"
              onClick={logoutReseller}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
        </div>

      {/* Tabs Navigation - Touch friendly 3-column grid on mobile & desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('new_order')}
          className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
            activeTab === 'new_order'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60 bg-slate-900/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>🛒 Cargar Nuevo Pedido</span>
          {orderItems.length > 0 && (
            <span className="px-2 py-0.5 bg-white text-emerald-950 font-black text-[10px] rounded-full">
              {orderItems.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my_orders')}
          className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
            activeTab === 'my_orders'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60 bg-slate-900/60'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📋 Mis Pedidos ({myOrders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pdf_catalog')}
          className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation ${
            activeTab === 'pdf_catalog'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60 bg-slate-900/60'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>📄 Lista PDF con Fotos</span>
        </button>
      </div>

      {/* TAB 1: NEW SALES ORDER */}
      {activeTab === 'new_order' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Product Catalog Picker (7 Cols) */}
          <div id="seller-product-catalog" className="lg:col-span-7 bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl scroll-mt-6">
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
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="Todas">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar artículo en stock..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Product List */}
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const calc = getProductCalculations(p);
                const inCartItem = orderItems.find((it) => it.product.id === p.id);

                return (
                  <div
                    key={p.id}
                    className="p-3 sm:p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={resolveImageUrl(p.imageUrl)}
                        alt={p.title}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-xl bg-slate-950 shrink-0 border border-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wide">
                          {p.category}
                        </span>
                        <h4 className="font-extrabold text-white text-xs sm:text-sm line-clamp-2">
                          {p.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px]">
                          <span className="text-slate-400">
                            Costo Base: <strong className="font-mono text-slate-300">{formatCurrency(calc.wholesalePrice)}</strong>
                          </span>
                          <span className="hidden sm:inline text-slate-600">•</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            Tu Ganancia (+{calc.commissionPercent}%): +{formatCurrency(calc.profitPerUnit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-amber-400 font-bold block leading-tight uppercase tracking-wider">
                          Precio Final al Cliente:
                        </span>
                        <span className="font-mono font-black text-amber-300 text-sm sm:text-base">
                          {formatCurrency(calc.salePriceToCustomer)}
                        </span>
                      </div>

                      {inCartItem ? (
                        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, inCartItem.quantity - 1)}
                            className="p-2 sm:p-1.5 text-slate-400 hover:text-white cursor-pointer min-w-[36px] flex items-center justify-center touch-manipulation"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-mono font-bold text-xs text-white">
                            {inCartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(p.id, inCartItem.quantity + 1)}
                            className="p-2 sm:p-1.5 text-slate-400 hover:text-white cursor-pointer min-w-[36px] flex items-center justify-center touch-manipulation"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddItem(p)}
                          className="px-3.5 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation"
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
          <div id="seller-customer-form" className="lg:col-span-5 bg-slate-950 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-5 shadow-xl scroll-mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white text-base">
                  2. Datos del Cliente & Despacho
                </h3>
                <p className="text-[11px] text-slate-400">
                  Esta orden llegará directamente a depósito para preparar y enviar al comprador.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('seller-product-catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="lg:hidden text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg shrink-0 touch-manipulation"
              >
                ← Agregar más
              </button>
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
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 touch-manipulation"
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

      {/* Floating Sticky Mobile Quick Action Bar */}
      {activeTab === 'new_order' && orderItems.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 animate-slide-up">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('seller-customer-form');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-950/90 border border-emerald-400/40 flex items-center justify-between font-black text-xs cursor-pointer active:scale-98 transition-all touch-manipulation"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-white text-emerald-900 flex items-center justify-center text-xs font-black shrink-0">
                {orderItems.reduce((acc, it) => acc + it.quantity, 0)}
              </span>
              <div className="text-left">
                <span className="text-[10px] text-emerald-100 block leading-tight">Total Cliente:</span>
                <span className="text-sm font-mono font-black">{formatCurrency(customerTotal)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/40 hover:bg-emerald-500/60 px-3 py-1.5 rounded-xl border border-emerald-300/30 text-white">
              <span>Continuar al Envío</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
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

      {/* TAB 3: PDF / PRINTABLE CATALOG WITH PHOTOS */}
      {activeTab === 'pdf_catalog' && (
        <div className="space-y-5 animate-fade-in">
          {/* Printable Styles */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #seller-printable-sheet, #seller-printable-sheet * {
                visibility: visible !important;
              }
              #seller-printable-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 10mm !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              }
              .no-print {
                display: none !important;
              }
              .print-break-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `}</style>

          {/* Controls Bar (Hidden on Print) */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[11px] font-black uppercase tracking-wider mb-1">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generador de Lista & Catálogo con Fotos</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Exportar Lista de Precios en PDF con Fotos
                </h3>
                <p className="text-xs text-slate-400">
                  Precios calculados con tu comisión del <strong className="text-amber-300">+{activePriceList?.markupPercentage ?? activeReseller.commissionPercentage}%</strong> sobre tienda. Podés imprimirla o guardarla como PDF desde el navegador, o descargar el catálogo HTML para enviar por WhatsApp.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-900/40 transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
                  title="Abrir diálogo de impresión para Guardar como PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar en PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadHtmlCatalogForSeller}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
                  title="Descargar archivo interactivo con fotos y links directos a tu WhatsApp"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Catálogo Web</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsvForSeller}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-teal-900/40 transition-all flex items-center gap-2 cursor-pointer touch-manipulation active:scale-95"
                  title="Descargar archivo Excel (CSV) con el precio final asignado de cada producto"
                >
                  <FileText className="w-4 h-4" />
                  <span>Descargar Excel (CSV)</span>
                </button>
              </div>
            </div>

            {/* Filters and Layout controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar en el catálogo..."
                  value={pdfSearch}
                  onChange={(e) => setPdfSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={pdfCategory}
                  onChange={(e) => setPdfCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-sky-500 cursor-pointer"
                >
                  <option value="Todas">Todas las categorías</option>
                  {Array.from(new Set(products.map((p) => p.category).filter(Boolean))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Layout Switcher: Table vs Cards */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPdfLayout('table')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    pdfLayout === 'table'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Formato Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfLayout('cards')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    pdfLayout === 'cards'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Formato Tarjetas</span>
                </button>
              </div>

              {/* Show profit toggle */}
              <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer text-xs text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={pdfShowProfit}
                  onChange={(e) => setPdfShowProfit(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-0 cursor-pointer w-4 h-4 bg-slate-900 border-slate-700"
                />
                <span className="font-semibold text-[11px]">
                  {pdfShowProfit ? '👀 Mostrando mi Ganancia' : '🔒 Ocultar Ganancia (P/ Cliente)'}
                </span>
              </label>
            </div>
          </div>

          {/* Printable Document Sheet Preview */}
          <div
            id="seller-printable-sheet"
            className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Sheet Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b-2 border-slate-900">
              <div className="flex items-center gap-4">
                <img
                  src={resolveImageUrl(settings.logoUrl || '/assets/aistudio/LOGO_55e42e2f.jpg')}
                  alt={settings.companyName || 'Logo'}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl bg-slate-50 border border-slate-200 p-1"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {settings.companyName || 'Nova Import'}
                  </h1>
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                    Catálogo de Productos & Lista de Precios Oficial
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600 font-semibold">
                    <span>📅 Emisión: {new Date().toLocaleDateString('es-AR')}</span>
                    <span>•</span>
                    <span>📦 {products.filter(p => p.inStock && p.finalPrice > 0).length} Artículos en Stock</span>
                  </div>
                </div>
              </div>

              {/* Reseller Info Badge on Document */}
              <div className="bg-slate-50 border border-slate-300 rounded-2xl p-3 text-right sm:text-right min-w-[220px]">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Vendedor Autorizado
                </span>
                <span className="text-sm font-black text-slate-900 block">
                  {activeReseller.name}
                </span>
                {(activeReseller.phone || settings.whatsappNumber) && (
                  <span className="text-xs font-bold text-emerald-700 block font-mono">
                    📲 WhatsApp: {activeReseller.phone || settings.whatsappNumber}
                  </span>
                )}
                {activeReseller.zone && (
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    🗺️ Zona: {activeReseller.zone}
                  </span>
                )}
              </div>
            </div>

            {/* Document Subheader / Legal notice */}
            <div className="py-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-b border-slate-200 mb-5">
              <span>* Todos los precios expuestos son finales para venta al público con IVA incluido.</span>
              <span>Lista: <strong>{activePriceList?.name || 'Oficial'} (+{activePriceList?.markupPercentage ?? activeReseller.commissionPercentage}%)</strong></span>
            </div>

            {/* Empty state */}
            {products.filter(p => {
              const matchQ = p.title.toLowerCase().includes(pdfSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(pdfSearch.toLowerCase());
              const matchCat = pdfCategory === 'Todas' || p.category === pdfCategory;
              return matchQ && matchCat && p.inStock && p.finalPrice > 0;
            }).length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300" />
                <p className="font-bold text-sm">No se encontraron productos con el filtro aplicado.</p>
              </div>
            ) : pdfLayout === 'table' ? (
              /* TABLE FORMAT WITH REAL PHOTOS */
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black border-y-2 border-slate-900 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3 w-18 text-center">Foto</th>
                      <th className="py-2.5 px-4">Producto & Descripción</th>
                      <th className="py-2.5 px-3">Categoría</th>
                      {pdfShowProfit && (
                        <>
                          <th className="py-2.5 px-3 text-right">Costo Base</th>
                          <th className="py-2.5 px-3 text-right text-emerald-700">Tu Ganancia</th>
                        </>
                      )}
                      <th className="py-2.5 px-4 text-right text-slate-900 font-black">Precio Venta Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {products
                      .filter(p => {
                        const matchQ = p.title.toLowerCase().includes(pdfSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(pdfSearch.toLowerCase());
                        const matchCat = pdfCategory === 'Todas' || p.category === pdfCategory;
                        return matchQ && matchCat && p.inStock && p.finalPrice > 0;
                      })
                      .map((p, idx) => {
                        const calc = getProductCalculations(p);
                        return (
                          <tr key={p.id} className="print-break-avoid hover:bg-slate-50 transition-colors">
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <img
                                src={resolveImageUrl(p.imageUrl)}
                                alt={p.title}
                                className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-slate-200 mx-auto bg-slate-100"
                                loading="lazy"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <span className="font-extrabold text-slate-900 text-xs sm:text-sm block leading-snug">
                                {p.title}
                              </span>
                              {p.supplierSku && (
                                <span className="font-mono text-[10px] text-slate-500 block">
                                  SKU: {p.supplierSku}
                                </span>
                              )}
                              {p.description && (
                                <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 max-w-md">
                                  {p.description}
                                </p>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                                {p.category || 'General'}
                              </span>
                            </td>
                            {pdfShowProfit && (
                              <>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-500">
                                  {formatCurrency(calc.wholesalePrice)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                                  +{formatCurrency(calc.profitPerUnit)}
                                </td>
                              </>
                            )}
                            <td className="py-2 px-4 text-right">
                              <span className="font-mono font-black text-slate-950 text-sm sm:text-base block">
                                {formatCurrency(calc.salePriceToCustomer)}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-sans">Precio al público</span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CARDS FORMAT WITH LARGE REAL PHOTOS */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products
                  .filter(p => {
                    const matchQ = p.title.toLowerCase().includes(pdfSearch.toLowerCase()) || (p.category || '').toLowerCase().includes(pdfSearch.toLowerCase());
                    const matchCat = pdfCategory === 'Todas' || p.category === pdfCategory;
                    return matchQ && matchCat && p.inStock && p.finalPrice > 0;
                  })
                  .map((p, idx) => {
                    const calc = getProductCalculations(p);
                    return (
                      <div
                        key={p.id}
                        className="print-break-avoid border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xs flex flex-col justify-between"
                      >
                        <div className="relative aspect-square w-full bg-slate-100 border-b border-slate-200">
                          <img
                            src={resolveImageUrl(p.imageUrl)}
                            alt={p.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-2 left-2 bg-slate-900/80 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-md">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                              {p.category || 'General'}
                            </span>
                            <h4 className="font-black text-xs text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                              {p.title}
                            </h4>
                          </div>

                          <div className="pt-2 border-t border-slate-200">
                            {pdfShowProfit && (
                              <div className="flex justify-between text-[10px] font-mono mb-1 text-slate-500">
                                <span>Costo: {formatCurrency(calc.wholesalePrice)}</span>
                                <span className="text-emerald-700 font-bold">Ganancia: +{formatCurrency(calc.profitPerUnit)}</span>
                              </div>
                            )}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                                Precio Final al Cliente
                              </span>
                              <span className="font-mono font-black text-slate-950 text-base">
                                {formatCurrency(calc.salePriceToCustomer)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Document Footer */}
            <div className="mt-8 pt-5 border-t-2 border-slate-900 text-center space-y-1 text-slate-500 text-xs">
              <p className="font-extrabold text-slate-800">
                {settings.companyName || 'Nova Import'} • Distribución Mayorista y Minorista
              </p>
              <p className="text-[11px]">
                Para realizar pedidos o consultas sobre stock, comunicate directamente con tu vendedor asignado:{' '}
                <strong className="text-slate-900">{activeReseller.name}</strong>
                {(activeReseller.phone || settings.whatsappNumber) && (
                  <> al <strong className="text-emerald-800 font-mono">{activeReseller.phone || settings.whatsappNumber}</strong></>
                )}
              </p>
            </div>
          </div>
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
