import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import {
  Download,
  Copy,
  Check,
  Sparkles,
  Layers,
  Search,
  Filter,
  Eye,
  Smartphone,
  Square,
  Tag,
  Share2,
  RefreshCw,
  Phone,
  DollarSign,
  AlertCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { resolveImageUrl, DEFAULT_PRODUCT_PLACEHOLDER } from '../utils/imageUrl';

interface ProductFlyerGeneratorProps {
  initialProductId?: string;
  onClose?: () => void;
}

type FlyerTheme = 'dark_neon' | 'super_oferta' | 'clean_white' | 'vertical_story';
type AspectRatio = '1:1' | '9:16';

export const ProductFlyerGenerator: React.FC<ProductFlyerGeneratorProps> = ({
  initialProductId,
  onClose
}) => {
  const { products, settings } = useStore();

  // Selected product(s) state
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || (products[0]?.id || '')
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    initialProductId ? [initialProductId] : products.slice(0, 5).map((p) => p.id)
  );

  // Filters for product selector
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');

  // Customization options
  const [theme, setTheme] = useState<FlyerTheme>('dark_neon');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [customBadge, setCustomBadge] = useState('🔥 SUPER OFERTA');
  const [showFreeShipping, setShowFreeShipping] = useState(true);
  const [showInstallments, setShowInstallments] = useState(true);
  const [showStoreLogo, setShowStoreLogo] = useState(true);
  const [customPriceOverride, setCustomPriceOverride] = useState<string>('');
  const [customFooterNote, setCustomFooterNote] = useState(
    settings.whatsappNumber ? `Pedidos al WhatsApp: ${settings.whatsappNumber}` : 'Envíos a todo el país • Stock Inmediato'
  );

  // Custom Image Override & Image Reload Trigger
  const [customImageOverride, setCustomImageOverride] = useState<string>('');
  const [imageReloadKey, setImageReloadKey] = useState<number>(0);

  // Status feedback
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [batchExportProgress, setBatchExportProgress] = useState<{ current: number; total: number } | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // The active product being customized/previewed
  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Helper to get formatted currency
  const formatCurrency = (val: number) => {
    return `${settings.currencySymbol || '$'} ${val.toLocaleString('es-AR')}`;
  };

  // Categories list
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'Todas' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Calculate actual price to show on flyer
  const effectiveFinalPrice = customPriceOverride && !isNaN(Number(customPriceOverride))
    ? Number(customPriceOverride)
    : (currentProduct?.finalPrice || 0);

  const effectiveComparisonPrice = effectiveFinalPrice > 0
    ? Math.round(effectiveFinalPrice * 1.35)
    : 0;

  // Multi-tier helper to load images without CORS taint or cache bugs
  const loadCORSImage = async (src: string, fallbackCandidates: string[] = []): Promise<HTMLImageElement> => {
    const clean = (src || '').trim();
    if (!clean || clean === DEFAULT_PRODUCT_PLACEHOLDER) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = DEFAULT_PRODUCT_PLACEHOLDER;
      });
    }

    // Direct local data URI or blob URL
    if (clean.startsWith('data:') || clean.startsWith('blob:')) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load data URL'));
        img.src = clean;
      });
    }

    // Build ordered list of candidate URLs
    const candidates: string[] = [];
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      // 1. Through proxy with cache buster
      candidates.push(`/api/image-proxy?url=${encodeURIComponent(clean)}&cb=${Date.now()}`);
      // 2. Direct URL
      candidates.push(clean);
    } else if (clean.startsWith('/api/image-proxy')) {
      candidates.push(clean);
      try {
        const parsed = new URL(clean, window.location.origin);
        const raw = parsed.searchParams.get('url');
        if (raw) candidates.push(raw);
      } catch {}
    } else {
      candidates.push(clean);
    }

    // Also include product gallery candidates if available
    for (const fb of fallbackCandidates) {
      const fbClean = (fb || '').trim();
      if (fbClean && fbClean !== clean) {
        if (fbClean.startsWith('http://') || fbClean.startsWith('https://')) {
          candidates.push(`/api/image-proxy?url=${encodeURIComponent(fbClean)}&cb=${Date.now()}`);
          candidates.push(fbClean);
        } else {
          candidates.push(fbClean);
        }
      }
    }

    // Tier 1: Fetch as Blob with CORS (prevents canvas tainting & browser cache collisions)
    for (const url of candidates) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 200) {
            const objectUrl = URL.createObjectURL(blob);
            const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = objectUrl;
            });
            return loaded;
          }
        }
      } catch {
        // Continue to next candidate
      }
    }

    // Tier 2: Image element with crossOrigin anonymous
    for (const url of candidates) {
      try {
        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
        return loaded;
      } catch {
        // Continue
      }
    }

    // Tier 3: Image element without crossOrigin (safe for canvas drawing)
    for (const url of candidates) {
      try {
        const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
        return loaded;
      } catch {
        // Continue
      }
    }

    // Fallback: Default Placeholder
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = DEFAULT_PRODUCT_PLACEHOLDER;
    });
  };

  // Draw Flyer onto Canvas
  const renderFlyerToCanvas = async (
    canvas: HTMLCanvasElement,
    product: Product,
    overridePrice?: number,
    overrideImageUrl?: string
  ) => {
    const isVertical = aspectRatio === '9:16' || theme === 'vertical_story';
    const width = 1080;
    const height = isVertical ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const price = overridePrice !== undefined ? overridePrice : (product.finalPrice || 0);
    const compPrice = price > 0 ? Math.round(price * 1.35) : 0;
    const installments = price > 0 ? Math.round(price / 3) : 0;
    const isAgotado = product.inStock === false || price === 0 || product.lastVerifiedStatus === 'out_of_stock';

    // 1. Background Fill according to Theme
    if (theme === 'dark_neon') {
      // Sleek Dark Slate Gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#020617'); // slate-950
      grad.addColorStop(0.5, '#0f172a'); // slate-900
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Neon decorative glow circles
      const glow1 = ctx.createRadialGradient(200, 200, 50, 200, 200, 450);
      glow1.addColorStop(0, 'rgba(79, 70, 229, 0.25)'); // indigo
      glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width - 200, height - 200, 50, width - 200, height - 200, 450);
      glow2.addColorStop(0, 'rgba(245, 158, 11, 0.2)'); // amber
      glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // Card outer border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, width - 60, height - 60);
    } else if (theme === 'super_oferta') {
      // Bold Red / Gold High Impact
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#7f1d1d'); // red-900
      grad.addColorStop(0.25, '#991b1b'); // red-800
      grad.addColorStop(0.8, '#450a0a'); // red-950
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Gold outer frame
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, width - 60, height - 60);
    } else {
      // Clean White Modern
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Subtle light gray bottom
      const grad = ctx.createLinearGradient(0, height * 0.7, 0, height);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = grad;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, width - 60, height - 60);
    }

    // 2. Header Bar: Logo & Store Name
    const headerY = 70;
    const storeName = settings.companyName || 'Nova Import';

    if (showStoreLogo && settings.logoUrl) {
      try {
        const logoImg = await loadCORSImage(settings.logoUrl);
        const logoH = 65;
        const aspect = logoImg.width / logoImg.height;
        const logoW = Math.min(220, logoH * aspect);
        ctx.drawImage(logoImg, 60, headerY, logoW, logoH);
      } catch {
        ctx.font = '900 32px sans-serif';
        ctx.fillStyle = theme === 'clean_white' ? '#0f172a' : '#ffffff';
        ctx.fillText(storeName.toUpperCase(), 60, headerY + 45);
      }
    } else {
      ctx.font = '900 32px sans-serif';
      ctx.fillStyle = theme === 'clean_white' ? '#0f172a' : '#ffffff';
      ctx.fillText(storeName.toUpperCase(), 60, headerY + 45);
    }

    // Header Right: Category Badge
    const categoryText = product.category || 'NOVEDAD';
    ctx.font = 'bold 22px sans-serif';
    const catWidth = ctx.measureText(categoryText.toUpperCase()).width;
    const catBoxW = catWidth + 36;
    const catBoxH = 46;
    const catBoxX = width - 60 - catBoxW;
    const catBoxY = headerY + 10;

    // Draw Category Box
    ctx.fillStyle = theme === 'clean_white' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(catBoxX, catBoxY, catBoxW, catBoxH, 12);
    ctx.fill();

    ctx.fillStyle = theme === 'clean_white' ? '#4f46e5' : '#a5b4fc';
    ctx.fillText(categoryText.toUpperCase(), catBoxX + 18, catBoxY + 31);

    // 3. Product Image Container
    const imgPadding = 60;
    const imgX = imgPadding;
    const imgY = isVertical ? 170 : 160;
    const imgW = width - imgPadding * 2;
    const imgH = isVertical ? 960 : 520;

    // Background behind image
    ctx.fillStyle = theme === 'clean_white' ? '#f8fafc' : '#090d16';
    ctx.beginPath();
    ctx.roundRect(imgX, imgY, imgW, imgH, 28);
    ctx.fill();
    ctx.strokeStyle = theme === 'clean_white' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw the product image
    try {
      const activeSrc = overrideImageUrl || customImageOverride || product.imageUrl || (product.galleryUrls && product.galleryUrls[0]) || DEFAULT_PRODUCT_PLACEHOLDER;
      const prodImg = await loadCORSImage(activeSrc, product.galleryUrls || []);
      // Calculate aspect ratio fit (contain within container)
      const pAspect = prodImg.width / prodImg.height;
      const cAspect = (imgW - 40) / (imgH - 40);
      let drawW = imgW - 40;
      let drawH = imgH - 40;
      if (pAspect > cAspect) {
        drawH = drawW / pAspect;
      } else {
        drawW = drawH * pAspect;
      }
      const drawX = imgX + (imgW - drawW) / 2;
      const drawY = imgY + (imgH - drawH) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imgX + 10, imgY + 10, imgW - 20, imgH - 20, 20);
      ctx.clip();
      ctx.drawImage(prodImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch {
      // Fallback text
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Foto del Producto', imgX + imgW / 2, imgY + imgH / 2);
      ctx.textAlign = 'left';
    }

    // Top-Left Floating Badge on Image
    if (isAgotado) {
      // Big Red Agotado Badge
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(imgX + 24, imgY + 24, 220, 54, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('🚫 AGOTADO', imgX + 44, imgY + 60);
    } else if (customBadge) {
      ctx.fillStyle = theme === 'super_oferta' ? '#fbbf24' : '#ef4444';
      ctx.beginPath();
      ctx.roundRect(imgX + 24, imgY + 24, 260, 54, 14);
      ctx.fill();
      ctx.fillStyle = theme === 'super_oferta' ? '#000000' : '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(customBadge, imgX + 42, imgY + 59);
    }

    // 4. Content Below Image
    const contentY = isVertical ? 1170 : 715;

    // Product Title (with smart multiline wrapping)
    ctx.fillStyle = theme === 'clean_white' ? '#0f172a' : '#ffffff';
    ctx.font = '900 36px sans-serif';

    const words = product.title.split(' ');
    let line = '';
    let currentLineY = contentY;
    const maxLines = isVertical ? 3 : 2;
    let linesDrawn = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 120 && n > 0) {
        ctx.fillText(line.trim(), 60, currentLineY);
        line = words[n] + ' ';
        currentLineY += 46;
        linesDrawn++;
        if (linesDrawn >= maxLines - 1 && n < words.length - 1) {
          line += '...';
          break;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), 60, currentLineY);

    // 5. Price Display Block
    const priceBoxY = isVertical ? currentLineY + 60 : 830;

    if (isAgotado) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '900 68px sans-serif';
      ctx.fillText('$ 0', 60, priceBoxY + 50);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('ARTÍCULO SIN EXISTENCIAS EN PROVEEDOR', 200, priceBoxY + 42);
    } else {
      // Main Bold Price
      ctx.fillStyle = theme === 'super_oferta' ? '#fde047' : (theme === 'clean_white' ? '#0f172a' : '#38bdf8');
      ctx.font = '900 74px sans-serif';
      const priceStr = formatCurrency(price);
      ctx.fillText(priceStr, 60, priceBoxY + 50);

      const priceWidth = ctx.measureText(priceStr).width;

      // Strikethrough Reference Price
      if (compPrice > price) {
        ctx.fillStyle = theme === 'clean_white' ? '#94a3b8' : '#94a3b8';
        ctx.font = 'bold 32px sans-serif';
        const compStr = formatCurrency(compPrice);
        const compX = 60 + priceWidth + 28;
        const compY = priceBoxY + 40;
        ctx.fillText(compStr, compX, compY);

        const compW = ctx.measureText(compStr).width;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(compX - 4, compY - 10);
        ctx.lineTo(compX + compW + 4, compY - 10);
        ctx.stroke();
      }

      // 3 Installments notice
      if (showInstallments && installments > 0) {
        ctx.fillStyle = theme === 'clean_white' ? '#16a34a' : '#4ade80';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`💳 3 cuotas fijas de ${formatCurrency(installments)}`, 60, priceBoxY + 98);
      }
    }

    // 6. Badges bar (Free Shipping / Stock)
    const badgesY = isVertical ? priceBoxY + 160 : 960;
    let badgeOffset = 60;

    if (showFreeShipping && !isAgotado) {
      ctx.fillStyle = theme === 'clean_white' ? '#dcfce7' : 'rgba(34, 197, 94, 0.2)';
      ctx.beginPath();
      ctx.roundRect(badgeOffset, badgesY, 210, 44, 12);
      ctx.fill();
      ctx.fillStyle = theme === 'clean_white' ? '#15803d' : '#4ade80';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('🚚 ENVÍO GRATIS', badgeOffset + 18, badgesY + 30);
      badgeOffset += 230;
    }

    if (!isAgotado) {
      ctx.fillStyle = theme === 'clean_white' ? '#e0e7ff' : 'rgba(99, 102, 241, 0.2)';
      ctx.beginPath();
      ctx.roundRect(badgeOffset, badgesY, 230, 44, 12);
      ctx.fill();
      ctx.fillStyle = theme === 'clean_white' ? '#4338ca' : '#818cf8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('⚡ STOCK LIMITADO', badgeOffset + 18, badgesY + 30);
    }

    // 7. Footer Contact Bar
    const footerY = height - 70;
    ctx.strokeStyle = theme === 'clean_white' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, footerY - 25);
    ctx.lineTo(width - 60, footerY - 25);
    ctx.stroke();

    ctx.fillStyle = theme === 'clean_white' ? '#475569' : '#cbd5e1';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(customFooterNote || 'Consúltanos por WhatsApp para envíos y promociones', 60, footerY + 8);
  };

  // Re-render preview canvas whenever inputs change
  useEffect(() => {
    if (!previewCanvasRef.current || !currentProduct) return;
    renderFlyerToCanvas(previewCanvasRef.current, currentProduct, effectiveFinalPrice, customImageOverride);
  }, [
    currentProduct,
    customImageOverride,
    imageReloadKey,
    theme,
    aspectRatio,
    customBadge,
    showFreeShipping,
    showInstallments,
    showStoreLogo,
    effectiveFinalPrice,
    customFooterNote
  ]);

  // Download Single Product Flyer
  const handleDownloadSingle = async () => {
    if (!previewCanvasRef.current || !currentProduct) return;
    setIsExporting(true);
    try {
      await renderFlyerToCanvas(previewCanvasRef.current, currentProduct, effectiveFinalPrice, customImageOverride);
      const dataUrl = previewCanvasRef.current.toDataURL('image/png', 0.95);
      const link = document.createElement('a');
      const safeTitle = currentProduct.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40);
      link.download = `publicidad-${safeTitle}-${Date.now().toString().slice(-4)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      alert('Error al descargar la imagen: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    if (!previewCanvasRef.current || !currentProduct) return;
    setIsExporting(true);
    try {
      await renderFlyerToCanvas(previewCanvasRef.current, currentProduct, effectiveFinalPrice, customImageOverride);
      previewCanvasRef.current.toBlob(async (blob) => {
        if (!blob) throw new Error('No se pudo generar el archivo de imagen.');
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 3000);
        } catch {
          // If ClipboardItem write not supported, fallback to download
          handleDownloadSingle();
        }
      }, 'image/png');
    } catch (err: any) {
      alert('No se pudo copiar la imagen: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Export Multiple Selected Products
  const handleBatchExport = async () => {
    const targetProducts = products.filter((p) => selectedProductIds.includes(p.id));
    if (targetProducts.length === 0) {
      alert('Selecciona al menos un producto para exportar.');
      return;
    }

    setIsExporting(true);
    setBatchExportProgress({ current: 0, total: targetProducts.length });

    // Temp canvas for rendering each
    const offscreenCanvas = document.createElement('canvas');

    for (let i = 0; i < targetProducts.length; i++) {
      const prod = targetProducts[i];
      setBatchExportProgress({ current: i + 1, total: targetProducts.length });

      try {
        await renderFlyerToCanvas(offscreenCanvas, prod);
        const dataUrl = offscreenCanvas.toDataURL('image/png', 0.95);
        const link = document.createElement('a');
        const safeTitle = prod.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 30);
        link.download = `publicidad-${i + 1}-${safeTitle}.png`;
        link.href = dataUrl;
        link.click();

        // 350ms throttle between downloads to avoid browser blocking multiple downloads
        await new Promise((r) => setTimeout(r, 350));
      } catch (e) {
        console.warn('Error exporting batch item', e);
      }
    }

    setIsExporting(false);
    setBatchExportProgress(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-indigo-800/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-md border border-indigo-500/30">
              MARKETING & REDES SOCIALES
            </span>
            <h2 className="text-xl font-black text-white">
              Exportador de Imágenes Publicitarias (Placas HD)
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Crea placas y flyers profesionales de tus productos con imagen en alta calidad, precio en pesos, cuotas, logotipo y datos de contacto para enviar directo por WhatsApp, Instagram, Marketplace o Estados.
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Volver
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Selector & Customization Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step 1: Select Product */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                1. Seleccionar Producto
              </label>
              <span className="text-[11px] text-slate-500">
                {products.length} productos disponibles
              </span>
            </div>

            {/* Search & Category Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-semibold focus:outline-hidden"
              >
                <option value="Todas">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Product Radio / Select List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 rounded-2xl border border-slate-800/80 p-1.5 bg-slate-900/50">
              {filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                const isCheckedInBatch = selectedProductIds.includes(p.id);
                const isAgotado = p.inStock === false || p.finalPrice === 0 || p.lastVerifiedStatus === 'out_of_stock';

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setCustomPriceOverride('');
                    }}
                    className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-400/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
                    }`}
                  >
                    {/* Batch checkbox */}
                    <input
                      type="checkbox"
                      checked={isCheckedInBatch}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedProductIds((prev) => [...prev, p.id]);
                        } else {
                          setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      title="Marcar para exportación por lote"
                    />

                    {/* Thumbnail */}
                    <img
                      src={resolveImageUrl(p.imageUrl)}
                      alt={p.title}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate block">{p.title}</span>
                        {isAgotado && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black shrink-0">
                            AGOTADO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                        <span className="truncate">{p.category}</span>
                        <span className={`font-mono font-black ${isAgotado ? 'text-red-400' : 'text-emerald-400'}`}>
                          {formatCurrency(p.finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick bulk buttons */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 text-[11px]">
                <strong className="text-indigo-300 font-bold">{selectedProductIds.length}</strong> seleccionados para exportar en lote
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductIds(filteredProducts.map((p) => p.id))}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                >
                  Seleccionar Todos
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedProductIds([])}
                  className="text-[11px] text-slate-500 hover:text-slate-400 cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Customization Options */}
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 space-y-4">
            <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              2. Personalizar Diseño & Mensaje
            </label>

            {/* Theme Selector */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Plantilla Visual:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark_neon')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark_neon'
                      ? 'bg-indigo-950 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black text-indigo-300">🌙 Dark Neon Pro</span>
                  <span className="text-[10px] text-slate-500 font-normal">Fondo oscuro, brillo elegante</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('super_oferta')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    theme === 'super_oferta'
                      ? 'bg-rose-950 border-rose-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black text-amber-300">🔥 Súper Oferta</span>
                  <span className="text-[10px] text-slate-500 font-normal">Rojo y dorado comercial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('clean_white')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    theme === 'clean_white'
                      ? 'bg-slate-200 border-white text-slate-950 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black text-slate-900">⚪ Minimalista Blanco</span>
                  <span className="text-[10px] text-slate-500 font-normal">Limpio, estilo e-commerce</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTheme('vertical_story');
                    setAspectRatio('9:16');
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    theme === 'vertical_story'
                      ? 'bg-emerald-950 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="block font-black text-emerald-300">📱 Estado WhatsApp / Story</span>
                  <span className="text-[10px] text-slate-500 font-normal">Vertical 9:16 para celular</span>
                </button>
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">Formato de Imagen:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspectRatio === '1:1'
                      ? 'bg-slate-800 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cuadrado 1:1 (Feed / Catálogo)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-slate-800 border-indigo-500 text-white shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vertical 9:16 (WhatsApp Status)</span>
                </button>
              </div>
            </div>

            {/* Product Photo Selector & Image Override */}
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Foto del Producto en la Placa</span>
                </span>
                <button
                  type="button"
                  onClick={() => setImageReloadKey((k) => k + 1)}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  title="Forzar recarga de la imagen"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Recargar</span>
                </button>
              </div>

              {/* Multiple Gallery Photos selection */}
              {currentProduct?.galleryUrls && currentProduct.galleryUrls.length > 1 && (
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Fotos disponibles del producto:</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {currentProduct.galleryUrls.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCustomImageOverride(url)}
                        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          (customImageOverride || currentProduct.imageUrl) === url
                            ? 'border-indigo-500 ring-2 ring-indigo-400/50'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={resolveImageUrl(url)} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload local image or reset */}
              <div className="flex gap-2">
                <label className="flex-1 py-1.5 px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{customImageOverride ? 'Cambiar Foto Subida' : 'Subir Foto Propia'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setCustomImageOverride(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>

                {customImageOverride && (
                  <button
                    type="button"
                    onClick={() => setCustomImageOverride('')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer"
                    title="Restablecer a la foto original"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* Badges & Text Inputs */}
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Cartel / Etiqueta Promocional
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customBadge}
                    onChange={(e) => setCustomBadge(e.target.value)}
                    placeholder="Ej: 🔥 SUPER OFERTA, ⚡ LIQUIDACIÓN"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <select
                    onChange={(e) => setCustomBadge(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 px-2"
                  >
                    <option value="🔥 SUPER OFERTA">🔥 Súper Oferta</option>
                    <option value="⚡ OFERTA FLASH">⚡ Oferta Flash</option>
                    <option value="⭐ MÁS VENDIDO">⭐ Más Vendido</option>
                    <option value="💥 PRECIO MAYORISTA">💥 Precio Mayorista</option>
                    <option value="🏷️ PROMO ESPECIAL">🏷️ Promo Especial</option>
                  </select>
                </div>
              </div>

              {/* Price Override (if user wants custom advertising price) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">
                    Modificar Precio en Placa (Opcional)
                  </label>
                  {customPriceOverride && (
                    <button
                      type="button"
                      onClick={() => setCustomPriceOverride('')}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      Restablecer precio original
                    </button>
                  )}
                </div>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    placeholder={`Por defecto: ${formatCurrency(currentProduct?.finalPrice || 0)}`}
                    value={customPriceOverride}
                    onChange={(e) => setCustomPriceOverride(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Footer Contact Note */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Texto de Contacto / Pie de Placa
                </label>
                <input
                  type="text"
                  value={customFooterNote}
                  onChange={(e) => setCustomFooterNote(e.target.value)}
                  placeholder="Ej: Pedidos al WhatsApp +549... • Envíos a todo el país"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              {/* Checkbox Options */}
              <div className="flex flex-wrap gap-4 pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showStoreLogo}
                    onChange={(e) => setShowStoreLogo(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600"
                  />
                  <span>Incluir Logo ({settings.companyName || 'Nova Import'})</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showFreeShipping}
                    onChange={(e) => setShowFreeShipping(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600"
                  />
                  <span>Distintivo Envío Gratis</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={showInstallments}
                    onChange={(e) => setShowInstallments(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-indigo-600"
                  />
                  <span>Cartel 3 Cuotas Fijas</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-DPI Live Canvas Preview & Export Action Bar */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 w-full flex flex-col items-center space-y-4 shadow-xl">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-sm text-white">Vista Previa en Alta Definición</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 font-mono font-bold">
                  {aspectRatio === '9:16' ? '1080 × 1920 px (Story)' : '1080 × 1080 px (Square)'}
                </span>
              </div>

              {currentProduct?.inStock === false && (
                <span className="text-[11px] text-rose-400 font-bold bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                  🚫 Producto Agotado
                </span>
              )}
            </div>

            {/* Canvas Container with sleek phone or square framing */}
            <div className="relative bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center justify-center max-w-full overflow-hidden">
              <canvas
                ref={previewCanvasRef}
                style={{
                  maxHeight: aspectRatio === '9:16' ? '540px' : '440px',
                  maxWidth: '100%',
                  aspectRatio: aspectRatio === '9:16' ? '9/16' : '1/1',
                  objectFit: 'contain'
                }}
                className="rounded-xl shadow-2xl transition-all"
              />
            </div>

            {/* Action Buttons Bar */}
            <div className="w-full space-y-3 pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Download PNG Single Button */}
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  disabled={isExporting}
                  className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Descargar Placa PNG (1080p HD)</span>
                </button>

                {/* Copy to Clipboard Button (Paste direct to WhatsApp) */}
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  disabled={isExporting}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>¡Copiada! Pégala en WhatsApp (Ctrl+V)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Imagen para WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              {/* Batch Export Button */}
              {selectedProductIds.length > 1 && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-800/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-bold text-indigo-200 block">
                      Exportación Masiva: {selectedProductIds.length} productos marcados
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Descarga un lote de placas publicitarias listas para publicar todas juntas.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchExport}
                    disabled={isExporting}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {batchExportProgress ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Generando {batchExportProgress.current} de {batchExportProgress.total}...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-slate-950" />
                        <span>Descargar Lote de {selectedProductIds.length} Placas</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
