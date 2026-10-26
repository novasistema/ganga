import React, { useState, useRef } from 'react';
import { Product, ResellerPriceList } from '../types';
import { useStore } from '../context/StoreContext';
import {
  FileText,
  Download,
  Copy,
  Check,
  Percent,
  TrendingUp,
  DollarSign,
  Share2,
  Printer,
  FileSpreadsheet,
  Layers,
  Search,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Trash2,
  Users,
  AlertCircle,
  Grid,
  List,
  FileDown,
  Image as ImageIcon,
  X,
  Plus,
  ExternalLink,
  Loader2,
  UserCheck,
  PhoneCall
} from 'lucide-react';
import { resolveImageUrl, DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';

interface PriceListManagerProps {
  onClose?: () => void;
}

export const PriceListManager: React.FC<PriceListManagerProps> = ({ onClose }) => {
  const {
    products,
    settings,
    saveSettings,
    priceLists,
    addPriceList,
    updatePriceList,
    deletePriceList,
    resellers
  } = useStore();

  const [selectedListId, setSelectedListId] = useState<string>(priceLists[0]?.id || '');
  const [calculationBase, setCalculationBase] = useState<'store_price' | 'wholesale_cost'>('store_price');

  // Price List Name & Reseller Details
  const [listTitle, setListTitle] = useState(priceLists[0]?.name || 'Lista Viajantes Estándar (+20% s/ Tienda)');
  const [resellerName, setResellerName] = useState(priceLists[0]?.resellerName || 'Vendedores & Viajantes');
  const [listNotes, setListNotes] = useState(priceLists[0]?.description || 'Precios con ganancia para viajantes sobre el valor de tienda online.');

  // Calculation Margins
  // 1. Wholesale Markup (optional / historical markup over supplier cost)
  const [wholesaleMarkup, setWholesaleMarkup] = useState<number>(25);
  // 2. Reseller's own Markup (% de ganancia/recargo ARRIBA del precio de tienda)
  const [resellerMarkup, setResellerMarkup] = useState<number>(priceLists[0]?.markupPercentage ?? 20);

  // Export Attribution to a specific Viajante / Vendedor
  const [selectedResellerId, setSelectedResellerId] = useState<string>('general');

  const selectedReseller = resellers.find((r) => r.id === selectedResellerId);
  const effectiveSellerName = selectedReseller ? selectedReseller.name : (resellerName || settings.companyName || 'Nova Import');
  const effectiveSellerPhone = selectedReseller?.phone || settings.whatsappNumber || '';
  const effectiveSellerZone = selectedReseller?.zone || '';

  // Filters & Product Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [excludeOutOfStock, setExcludeOutOfStock] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    products.filter((p) => p.inStock && p.finalPrice > 0).map((p) => p.id)
  );

  // Column Visibility Toggles
  const [hideSupplierCost, setHideSupplierCost] = useState(true); // Always hide base supplier cost from resellers by default
  const [showResellerProfit, setShowResellerProfit] = useState(true); // Show the net profit in $ the seller earns!
  const [showSuggestedPvp, setShowSuggestedPvp] = useState(true); // Show suggested retail price
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Feedback states
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [savePresetMessage, setSavePresetMessage] = useState<string | null>(null);

  // Switch list selection
  const handleSelectList = (pl: ResellerPriceList) => {
    setSelectedListId(pl.id);
    setListTitle(pl.name);
    setResellerMarkup(pl.markupPercentage ?? pl.resellerMarkupPercentage ?? 20);
    setCalculationBase(pl.calculationBase || 'store_price');
    setListNotes(pl.description || pl.notes || '');
    if (pl.categoryFilter) setCategoryFilter(pl.categoryFilter);
  };

  const handleStartNewList = () => {
    setSelectedListId('new');
    setListTitle('Nueva Lista Viajantes (+25% s/ Tienda)');
    setResellerMarkup(25);
    setCalculationBase('store_price');
    setListNotes('Lista personalizada para viajantes con recargo comercial sobre el precio de venta de la tienda.');
  };

  // Image Export options (with photos!) - default 0 means TOTAL DE LA LISTA (all items)
  const [imageExportLayout, setImageExportLayout] = useState<'table' | 'cards'>('table');
  const [maxItemsOnImage, setMaxItemsOnImage] = useState<number>(0);

  // PDF / Print Modal with high-res product photos
  const [showPrintCatalogModal, setShowPrintCatalogModal] = useState(false);
  const [printModalLayout, setPrintModalLayout] = useState<'table' | 'cards'>('table');
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);

  const priceSheetCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol || '$'} ${val.toLocaleString('es-AR')}`;
  };

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Filtered products
  const displayProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'Todas' || p.category === categoryFilter;
    const matchesStock = excludeOutOfStock ? (p.inStock && p.finalPrice > 0) : true;
    return matchesSearch && matchesCat && matchesStock;
  });

  // Calculate prices for a product based on chosen calculation base
  const getProductCalculations = (p: Product) => {
    if (calculationBase === 'store_price') {
      // 1. Base Cost in ARS
      const baseCost = p.originalPrice || Math.round(p.finalPrice / 1.4);
      // 2. Store Final Price (The price direct online customers pay)
      const storePrice = p.finalPrice;
      // 3. Viajante Price to Customer (Store Price + % Ganancia Viajante)
      const suggestedPvp = Math.round(storePrice * (1 + resellerMarkup / 100));
      // 4. Net Profit for the Viajante
      const resellerProfitAmount = suggestedPvp - storePrice;
      // 5. Store Gross Profit
      const myProfitAmount = storePrice - baseCost;

      return {
        baseCost,
        resellerCost: storePrice, // Lo que le corresponde a la tienda
        suggestedPvp,             // Lo que el viajante le cobra al cliente
        resellerProfitAmount,     // Ganancia del viajante
        myProfitAmount
      };
    } else {
      // Wholesale from supplier cost mode
      const baseCost = p.originalPrice || Math.round(p.finalPrice / 1.4);
      const resellerCost = Math.round(baseCost * (1 + wholesaleMarkup / 100));
      const suggestedPvp = Math.round(resellerCost * (1 + resellerMarkup / 100));
      const resellerProfitAmount = suggestedPvp - resellerCost;
      const myProfitAmount = resellerCost - baseCost;

      return {
        baseCost,
        resellerCost,
        suggestedPvp,
        resellerProfitAmount,
        myProfitAmount
      };
    }
  };

  // Copy formatted WhatsApp Text to Clipboard
  const handleCopyWhatsAppText = () => {
    const selectedList = displayProducts.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) {
      alert('Por favor selecciona al menos un producto para generar la lista.');
      return;
    }

    const storeName = settings.companyName || 'Nova Import';
    const lines: string[] = [];

    lines.push(`📋 *${listTitle.toUpperCase()}*`);
    lines.push(`🏢 *Distribuidor:* ${storeName}`);
    if (selectedReseller) {
      lines.push(`👤 *Viajante / Vendedor:* ${effectiveSellerName}`);
      if (effectiveSellerPhone) lines.push(`📲 *WhatsApp Directo:* ${effectiveSellerPhone}`);
      if (effectiveSellerZone) lines.push(`🗺️ *Zona Asignada:* ${effectiveSellerZone}`);
    } else if (resellerName) {
      lines.push(`👤 *Dirigido a:* ${resellerName}`);
      if (settings.whatsappNumber) lines.push(`📲 *WhatsApp Distribuidora:* ${settings.whatsappNumber}`);
    }
    lines.push(`📈 *Margen Ganancia Vendedor:* +${resellerMarkup}%`);
    lines.push(`📅 *Fecha:* ${new Date().toLocaleDateString('es-AR')}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

    selectedList.forEach((p, idx) => {
      const calc = getProductCalculations(p);
      lines.push(``);
      lines.push(`${idx + 1}. *${p.title.toUpperCase()}*`);
      lines.push(`   🏷️ Categoría: ${p.category}`);
      lines.push(`   💰 *Tu Costo Mayorista:* ${formatCurrency(calc.resellerCost)}`);
      if (showSuggestedPvp) {
        lines.push(`   🏷️ *Precio Venta Sugerido (PVP):* ${formatCurrency(calc.suggestedPvp)}`);
      }
      if (showResellerProfit) {
        lines.push(`   💵 *TU GANANCIA POR VENTA:* +${formatCurrency(calc.resellerProfitAmount)} (+${resellerMarkup}%)`);
      }
    });

    lines.push(``);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    if (listNotes) lines.push(`ℹ️ ${listNotes}`);
    if (effectiveSellerPhone) {
      lines.push(`📲 *Hacé tu pedido directo al WhatsApp:* ${effectiveSellerPhone} (${effectiveSellerName})`);
    } else if (settings.whatsappNumber) {
      lines.push(`📲 *Hacé tu pedido directo al WhatsApp:* ${settings.whatsappNumber}`);
    }

    const textToCopy = lines.join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 3500);
  };

  // Export to CSV / Excel
  const handleExportCSV = () => {
    const selectedList = displayProducts.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) {
      alert('Por favor selecciona al menos un producto.');
      return;
    }

    const headers = [
      'ID',
      'Producto',
      'Categoría',
      ...(hideSupplierCost ? [] : ['Costo Base Proveedor']),
      'Precio Mayorista Revendedor',
      'Margen Revendedor (%)',
      'Ganancia Estimada Revendedor ($)',
      'Precio Venta Sugerido (PVP)',
      'Viajante Asignado',
      'WhatsApp Viajante',
      'Stock'
    ];

    const rows = selectedList.map((p) => {
      const calc = getProductCalculations(p);
      return [
        `"${p.id}"`,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        ...(hideSupplierCost ? [] : [calc.baseCost]),
        calc.resellerCost,
        `${resellerMarkup}%`,
        calc.resellerProfitAmount,
        calc.suggestedPvp,
        `"${effectiveSellerName}"`,
        `"${effectiveSellerPhone}"`,
        p.stock
      ];
    });

    const metaComments = [
      `"# Lista: ${listTitle}"`,
      `"# Viajante: ${effectiveSellerName} | WhatsApp: ${effectiveSellerPhone || 'N/A'}${effectiveSellerZone ? ' | Zona: ' + effectiveSellerZone : ''}"`,
      `"# Fecha: ${new Date().toLocaleDateString('es-AR')}"`,
      ''
    ];

    const csvContent = '\uFEFF' + [...metaComments, headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lista-precios-${effectiveSellerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to load image through proxy safely for canvas
  const loadCORSImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      let targetSrc = resolveImageUrl(src);
      if (targetSrc.startsWith('http://') || targetSrc.startsWith('https://')) {
        targetSrc = `/api/image-proxy?url=${encodeURIComponent(targetSrc)}`;
      }

      img.onload = () => resolve(img);
      img.onerror = () => {
        const fallback = new Image();
        fallback.crossOrigin = 'anonymous';
        fallback.onload = () => resolve(fallback);
        fallback.onerror = () => resolve(fallback);
        fallback.src = DEFAULT_PRODUCT_PLACEHOLDER;
      };
      img.src = targetSrc;
    });
  };

  // Helper to draw rounded image on canvas
  const drawRoundedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number = 8
  ) => {
    try {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();

      // Subtle border around photo
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.stroke();
    } catch {
      // Fallback in case of clip failure
      try {
        ctx.drawImage(img, x, y, w, h);
      } catch (e) {
        // Ignore individual draw failure
      }
    }
  };

  // Render Price Catalog Image to Canvas with REAL PRODUCT IMAGES
  const handleExportImageCatalog = async (
    copyToClipboard = false,
    layoutOverride?: 'table' | 'cards'
  ) => {
    const selectedList = displayProducts.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) {
      alert('Selecciona productos para exportar.');
      return;
    }

    const layout = layoutOverride || imageExportLayout;
    setIsGeneratingImage(true);

    try {
      // If maxItemsOnImage is 0 or not set, export 100% OF THE TOTAL LIST
      const itemsToRender = (maxItemsOnImage > 0) ? selectedList.slice(0, maxItemsOnImage) : selectedList;

      // Preload company logo and all product images concurrently
      const logoUrl = settings.logoUrl || '/assets/aistudio/LOGO_55e42e2f.jpg';
      const [logoImg, ...loadedImages] = await Promise.all([
        loadCORSImage(logoUrl),
        ...itemsToRender.map((p) => loadCORSImage(p.imageUrl || ''))
      ]);

      const canvas = document.createElement('canvas');
      const width = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const storeName = settings.companyName || 'Nova Import';

      if (layout === 'table') {
        // ==========================================
        // LAYOUT 1: TABLA ILUSTRADA CON FOTOS REALES
        // ==========================================
        const headerH = 250;
        const rowH = 96;
        const footerH = 130;
        const height = headerH + itemsToRender.length * rowH + footerH;

        canvas.width = width;
        canvas.height = height;

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#090d16');
        bgGrad.addColorStop(0.3, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Gold / Indigo top accent border
        const topGrad = ctx.createLinearGradient(0, 0, width, 0);
        topGrad.addColorStop(0, '#6366f1');
        topGrad.addColorStop(0.5, '#f59e0b');
        topGrad.addColorStop(1, '#10b981');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, 8);

        // Company Logo in header
        if (logoImg && logoImg.width > 0) {
          drawRoundedImage(ctx, logoImg, 50, 40, 85, 85, 16);
        }

        // Header Title
        const headerTextX = (logoImg && logoImg.width > 0) ? 155 : 50;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 38px sans-serif';
        ctx.fillText(storeName.toUpperCase(), headerTextX, 75);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(listTitle, headerTextX, 112);

        // Subtitle & Badges
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 17px sans-serif';
        const subContact = effectiveSellerPhone ? ` • WhatsApp: ${effectiveSellerPhone}` : '';
        const subZone = effectiveSellerZone ? ` • Zona: ${effectiveSellerZone}` : '';
        ctx.fillText(
          `Viajante: ${effectiveSellerName}${subContact}${subZone} • Margen: +${resellerMarkup}% • Fecha: ${new Date().toLocaleDateString('es-AR')}`,
          headerTextX,
          144
        );

        // Table Header Row
        const tableHeadY = 185;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(40, tableHeadY, width - 80, 50, 12);
        ctx.fill();

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('#', 55, tableHeadY + 31);
        ctx.fillText('FOTO', 95, tableHeadY + 31);
        ctx.fillText('PRODUCTO', 185, tableHeadY + 31);
        ctx.fillText('COSTO MAYORISTA', 670, tableHeadY + 31);
        if (showResellerProfit) {
          ctx.fillText('TU GANANCIA', 890, tableHeadY + 31);
        }
        if (showSuggestedPvp) {
          ctx.fillText('PVP SUGERIDO', 1045, tableHeadY + 31);
        }

        // Draw Rows
        let currentY = headerH;

        itemsToRender.forEach((p, idx) => {
          const calc = getProductCalculations(p);
          const pImg = loadedImages[idx];

          // Alternating row background
          if (idx % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
            ctx.beginPath();
            ctx.roundRect(40, currentY, width - 80, rowH - 6, 10);
            ctx.fill();
          }

          // Row Number
          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(`${idx + 1}`, 52, currentY + 54);

          // REAL PRODUCT THUMBNAIL PHOTO
          if (pImg && pImg.width > 0) {
            drawRoundedImage(ctx, pImg, 85, currentY + 10, 76, 76, 12);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(85, currentY + 10, 76, 76, 12);
            ctx.fill();
          }

          // Product Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px sans-serif';
          const titleStr = p.title.length > 38 ? p.title.slice(0, 36) + '...' : p.title;
          ctx.fillText(titleStr, 185, currentY + 40);

          // Category Pill Tag
          ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
          ctx.beginPath();
          ctx.roundRect(185, currentY + 54, 160, 26, 6);
          ctx.fill();

          ctx.fillStyle = '#a5b4fc';
          ctx.font = 'bold 12px sans-serif';
          const catStr = (p.category || 'General').length > 18 ? p.category.slice(0, 16) + '..' : (p.category || 'General');
          ctx.fillText(`🏷️ ${catStr}`, 195, currentY + 72);

          // Wholesale Price (What reseller pays)
          ctx.fillStyle = '#38bdf8';
          ctx.font = '900 22px monospace';
          ctx.fillText(formatCurrency(calc.resellerCost), 670, currentY + 54);

          // Reseller Profit
          if (showResellerProfit) {
            ctx.fillStyle = '#4ade80';
            ctx.font = '900 22px monospace';
            ctx.fillText(`+${formatCurrency(calc.resellerProfitAmount)}`, 890, currentY + 54);
          }

          // Suggested PVP
          if (showSuggestedPvp) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '900 20px monospace';
            ctx.fillText(formatCurrency(calc.suggestedPvp), 1045, currentY + 54);
          }

          currentY += rowH;
        });

        // Footer Bar
        const footY = height - 90;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(40, footY);
        ctx.lineTo(width - 40, footY);
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 18px sans-serif';
        const contactText = effectiveSellerPhone
          ? `📲 Pedidos & Contacto Directo: ${effectiveSellerName} (WhatsApp: ${effectiveSellerPhone})${effectiveSellerZone ? ' • Zona: ' + effectiveSellerZone : ''}`
          : (settings.whatsappNumber ? `📲 Pedidos al WhatsApp: ${settings.whatsappNumber} • Stock Inmediato para Revendedores` : 'Stock Inmediato y Envíos a Todo el País');
        ctx.fillText(contactText, 60, footY + 45);

      } else {
        // ==========================================
        // LAYOUT 2: CATÁLOGO EN TARJETAS CON FOTOS GRANDES
        // ==========================================
        const cols = 3;
        const cardW = 360;
        const cardH = 430;
        const gap = 20;
        const startX = (width - (cols * cardW + (cols - 1) * gap)) / 2;
        const headerH = 230;
        const numRows = Math.ceil(itemsToRender.length / cols);
        const footerH = 120;
        const height = headerH + numRows * (cardH + gap) + footerH;

        canvas.width = width;
        canvas.height = height;

        // Background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, width, height);

        // Header Top Line
        const topGrad = ctx.createLinearGradient(0, 0, width, 0);
        topGrad.addColorStop(0, '#ec4899');
        topGrad.addColorStop(0.5, '#6366f1');
        topGrad.addColorStop(1, '#10b981');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, 8);

        // Logo
        if (logoImg && logoImg.width > 0) {
          drawRoundedImage(ctx, logoImg, 50, 35, 80, 80, 14);
        }

        // Header Title
        const headerTextX = (logoImg && logoImg.width > 0) ? 150 : 50;
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px sans-serif';
        ctx.fillText(storeName.toUpperCase(), headerTextX, 70);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(listTitle, headerTextX, 106);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px sans-serif';
        const subContact2 = effectiveSellerPhone ? ` • 📲 ${effectiveSellerPhone}` : '';
        const subZone2 = effectiveSellerZone ? ` • 🗺️ ${effectiveSellerZone}` : '';
        ctx.fillText(
          `👤 ${effectiveSellerName}${subContact2}${subZone2} • 📈 Margen: +${resellerMarkup}% • 📅 ${new Date().toLocaleDateString('es-AR')}`,
          headerTextX,
          138
        );

        // Render Cards
        itemsToRender.forEach((p, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const cardX = startX + col * (cardW + gap);
          const cardY = headerH + row * (cardH + gap);

          const calc = getProductCalculations(p);
          const pImg = loadedImages[idx];

          // Card Background
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 18);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // LARGE PRODUCT IMAGE
          if (pImg && pImg.width > 0) {
            drawRoundedImage(ctx, pImg, cardX + 12, cardY + 12, cardW - 24, 210, 14);
          } else {
            ctx.fillStyle = '#1f2937';
            ctx.beginPath();
            ctx.roundRect(cardX + 12, cardY + 12, cardW - 24, 210, 14);
            ctx.fill();
          }

          // Category Badge on photo
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          ctx.roundRect(cardX + 22, cardY + 22, 130, 26, 8);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 12px sans-serif';
          const catShort = (p.category || 'General').length > 15 ? p.category.slice(0, 13) + '..' : (p.category || 'General');
          ctx.fillText(`🏷️ ${catShort}`, cardX + 30, cardY + 39);

          // Title
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          const titleLine1 = p.title.length > 28 ? p.title.slice(0, 27) + '...' : p.title;
          ctx.fillText(titleLine1, cardX + 16, cardY + 250);

          // Wholesale Price Box
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(cardX + 14, cardY + 275, cardW - 28, 55, 12);
          ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('PRECIO MAYORISTA:', cardX + 26, cardY + 295);

          ctx.fillStyle = '#38bdf8';
          ctx.font = '900 20px monospace';
          ctx.fillText(formatCurrency(calc.resellerCost), cardX + 26, cardY + 320);

          // Reseller Profit Box
          if (showResellerProfit) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.beginPath();
            ctx.roundRect(cardX + 14, cardY + 342, cardW - 28, 65, 12);
            ctx.fill();

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
            ctx.stroke();

            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`TU GANANCIA (+${resellerMarkup}%):`, cardX + 26, cardY + 363);

            ctx.fillStyle = '#4ade80';
            ctx.font = '900 22px monospace';
            ctx.fillText(`+${formatCurrency(calc.resellerProfitAmount)}`, cardX + 26, cardY + 392);
          } else if (showSuggestedPvp) {
            ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.beginPath();
            ctx.roundRect(cardX + 14, cardY + 342, cardW - 28, 65, 12);
            ctx.fill();

            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('PVP SUGERIDO:', cardX + 26, cardY + 363);

            ctx.fillStyle = '#fbbf24';
            ctx.font = '900 22px monospace';
            ctx.fillText(formatCurrency(calc.suggestedPvp), cardX + 26, cardY + 392);
          }
        });

        // Footer
        const footY = height - 80;
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 18px sans-serif';
        const contactText = effectiveSellerPhone
          ? `📲 Pedidos & Contacto Directo: ${effectiveSellerName} (WhatsApp: ${effectiveSellerPhone})${effectiveSellerZone ? ' • Zona: ' + effectiveSellerZone : ''}`
          : (settings.whatsappNumber ? `📲 Pedidos al WhatsApp: ${settings.whatsappNumber} • Stock Inmediato para Revendedores` : 'Stock Inmediato y Envíos a Todo el País');
        ctx.fillText(contactText, 50, footY + 40);
      }

      // Download or Copy
      if (copyToClipboard) {
        canvas.toBlob(async (blob) => {
          if (!blob) throw new Error('No se pudo generar el archivo de imagen');
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 3000);
          } catch {
            // Fallback download if clipboard item fails
            const dataUrl = canvas.toDataURL('image/png', 0.95);
            const link = document.createElement('a');
            link.download = `lista-precios-con-fotos-${Date.now().toString().slice(-4)}.png`;
            link.href = dataUrl;
            link.click();
          }
        }, 'image/png');
      } else {
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        const link = document.createElement('a');
        link.download = `lista-precios-con-fotos-${Date.now().toString().slice(-4)}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err: any) {
      alert('Error al generar imagen con fotos: ' + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Download Standalone Interactive HTML Catalog with Real Photos
  const handleDownloadHtmlCatalog = () => {
    const selectedList = displayProducts.filter((p) => selectedProductIds.includes(p.id));
    if (selectedList.length === 0) {
      alert('Selecciona productos para exportar.');
      return;
    }

    setIsGeneratingHtml(true);
    try {
      const storeName = settings.companyName || 'Nova Import';
      const cleanWa = (effectiveSellerPhone || settings.whatsappNumber || '').replace(/[^0-9]/g, '');

      const productCardsHtml = selectedList
        .map((p, idx) => {
          const calc = getProductCalculations(p);
          const imgSrc = resolveImageUrl(p.imageUrl);
          const waOrderText = encodeURIComponent(
            `Hola ${effectiveSellerName}! Quisiera encargar el producto *${p.title}* de tu lista. ID: ${p.id}`
          );

          return `
            <div class="product-card" data-title="${p.title.toLowerCase()}" data-category="${(p.category || '').toLowerCase()}">
              <div class="image-wrapper">
                <img src="${imgSrc}" alt="${p.title}" loading="lazy" />
                <span class="category-badge">${p.category || 'General'}</span>
              </div>
              <div class="card-body">
                <span class="product-sku">#${idx + 1} • SKU: ${p.id.slice(0, 8)}</span>
                <h3 class="product-title">${p.title}</h3>
                
                <div class="price-row">
                  <div>
                    <span class="label">Precio Mayorista:</span>
                    <span class="price-wholesale">${formatCurrency(calc.resellerCost)}</span>
                  </div>
                  ${showResellerProfit ? `
                  <div class="profit-box">
                    <span class="profit-label">Tu Ganancia (+${resellerMarkup}%):</span>
                    <span class="profit-amount">+${formatCurrency(calc.resellerProfitAmount)}</span>
                  </div>` : ''}
                </div>

                ${showSuggestedPvp ? `
                <div class="pvp-row">
                  <span>PVP Sugerido al Público:</span>
                  <strong>${formatCurrency(calc.suggestedPvp)}</strong>
                </div>` : ''}

                ${cleanWa ? `
                <a href="https://wa.me/${cleanWa}?text=${waOrderText}" target="_blank" class="btn-order">
                  <span>📲 Pedir por WhatsApp</span>
                </a>` : ''}
              </div>
            </div>
          `;
        })
        .join('\n');

      const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${listTitle} - ${storeName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; padding: 24px; min-height: 100vh; }
    .container { max-width: 1240px; margin: 0 auto; }
    header { background: #1e293b; padding: 28px; border-radius: 24px; margin-bottom: 24px; border: 1px solid #334155; }
    h1 { font-size: 28px; font-weight: 900; color: #ffffff; }
    .subtitle { color: #f59e0b; font-size: 18px; font-weight: 700; margin-top: 4px; }
    .meta-bar { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 14px; font-size: 13px; color: #94a3b8; }
    .meta-item { background: #0f172a; padding: 6px 12px; border-radius: 10px; border: 1px solid #334155; font-weight: 600; }
    .search-box { width: 100%; padding: 14px 18px; background: #1e293b; border: 1px solid #334155; border-radius: 14px; color: white; font-size: 15px; margin-bottom: 24px; outline: none; }
    .search-box:focus { border-color: #6366f1; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px; }
    .product-card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; }
    .product-card:hover { transform: translateY(-4px); border-color: #6366f1; }
    .image-wrapper { position: relative; width: 100%; padding-top: 75%; background: #0f172a; }
    .image-wrapper img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
    .category-badge { position: absolute; top: 12px; left: 12px; background: rgba(0, 0, 0, 0.8); color: #38bdf8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; }
    .card-body { padding: 18px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .product-sku { font-size: 11px; color: #64748b; font-family: monospace; font-weight: 700; }
    .product-title { font-size: 16px; font-weight: 800; color: #ffffff; margin: 6px 0 14px 0; line-height: 1.3; }
    .price-row { display: flex; justify-content: space-between; align-items: flex-end; background: #0f172a; padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #334155; }
    .label { display: block; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    .price-wholesale { font-size: 20px; font-weight: 900; color: #38bdf8; font-family: monospace; }
    .profit-box { text-align: right; }
    .profit-label { display: block; font-size: 10px; color: #10b981; font-weight: 800; }
    .profit-amount { font-size: 18px; font-weight: 900; color: #4ade80; font-family: monospace; }
    .pvp-row { display: flex; justify-content: space-between; font-size: 12px; color: #cbd5e1; margin-bottom: 14px; padding: 0 4px; }
    .pvp-row strong { color: #fbbf24; font-family: monospace; font-size: 14px; }
    .btn-order { display: block; width: 100%; text-align: center; background: #10b981; color: white; padding: 12px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 13px; transition: background 0.2s; }
    .btn-order:hover { background: #059669; }
    footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 13px; padding-bottom: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${storeName.toUpperCase()}</h1>
      <div class="subtitle">${listTitle}</div>
      <div class="meta-bar">
        <span class="meta-item">👤 Viajante / Vendedor: <strong>${effectiveSellerName}</strong></span>
        ${effectiveSellerPhone ? `<span class="meta-item">📲 WhatsApp: <strong>${effectiveSellerPhone}</strong></span>` : ''}
        ${effectiveSellerZone ? `<span class="meta-item">🗺️ Zona: <strong>${effectiveSellerZone}</strong></span>` : ''}
        <span class="meta-item">📈 Ganancia: +${resellerMarkup}%</span>
        <span class="meta-item">📅 Fecha: ${new Date().toLocaleDateString('es-AR')}</span>
        <span class="meta-item">📦 Artículos: ${selectedList.length}</span>
      </div>
    </header>

    <input type="text" id="searchInput" class="search-box" placeholder="🔍 Buscar producto en el catálogo..." oninput="filterCards()" />

    <div class="grid" id="productsGrid">
      ${productCardsHtml}
    </div>

    <footer>
      ${storeName} • Contacto Comercial: <strong>${effectiveSellerName}</strong> ${effectiveSellerPhone ? `(WhatsApp: ${effectiveSellerPhone})` : ''} ${effectiveSellerZone ? `• Zona: ${effectiveSellerZone}` : ''} • Envíos a todo el país
    </footer>
  </div>

  <script>
    function filterCards() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      const cards = document.querySelectorAll('.product-card');
      cards.forEach(c => {
        const title = c.getAttribute('data-title') || '';
        const cat = c.getAttribute('data-category') || '';
        if (title.includes(q) || cat.includes(q)) {
          c.style.display = 'flex';
        } else {
          c.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalogo-con-fotos-${Date.now().toString().slice(-4)}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error al descargar catálogo HTML: ' + err.message);
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  // Open Clean Printable / PDF Catalog Modal
  const handleOpenPrintModal = () => {
    setShowPrintCatalogModal(true);
  };

  // Save Configured List Preset
  const handleSavePreset = async () => {
    setIsSavingPreset(true);
    try {
      const isNew = selectedListId === 'new' || !selectedListId;
      const listData = {
        name: listTitle.trim() || 'Lista Viajantes',
        resellerName: resellerName.trim(),
        markupPercentage: resellerMarkup,
        calculationBase,
        wholesaleMarkupPercentage: wholesaleMarkup,
        resellerMarkupPercentage: resellerMarkup,
        hideOriginalCost: hideSupplierCost,
        showResellerProfit,
        showSuggestedPvp,
        categoryFilter,
        selectedProductIds,
        description: listNotes,
        notes: listNotes,
        active: true
      };

      if (isNew) {
        const createdId = await addPriceList(listData);
        setSelectedListId(createdId);
        setSavePresetMessage(`¡Nueva lista "${listData.name}" creada y guardada con éxito!`);
      } else {
        await updatePriceList(selectedListId, listData);
        setSavePresetMessage(`¡Lista "${listData.name}" actualizada con éxito en Firebase!`);
      }
      setTimeout(() => setSavePresetMessage(null), 4000);
    } catch (err: any) {
      alert('Error al guardar lista: ' + err.message);
    } finally {
      setIsSavingPreset(false);
    }
  };

  const sampleProduct = products[0] || {
    id: 'sample',
    title: 'Producto de Ejemplo',
    finalPrice: 10000,
    originalPrice: 7000,
    category: 'Tecnología',
    imageUrl: '',
    inStock: true
  };
  const sampleCalc = getProductCalculations(sampleProduct as Product);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-emerald-800/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-md border border-emerald-500/30">
              SISTEMA DE LISTAS DE PRECIOS & VIAJANTES
            </span>
            <h2 className="text-xl font-black text-white">
              Listas de Precios con Ganancia para Viajantes
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Crea distintas listas de precios con % de ganancia arriba del precio de venta de tu tienda online y asígnalas a cada viajante para que vendan en la calle con su propio margen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartNewList}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Lista</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Volver al Inventario
            </button>
          )}
        </div>
      </div>

      {/* PRICE LISTS SELECTOR BAR */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Listas de Precios Activas ({priceLists.length}):
          </span>
          <span className="text-[11px] text-slate-400">
            Haz clic en una lista para editar su porcentaje y productos o asignarla a viajantes
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {priceLists.map((pl) => {
            const isSelected = selectedListId === pl.id;
            const assignedCount = resellers.filter((r) => r.assignedPriceListId === pl.id).length;

            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => handleSelectList(pl)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{pl.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-black/30 text-emerald-200' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  }`}
                >
                  +{pl.markupPercentage ?? pl.resellerMarkupPercentage ?? 20}%
                </span>
                {assignedCount > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-black/40 text-sky-200' : 'bg-sky-950 text-sky-400 border border-sky-800/40'
                    }`}
                    title={`${assignedCount} viajante(s) asignado(s) a esta lista`}
                  >
                    👤 {assignedCount} {assignedCount === 1 ? 'viajante' : 'viajantes'}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleStartNewList}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedListId === 'new'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border-dashed border-slate-700 hover:border-indigo-500'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Crear Otra Lista</span>
          </button>
        </div>
      </div>

      {/* LIVE PROFIT SIMULATOR & CALCULATION BASE SELECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calculation Base Selector */}
        <div className="bg-slate-950 p-5 rounded-3xl border border-indigo-900/50 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase">
            <Percent className="w-4 h-4" />
            <span>Base de Cálculo del Margen</span>
          </div>

          <div className="space-y-2">
            <label
              onClick={() => setCalculationBase('store_price')}
              className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                calculationBase === 'store_price'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="calcBase"
                checked={calculationBase === 'store_price'}
                onChange={() => setCalculationBase('store_price')}
                className="mt-0.5 text-indigo-600"
              />
              <div className="text-xs">
                <span className="font-black text-white block">
                  🌟 Arriba del Precio de Tienda Online (Recomendado)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                  Toma el precio final de venta de tu tienda y le suma el recargo pactado que será la ganancia para tu viajante.
                </span>
              </div>
            </label>

            <label
              onClick={() => setCalculationBase('wholesale_cost')}
              className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                calculationBase === 'wholesale_cost'
                  ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="calcBase"
                checked={calculationBase === 'wholesale_cost'}
                onChange={() => setCalculationBase('wholesale_cost')}
                className="mt-0.5 text-indigo-600"
              />
              <div className="text-xs">
                <span className="font-black text-white block">
                  Sobre el Costo del Proveedor / Mayorista Puro
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block leading-relaxed">
                  Calcula sobre el costo base de importación agregando tu margen y luego el margen de reventa.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Live Simulator Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 p-5 rounded-3xl border border-emerald-900/50 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Simulador de Ganancia en Tiempo Real (Ejemplo con Producto Real)</span>
            </div>
            <span className="text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40 font-mono font-bold">
              +{resellerMarkup}% Recargo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                1. Precio Venta Tienda Online
              </span>
              <span className="font-mono text-lg font-black text-white block">
                {formatCurrency(sampleCalc.resellerCost)}
              </span>
              <span className="text-[10px] text-slate-500 block">Lo que paga un cliente en la web</span>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-emerald-800/50 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                2. Precio que Cobra el Viajante
              </span>
              <span className="font-mono text-xl font-black text-emerald-300 block">
                {formatCurrency(sampleCalc.suggestedPvp)}
              </span>
              <span className="text-[10px] text-emerald-400/80 block font-semibold">
                Precio con el +{resellerMarkup}% incluido
              </span>
            </div>

            <div className="bg-emerald-950/50 p-3.5 rounded-2xl border border-emerald-500/40 space-y-1 shadow-inner">
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wide block">
                3. Ganancia Neta para el Viajante
              </span>
              <span className="font-mono text-xl font-black text-emerald-400 block">
                +{formatCurrency(sampleCalc.resellerProfitAmount)}
              </span>
              <span className="text-[10px] text-emerald-200 block font-medium">
                Por cada unidad que venda en la calle
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Margin 1: Base Markup */}
        <div className="bg-slate-950 p-4 rounded-3xl border border-indigo-900/60 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              1. {calculationBase === 'store_price' ? 'Base: Tienda Online' : 'Margen Mayorista'}
            </span>
            <span className="text-[10px] text-indigo-400 font-bold">
              {calculationBase === 'store_price' ? 'Precio Web' : 'S/ Costo'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-indigo-700/60 rounded-xl px-3 py-2 flex-1">
              <span className="text-xs text-slate-400 font-bold mr-1">+</span>
              <input
                type="number"
                min="0"
                max="500"
                value={wholesaleMarkup}
                onChange={(e) => setWholesaleMarkup(Number(e.target.value))}
                className="w-full bg-transparent text-lg font-black text-indigo-300 font-mono focus:outline-hidden"
              />
              <span className="text-xs text-slate-400 font-bold ml-1">%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {[15, 20, 25, 30, 35].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setWholesaleMarkup(m)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  wholesaleMarkup === m
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                +{m}%
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400">
            Define a cuánto le vendes cada producto a tus revendedores.
          </p>
        </div>

        {/* Margin 2: Reseller Profit Markup */}
        <div className="bg-slate-950 p-4 rounded-3xl border border-emerald-900/60 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              2. Ganancia del Vendedor
            </span>
            <span className="text-[10px] text-emerald-500 font-bold">Sumar al precio</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-emerald-700/60 rounded-xl px-3 py-2 flex-1">
              <span className="text-xs text-slate-400 font-bold mr-1">+</span>
              <input
                type="number"
                min="0"
                max="500"
                value={resellerMarkup}
                onChange={(e) => setResellerMarkup(Number(e.target.value))}
                className="w-full bg-transparent text-lg font-black text-emerald-300 font-mono focus:outline-hidden"
              />
              <span className="text-xs text-slate-400 font-bold ml-1">%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {[20, 30, 35, 40, 50].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setResellerMarkup(m)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  resellerMarkup === m
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                +{m}%
              </button>
            ))}
          </div>
          <p className="text-[10px] text-emerald-400/90 font-medium">
            ¡Esta ganancia se le suma al precio mayorista para calcular el PVP final!
          </p>
        </div>

        {/* Reseller Profile Info */}
        <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-md space-y-2">
          <label className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            3. Datos de la Lista
          </label>
          <div className="space-y-1.5">
            <input
              type="text"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              placeholder="Título de la lista..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            />
            <input
              type="text"
              value={resellerName}
              onChange={(e) => setResellerName(e.target.value)}
              placeholder="Nombre del revendedor o grupo..."
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300"
            />
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 shadow-md space-y-2 flex flex-col justify-between">
          <label className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-sky-400" />
            4. Columnas Visibles
          </label>
          <div className="space-y-1.5 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={hideSupplierCost}
                onChange={(e) => setHideSupplierCost(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span>🔒 Ocultar mi costo de compra</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showResellerProfit}
                onChange={(e) => setShowResellerProfit(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-600"
              />
              <span>💵 Mostrar Ganancia del Vendedor ($)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showSuggestedPvp}
                onChange={(e) => setShowSuggestedPvp(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-600"
              />
              <span>🏷️ Mostrar Precio Venta al Público (PVP)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preset Saving Alert */}
      {savePresetMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{savePresetMessage}</span>
        </div>
      )}

      {/* Action Bar: Export Buttons with Images */}
      <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3.5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-fuchsia-400" />
              <span>Opciones para Exportar con Fotos:</span>
            </span>

            {/* Layout Switcher */}
            <div className="inline-flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setImageExportLayout('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  imageExportLayout === 'table'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tabla con foto miniatura, título, precio mayorista y ganancia"
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabla con Fotos</span>
              </button>

              <button
                type="button"
                onClick={() => setImageExportLayout('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  imageExportLayout === 'cards'
                    ? 'bg-fuchsia-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Catálogo en cuadrícula con fotos grandes y tarjetas"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Tarjetas con Fotos</span>
              </button>
            </div>

            {/* Items Limit Selector */}
            <div className="flex items-center gap-1 text-xs text-slate-400 ml-2">
              <span className="text-[11px] font-bold text-slate-300">Cantidad en imagen:</span>
              <select
                value={maxItemsOnImage}
                onChange={(e) => setMaxItemsOnImage(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1 cursor-pointer focus:outline-hidden"
              >
                <option value={0}>✨ Total de la lista ({selectedProductIds.length} productos)</option>
                <option value={15}>Primeros 15 artículos</option>
                <option value={30}>Primeros 30 artículos</option>
                <option value={50}>Primeros 50 artículos</option>
                <option value={100}>Primeros 100 artículos</option>
              </select>
            </div>
          </div>

          {/* Save Preset Button */}
          <button
            type="button"
            onClick={handleSavePreset}
            disabled={isSavingPreset}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Save className="w-3.5 h-3.5 text-slate-950" />
            <span>Guardar Configuración</span>
          </button>
        </div>

        {/* SELECTOR DE VIAJANTE PARA DESCARGA / EXPORTACIÓN */}
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 shrink-0">
              <UserCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  👤 Viajante Asignado para la Descarga:
                </span>
                {selectedReseller && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                    +{selectedReseller.commissionPercentage || resellerMarkup}% Ganancia
                  </span>
                )}
                {effectiveSellerPhone && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800/60 flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-sky-400" />
                    <span>WhatsApp: {effectiveSellerPhone}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Selecciona al viajante para que su nombre, teléfono WhatsApp y zona figuren automáticamente en el catálogo exportado (PNG, HTML, WhatsApp o PDF).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedResellerId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedResellerId(val);
                if (val !== 'general') {
                  const match = resellers.find((r) => r.id === val);
                  if (match) {
                    setResellerName(match.name);
                    if (match.commissionPercentage) setResellerMarkup(match.commissionPercentage);
                  }
                }
              }}
              className="px-3.5 py-2.5 bg-slate-950 border border-indigo-600/70 rounded-xl text-xs text-indigo-200 font-bold focus:outline-hidden cursor-pointer shadow-md"
            >
              <option value="general">🏢 Distribuidora General ({settings.companyName || 'Empresa'} • Tel: {settings.whatsappNumber || 'Sin configurar'})</option>
              {resellers.map((r) => (
                <option key={r.id} value={r.id}>
                  👤 {r.name} {r.phone ? `(WhatsApp: ${r.phone})` : ''} {r.zone ? `• Zona: ${r.zone}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Action: Download PNG with Real Photos */}
          <button
            type="button"
            onClick={() => handleExportImageCatalog(false)}
            disabled={isGeneratingImage}
            className="px-4 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-fuchsia-900/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Genera y descarga un gráfico PNG en alta definición con el total de la lista y fotos de cada producto"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Generando total de la lista...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar Lista Completa con Fotos (PNG)</span>
              </>
            )}
          </button>

          {/* Copy PNG Image to Clipboard */}
          <button
            type="button"
            onClick={() => handleExportImageCatalog(true)}
            disabled={isGeneratingImage}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Copia la imagen con fotos al portapapeles para pegarla en WhatsApp Web (Ctrl+V)"
          >
            {copiedImage ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>¡Imagen Copiada! (Pegar con Ctrl+V)</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-fuchsia-300" />
                <span>Copiar Imagen con Fotos</span>
              </>
            )}
          </button>

          {/* Open Printable / PDF Catalog Modal */}
          <button
            type="button"
            onClick={handleOpenPrintModal}
            className="px-3.5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Abre la vista de catálogo listo para imprimir o guardar como PDF con imágenes en alta resolución"
          >
            <Printer className="w-4 h-4 text-sky-200" />
            <span>📄 Catálogo PDF con Fotos / Imprimir</span>
          </button>

          {/* Standalone HTML Catalog Download */}
          <button
            type="button"
            onClick={handleDownloadHtmlCatalog}
            disabled={isGeneratingHtml}
            className="px-3.5 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Descarga un archivo HTML autocontenido con fotos y buscador que los revendedores pueden abrir sin internet"
          >
            {isGeneratingHtml ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Descargando...</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-indigo-300" />
                <span>🌐 Catálogo Web (HTML con Fotos)</span>
              </>
            )}
          </button>

          {/* WhatsApp Text Copy */}
          <button
            type="button"
            onClick={handleCopyWhatsAppText}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {copiedWhatsapp ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Texto para WhatsApp</span>
              </>
            )}
          </button>

          {/* CSV Excel */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Exportar archivo CSV compatible con Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Saved Presets Quick Bar (if any) */}
      {settings.priceLists && settings.priceLists.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Listas Guardadas:</span>
          {settings.priceLists.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setListTitle(p.name);
                if (p.resellerName) setResellerName(p.resellerName);
                setWholesaleMarkup(p.wholesaleMarkupPercentage ?? 0);
                setResellerMarkup(p.resellerMarkupPercentage ?? p.markupPercentage ?? 20);
                setHideSupplierCost(p.hideOriginalCost);
                setShowResellerProfit(p.showResellerProfit);
                setShowSuggestedPvp(p.showSuggestedPvp);
                if (p.categoryFilter) setCategoryFilter(p.categoryFilter);
                if (p.selectedProductIds && p.selectedProductIds.length > 0) {
                  setSelectedProductIds(p.selectedProductIds);
                }
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700 shrink-0 cursor-pointer transition-colors"
            >
              📋 {p.name} (+{p.wholesaleMarkupPercentage}% / +{p.resellerMarkupPercentage}%)
            </button>
          ))}
        </div>
      )}

      {/* Filter and Selection Table Toolbar */}
      <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar artículo en la lista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-bold focus:outline-hidden"
            >
              <option value="Todas">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={excludeOutOfStock}
                onChange={(e) => setExcludeOutOfStock(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600"
              />
              <span>Ocultar Agotados ($0)</span>
            </label>

            <button
              type="button"
              onClick={() => setSelectedProductIds(displayProducts.map((p) => p.id))}
              className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
            >
              Marcar Todos ({displayProducts.length})
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-slate-500 hover:text-slate-400 cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>

        {/* Live Interactive Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.length === displayProducts.length && displayProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProductIds(displayProducts.map((p) => p.id));
                      else setSelectedProductIds([]);
                    }}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Producto</th>
                <th className="py-3 px-3">Categoría</th>
                {!hideSupplierCost && (
                  <th className="py-3 px-3 text-slate-500">Mi Costo Base</th>
                )}
                <th className="py-3 px-3 text-indigo-300">
                  Precio Mayorista (Costo Revendedor)
                </th>
                <th className="py-3 px-3 text-emerald-400">
                  Margen Vendedor
                </th>
                {showResellerProfit && (
                  <th className="py-3 px-3 text-emerald-300 font-black">
                    Ganancia Vendedor ($)
                  </th>
                )}
                {showSuggestedPvp && (
                  <th className="py-3 px-3 text-amber-300 font-black">
                    PVP Sugerido (Público)
                  </th>
                )}
                <th className="py-3 px-3 text-center">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {displayProducts.map((p) => {
                const isSelected = selectedProductIds.includes(p.id);
                const calc = getProductCalculations(p);
                const isAgotado = p.inStock === false || p.finalPrice === 0 || p.lastVerifiedStatus === 'out_of_stock';

                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                      } else {
                        setSelectedProductIds((prev) => [...prev, p.id]);
                      }
                    }}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-950/20 hover:bg-indigo-950/40' : 'hover:bg-slate-900/40 opacity-70'
                    }`}
                  >
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProductIds((prev) => [...prev, p.id]);
                          else setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                        }}
                        className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {showThumbnails && (
                          <img
                            src={resolveImageUrl(p.imageUrl)}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg bg-slate-800 shrink-0 border border-slate-700"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-white block text-xs truncate max-w-xs">{p.title}</span>
                          {isAgotado && (
                            <span className="text-[10px] text-red-400 font-bold">🚫 Agotado</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-400 text-xs">
                      {p.category}
                    </td>

                    {!hideSupplierCost && (
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {formatCurrency(calc.baseCost)}
                      </td>
                    )}

                    {/* Reseller Cost */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-indigo-300 text-sm">
                          {formatCurrency(calc.resellerCost)}
                        </span>
                        <span className="text-[10px] text-indigo-400/80 font-bold">
                          +{wholesaleMarkup}% sobre costo
                        </span>
                      </div>
                    </td>

                    {/* Reseller Margin % */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                        +{resellerMarkup}%
                      </span>
                    </td>

                    {/* Reseller Net Profit $ */}
                    {showResellerProfit && (
                      <td className="py-3 px-3 font-mono font-black text-emerald-400 text-sm">
                        +{formatCurrency(calc.resellerProfitAmount)}
                      </td>
                    )}

                    {/* Suggested Retail Price PVP */}
                    {showSuggestedPvp && (
                      <td className="py-3 px-3 font-mono font-black text-amber-300 text-sm">
                        {formatCurrency(calc.suggestedPvp)}
                      </td>
                    )}

                    <td className="py-3 px-3 text-center">
                      <span className={`font-mono font-bold ${p.stock <= 5 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: PRINTABLE / PDF CATALOG WITH REAL PRODUCT PHOTOS      */}
      {/* ============================================================ */}
      {showPrintCatalogModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex flex-col items-center justify-start p-3 sm:p-6 animate-fade-in">
          {/* Print Stylesheet */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-catalog-sheet, #printable-catalog-sheet * {
                visibility: visible !important;
              }
              #printable-catalog-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                background: white !important;
                color: #0f172a !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
              }
              .no-print-area {
                display: none !important;
              }
              .page-break {
                page-break-inside: avoid;
              }
            }
          `}} />

          {/* Top Modal Controls Bar (Hidden during print) */}
          <div className="no-print-area w-full max-w-5xl bg-slate-900 border border-slate-700 p-4 rounded-2xl mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                <Printer className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-white text-sm">Vista Previa para Descargar en PDF / Imprimir con Fotos</h3>
                <p className="text-[11px] text-slate-400">Puedes guardar directamente como PDF o imprimir con imágenes nítidas.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Layout toggle in print modal */}
              <div className="inline-flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrintModalLayout('table')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    printModalLayout === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalLayout('cards')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    printModalLayout === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-lg shadow-sky-900/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Guardar como PDF / Imprimir</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtmlCatalog}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Descargar archivo HTML interactivo con fotos"
              >
                <FileDown className="w-4 h-4 text-indigo-400" />
                <span>Descargar HTML</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintCatalogModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                title="Cerrar vista previa"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Sheet (Renders in Print and Screen) */}
          <div
            id="printable-catalog-sheet"
            className="w-full max-w-5xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6"
          >
            {/* Catalog Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-4">
                <img
                  src={resolveImageUrl(settings.logoUrl || '/assets/aistudio/LOGO_55e42e2f.jpg')}
                  alt="Logo"
                  className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
                />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {settings.companyName || 'Nova Import'}
                  </h1>
                  <h2 className="text-base font-bold text-indigo-700">
                    {listTitle}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Viajante / Asesor: <strong className="text-slate-900">{effectiveSellerName}</strong>
                    {effectiveSellerZone && <span> • Zona: <strong className="text-purple-700">{effectiveSellerZone}</strong></span>}
                    <span> • Margen Ganancia: <strong>+{resellerMarkup}%</strong></span>
                  </p>
                </div>
              </div>

              <div className="sm:text-right text-xs text-slate-600 space-y-1">
                <div>Fecha de emisión: <strong className="text-slate-900">{new Date().toLocaleDateString('es-AR')}</strong></div>
                {effectiveSellerPhone && (
                  <div>Contacto WhatsApp: <strong className="text-emerald-700">{effectiveSellerPhone}</strong></div>
                )}
                <div className="text-[11px] text-slate-500">
                  {displayProducts.filter((p) => selectedProductIds.includes(p.id)).length} artículos listados
                </div>
              </div>
            </div>

            {/* Catalog Items: Table Layout */}
            {printModalLayout === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-extrabold uppercase text-[11px]">
                      <th className="py-2.5 px-2 text-center w-8">#</th>
                      <th className="py-2.5 px-2 w-16">Foto</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3">Categoría</th>
                      <th className="py-2.5 px-3 text-right">Precio Mayorista</th>
                      {showResellerProfit && (
                        <th className="py-2.5 px-3 text-right text-emerald-800">Tu Ganancia (+{resellerMarkup}%)</th>
                      )}
                      {showSuggestedPvp && (
                        <th className="py-2.5 px-3 text-right">PVP Sugerido</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {displayProducts
                      .filter((p) => selectedProductIds.includes(p.id))
                      .map((p, idx) => {
                        const calc = getProductCalculations(p);
                        return (
                          <tr key={p.id} className="page-break hover:bg-slate-50">
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2">
                              <img
                                src={resolveImageUrl(p.imageUrl)}
                                alt={p.title}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-300 bg-slate-100"
                                loading="eager"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-extrabold text-slate-900 text-xs leading-tight">
                                {p.title}
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">
                                SKU: {p.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700 text-xs">
                              {p.category || 'General'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-xs">
                              {formatCurrency(calc.resellerCost)}
                            </td>
                            {showResellerProfit && (
                              <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-xs">
                                +{formatCurrency(calc.resellerProfitAmount)}
                              </td>
                            )}
                            {showSuggestedPvp && (
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 text-xs">
                                {formatCurrency(calc.suggestedPvp)}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Catalog Items: Cards Grid Layout */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {displayProducts
                  .filter((p) => selectedProductIds.includes(p.id))
                  .map((p, idx) => {
                    const calc = getProductCalculations(p);
                    return (
                      <div
                        key={p.id}
                        className="page-break border border-slate-300 rounded-xl p-3 flex flex-col justify-between bg-white shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            <img
                              src={resolveImageUrl(p.imageUrl)}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              loading="eager"
                            />
                            <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-indigo-700 block uppercase tracking-wider">
                              {p.category || 'General'}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-xs leading-snug line-clamp-2 mt-0.5">
                              {p.title}
                            </h3>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-bold text-[10px]">Costo Mayorista:</span>
                            <span className="font-mono font-black text-slate-950 text-xs">
                              {formatCurrency(calc.resellerCost)}
                            </span>
                          </div>

                          {showResellerProfit && (
                            <div className="flex items-center justify-between text-xs bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                              <span className="text-emerald-800 font-bold text-[10px]">Tu Ganancia (+{resellerMarkup}%):</span>
                              <span className="font-mono font-black text-emerald-800 text-xs">
                                +{formatCurrency(calc.resellerProfitAmount)}
                              </span>
                            </div>
                          )}

                          {showSuggestedPvp && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 font-medium text-[10px]">PVP Sugerido:</span>
                              <span className="font-mono font-bold text-slate-700 text-xs">
                                {formatCurrency(calc.suggestedPvp)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Catalog Footer */}
            <div className="pt-4 border-t-2 border-slate-900 text-center space-y-1">
              <p className="font-bold text-xs text-slate-800">
                {listNotes || 'Precios válidos para pedidos por mayor. Stock sujeto a confirmación y disponibilidad.'}
              </p>
              <p className="text-[11px] text-slate-500">
                {settings.companyName || 'Nova Import'} • Consultas y Pedidos Directos: <strong>{effectiveSellerName}</strong> {effectiveSellerPhone ? `(WhatsApp: ${effectiveSellerPhone})` : ''} {effectiveSellerZone ? `• Zona: ${effectiveSellerZone}` : ''} • Envíos a todo el país
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
