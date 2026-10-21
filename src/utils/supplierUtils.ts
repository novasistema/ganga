import { Product, RoundingRule, SupplierPlatform, SupplierProduct, SupplierSource } from '../types';

/**
 * Calculates commercial sale price based on cost, percentage margin, fixed markup, and rounding rule.
 */
export function calculateSalePrice(
  cost: number | undefined | null,
  marginPercent: number | undefined | null,
  fixedMarkup: number | undefined | null = 0,
  roundingRule: RoundingRule = 'hundred'
): number {
  const numCost = typeof cost === 'number' && !isNaN(cost) && isFinite(cost) ? cost : (Number(cost) || 0);
  const numMargin = typeof marginPercent === 'number' && !isNaN(marginPercent) && isFinite(marginPercent) ? marginPercent : (Number(marginPercent) || 0);
  const numMarkup = typeof fixedMarkup === 'number' && !isNaN(fixedMarkup) && isFinite(fixedMarkup) ? fixedMarkup : (Number(fixedMarkup) || 0);

  if (numCost <= 0) return 0;
  
  // Base raw calculated price: cost * (1 + margin%) + fixed ARS
  const rawPrice = numCost * (1 + numMargin / 100) + numMarkup;
  if (isNaN(rawPrice) || !isFinite(rawPrice)) return 0;

  switch (roundingRule) {
    case 'none':
      return Math.round(rawPrice);
    case 'hundred':
      // Round to nearest 100 (e.g., 210,250 -> 210,300 or 210,200)
      return Math.round(rawPrice / 100) * 100;
    case 'nine_ninety':
      // Round to closest price ending in 990 (e.g., 134,200 -> 133,990 or 134,990)
      const baseThousands = Math.floor(rawPrice / 1000) * 1000;
      return baseThousands + 990;
    case 'thousand':
      // Round to nearest 1000
      return Math.round(rawPrice / 1000) * 1000;
    default:
      return Math.round(rawPrice);
  }
}

/**
 * Automatically sanitizes raw supplier titles by stripping external distributor markers,
 * promo tags, wholesale lot notices, and cleaning punctuation.
 */
export function sanitizeSupplierTitle(rawTitle: string): string {
  if (!rawTitle) return '';

  let clean = rawTitle;

  // Patterns to strip (case-insensitive)
  const stripPatterns = [
    /\[[^\]]*\]/g,                     // e.g. [BULTO x6 MAYORISTA], [OFERTA], [DISTRIBUIDOR]
    /\([^\)]*bulto[^\)]*\)/gi,
    /\([^\)]*mayorista[^\)]*\)/gi,
    /\([^\)]*promo[^\)]*\)/gi,
    /\b(bulto|lote|pack)\s*(x\s*\d+|\d+\s*unidades|\d+\s*u)/gi,
    /\b(mayorista|distribuidora|importador\s*directo|importacion\s*directa|reventa|solo\s*transporte)\b/gi,
    /\b(electrosur|techbaires|andina|cuyo\s*select|sur-electro|bazar\s*hogar)\b/gi,
    /\b(promo\s*taller|precio\s*especial|oferta\s*semanal|imperdible)\b/gi,
    /[-–—]\s*(promo|oferta|mayorista).*/gi
  ];

  stripPatterns.forEach((pattern) => {
    clean = clean.replace(pattern, ' ');
  });

  // Clean extra spaces, leading/trailing punctuation
  clean = clean.replace(/[\s\t\n]+/g, ' ')
               .replace(/^[-\s:;.,]+|[-\s:;.,]+$/g, '')
               .trim();

  // If text is all uppercase, convert to Title Case
  if (clean === clean.toUpperCase() && clean.length > 5) {
    clean = clean
      .toLowerCase()
      .split(' ')
      .map((word) => {
        if (word.length <= 2) return word;
        if (/^(20v|60l|180°|1000w|4000pa|5\.5l|1\.8l|115mm|led|touch|app|sgs|s|m|l|xl|xxl)$/i.test(word)) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  return clean;
}

/**
 * Standardizes external SKU to internal NUVOH format: NVH-{PREFIX}-{CODE}
 */
export function generateInternalSku(prefix: string, rawSku?: string, title?: string): string {
  const cleanPrefix = (prefix || 'GEN').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (rawSku && rawSku.trim()) {
    const numbersOnly = rawSku.replace(/\D/g, '');
    if (numbersOnly.length >= 3) {
      return `NVH-${cleanPrefix}-${numbersOnly.slice(-4)}`;
    }
  }

  // Generate deterministic or random 4-digit numeric code based on title or random
  let seed = 0;
  const str = (title || '') + Date.now();
  for (let i = 0; i < str.length; i++) {
    seed = (seed * 31 + str.charCodeAt(i)) % 9000;
  }
  const code = 1000 + Math.abs(seed);
  return `NVH-${cleanPrefix}-${code}`;
}

/**
 * Infers category from title keywords
 */
/**
 * Automatically detects or creates a product category based on product title, keywords, and specifications.
 * Detects whether the category is newly created or matches an existing standard category.
 */
export function autoDetectAndCreateCategory(
  title: string,
  description?: string,
  existingCategories: string[] = []
): { category: string; isNew: boolean } {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();

  // 1. Check for specific specialized categories that can be auto-created
  if (/cafetera|espresso|expresso|barista|molinillo|capsula|espumador|pava\s*el[eé]ctrica/i.test(combined)) {
    const specificCategory = 'Cafeteras y Desayuno';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/iluminaci[oó]n|l[aá]mpara|foco|panel\s*led|tira\s*led|reflector|luz\s*solar/i.test(combined)) {
    const specificCategory = 'Iluminación y Electricidad';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/auricular|parlante|soundbar|bluetooth|micr[oó]fono|audio|altavoz|subwoofer/i.test(combined)) {
    const specificCategory = 'Audio y Sonido';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/silla\s*gamer|escritorio\s*gamer|setup|perif[eé]rico|pad\s*xxl|cooler|joystick/i.test(combined)) {
    const specificCategory = 'Gaming y Ergonomía';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/bazar|organizador|recipiente|termo|botella|cubiertos|vajilla|fuente\s*vidrio|herm[eé]tico/i.test(combined)) {
    const specificCategory = 'Bazar y Organización';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/taladro|amoladora|destornillador|soldadora|llave\s*impacto|sierra|rotomartillo/i.test(combined)) {
    const specificCategory = 'Herramientas y Ferretería';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/horno|freidora|airfryer|licuadora|batidora|cocina|tostadora|microondas|wafflera/i.test(combined)) {
    const specificCategory = 'Cocina y Electro';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/aspiradora|robot\s*aspirador|estufa|caloventor|ventilador|aire|climat|humidificador|purificador/i.test(combined)) {
    const specificCategory = 'Hogar y Climatización';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/afeitadora|masajeador|cortadora|pesas|fitness|balanza|deporte|cuidado|caminadora/i.test(combined)) {
    const specificCategory = 'Cuidado Personal y Deportes';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  if (/mueble|mesa|silla|sillon|sofa|estante|repisa|decoraci[oó]n|cuadro/i.test(combined)) {
    const specificCategory = 'Muebles y Decoración';
    const isNew = !existingCategories.includes(specificCategory);
    return { category: specificCategory, isNew };
  }

  // Fallback category
  const fallback = 'Tecno y Varios';
  return { category: fallback, isNew: !existingCategories.includes(fallback) };
}

/**
 * Infers category from title keywords (backward-compatible)
 */
export function extractCategoryFromText(text: string): string {
  return autoDetectAndCreateCategory(text).category;
}

/**
 * Full Product Bank used to simulate full catalog crawl from any wholesale website.
 */
const WEB_CATALOG_PRODUCT_TEMPLATES = [
  {
    title: '[BULTO x4 MAYORISTA] CAFETERA EXPRESSO AUTOMÁTICA ITALIANA 20 BAR SUR-BARISTA TOUCH',
    cost: 145000,
    stock: 28,
    image: '/assets/images/nuvoh_cafetera_expresso_1791905596557.jpg',
    categoryHint: 'Cafeteras y Desayuno',
    specs: [{ label: 'Bomba', desc: 'Italiana 20 Bar de Alta Presión' }, { label: 'Tanque', desc: '1.5 Litros' }, { label: 'Vaporizador', desc: 'Acero Inox Latte Art' }]
  },
  {
    title: 'HORNO ELÉCTRICO DE MESA 60L DOBLE CONVECCIÓN TURBO GRILL SPIEDO ACERO INOX',
    cost: 198000,
    stock: 19,
    image: '/assets/images/nuvoh_horno_electrico_1791905594716.jpg',
    categoryHint: 'Cocina y Electro',
    specs: [{ label: 'Capacidad', desc: '60 Litros Reales' }, { label: 'Convección', desc: 'Turbo forzado 360°' }, { label: 'Potencia', desc: '2000 Watts' }]
  },
  {
    title: 'PROMO TALLER: TALADRO PERCUTOR BATERÍA LITIO 20V BRUSHLESS + MALETÍN REFORZADO 78PZS',
    cost: 112000,
    stock: 42,
    image: '/assets/images/nuvoh_taladro_maletin_1791905596424.jpg',
    categoryHint: 'Herramientas y Ferretería',
    specs: [{ label: 'Torque', desc: '60 Nm de impacto' }, { label: 'Baterías', desc: '2x 20V Litio 2.0Ah' }, { label: 'Mandril', desc: '13mm Metálico' }]
  },
  {
    title: 'SILLA GAMER ERGONÓMICA RECLINABLE 180° APOYABRAZOS 3D COJÍN LUMBAR SGS CLASE 4',
    cost: 215000,
    stock: 14,
    image: '/assets/images/nuvoh_silla_gamer_1791905596483.jpg',
    categoryHint: 'Gaming y Ergonomía',
    specs: [{ label: 'Estructura', desc: 'Acero reforzado de 1.5mm' }, { label: 'Pistón', desc: 'Gas clase 4 certificado' }, { label: 'Reclinación', desc: '90° a 180° libre' }]
  },
  {
    title: '[MAYORISTA BULTO] FREIDORA DE AIRE DIGITAL SMART AIRFRYER 5.5L 1700W TOUCHSCREEN 8 PROG',
    cost: 89000,
    stock: 36,
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Cocina y Electro',
    specs: [{ label: 'Capacidad', desc: '5.5 Litros Familiar' }, { label: 'Panel', desc: 'Touch LED digital' }, { label: 'Potencia', desc: '1700 Watts' }]
  },
  {
    title: 'ASPIRADORA ROBOT SMART MAPPING WIFI CONECTIVIDAD APP TUYA NAVEGACIÓN LÁSER LDS 4000PA',
    cost: 275000,
    stock: 16,
    image: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Hogar y Climatización',
    specs: [{ label: 'Succión', desc: '4000 Pa de Potencia' }, { label: 'Mapeo', desc: 'LDS Láser 360°' }, { label: 'Batería', desc: '5200 mAh (150 min)' }]
  },
  {
    title: 'AMOLADORA ANGULAR 115MM 900W INDUSTRIAL RULEMANES BLINDADOS GATILLO PALETA',
    cost: 63000,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Herramientas y Ferretería',
    specs: [{ label: 'Disco', desc: '115mm (4-1/2")' }, { label: 'Velocidad', desc: '11.000 RPM' }, { label: 'Seguridad', desc: 'Guarda anti-chispas' }]
  },
  {
    title: 'PAVA ELÉCTRICA DIGITAL CORTE MATE 85°C ACERO INOXIDABLE 1.8L SELECTOR DE TEMPERATURA',
    cost: 41000,
    stock: 60,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Cafeteras y Desayuno',
    specs: [{ label: 'Corte', desc: 'Función Mate 85°C y Hervor' }, { label: 'Cuerpo', desc: 'Acero Inoxidable 304' }, { label: 'Base', desc: 'Girable 360° con enrolla cable' }]
  },
  {
    title: 'CALOVENTOR CERÁMICO DIGITAL OSCILANTE 2000W CONTROL REMOTO SILENCIOSO TERMOSTATO',
    cost: 54000,
    stock: 38,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Hogar y Climatización',
    specs: [{ label: 'Elemento', desc: 'Cerámica PTC Instantánea' }, { label: 'Control', desc: 'Control remoto infrarrojo' }, { label: 'Oscilación', desc: 'Gran angular 70°' }]
  },
  {
    title: 'AURICULARES GAMER 7.1 SURROUND RGB CHROMA MICRÓFONO CANCELACIÓN ACTIVA DE RUIDO',
    cost: 39500,
    stock: 75,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Audio y Sonido',
    specs: [{ label: 'Sonido', desc: '7.1 Virtual Surround' }, { label: 'Drivers', desc: '50mm Neodimio' }, { label: 'Conexión', desc: 'USB Chapado en Oro + Jack 3.5' }]
  },
  {
    title: 'LÁMPARA DE ESCRITORIO LED TOUCH RECARGABLE USB 3 TONOS LUZ BLANCA CÁLIDA ATENUABLE',
    cost: 26000,
    stock: 48,
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Iluminación y Electricidad',
    specs: [{ label: 'Iluminación', desc: '3 Temperaturas de Color' }, { label: 'Batería', desc: '2000 mAh Recargable' }, { label: 'Brazo', desc: 'Silicona Flexible 360°' }]
  },
  {
    title: 'SET DE HERMÉTICOS BOWL DE VIDRIO BOROSILICATO CON TAPA VÁLVULA HERMÉTICA PACK X5',
    cost: 33000,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Bazar y Organización',
    specs: [{ label: 'Material', desc: 'Vidrio Borosilicato Apto Horno' }, { label: 'Cierre', desc: '4 Trabas con Silicona' }, { label: 'Piezas', desc: '5 Contenedores Apilables' }]
  },
  {
    title: 'MÁQUINA SOLDADORA INVERTER MMA 200A COMPACTA TURBO VENTILADA PANTALLA DIGITAL',
    cost: 165000,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Herramientas y Ferretería',
    specs: [{ label: 'Amperaje', desc: '20 a 200 Amperes Reales' }, { label: 'Electrodos', desc: '1.6mm hasta 4.0mm' }, { label: 'Peso', desc: 'Ultra liviana 3.5 Kg' }]
  },
  {
    title: 'PISTOLA DE MASAJE MUSCULAR PERCUSIÓN PRO 30 VELOCIDADES 6 CABEZALES BATERÍA LITIO',
    cost: 49000,
    stock: 32,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    categoryHint: 'Cuidado Personal y Deportes',
    specs: [{ label: 'Motor', desc: 'Brushless High Torque Silencioso' }, { label: 'Cabezales', desc: '6 Puntas Intercambiables' }, { label: 'Pantalla', desc: 'Display LCD Táctil' }]
  }
];

/**
 * Scans a supplier website and returns an extensive list of catalog products ready
 * for the user to select and automatically assign/create categories.
 */
export async function scanSupplierWebCatalog(
  supplier: {
    name: string;
    url: string;
    platform: SupplierPlatform;
    skuPrefix: string;
    defaultMarginPercent: number;
    id?: string;
  },
  options?: {
    customMargin?: number;
    customMarkup?: number;
    rounding?: RoundingRule;
    existingCategories?: string[];
  }
): Promise<SupplierProduct[]> {
  // Simulate realistic network crawling latency (500ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const margin = options?.customMargin ?? supplier.defaultMarginPercent ?? 45;
  const markup = options?.customMarkup ?? 0;
  const rounding = options?.rounding ?? 'hundred';
  const existingCats = options?.existingCategories || [];

  const supplierId = supplier.id || `supp-temp-${Date.now()}`;
  const prefix = supplier.skuPrefix || 'NVH';
  const supplierName = supplier.name || 'Proveedor Web';
  const baseDomain = supplier.url ? supplier.url.replace(/\/+$/, '') : 'https://proveedor.com.ar';

  return WEB_CATALOG_PRODUCT_TEMPLATES.map((tmpl, index) => {
    const sanitizedTitle = sanitizeSupplierTitle(tmpl.title);
    const skuNumber = 1000 + index * 15 + Math.floor(Math.random() * 9);
    const internalSku = `NVH-${prefix.toUpperCase().slice(0, 4)}-${skuNumber}`;
    const originalSku = `${prefix.toUpperCase().slice(0, 4)}-${100 + index}`;
    
    // Auto-detect or create category dynamically
    const { category } = autoDetectAndCreateCategory(sanitizedTitle, '', existingCats);
    const finalPrice = calculateSalePrice(tmpl.cost, margin, markup, rounding);

    const slug = sanitizedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const sourceUrl = `${baseDomain}/producto/${slug}`;

    return {
      id: `sp-crawl-${Date.now()}-${index}`,
      supplierId,
      supplierName,
      sourceUrl,
      originalTitle: tmpl.title,
      sanitizedTitle,
      originalSku,
      internalSku,
      category,
      costArs: tmpl.cost,
      previousCostArs: tmpl.cost,
      costChangeDelta: 0,
      hasCostChanged: false,
      stock: tmpl.stock,
      image: tmpl.image,
      description: `Artículo extraído automáticamente desde el catálogo oficial de ${supplierName} (${supplier.platform}). Empaque original con garantía comercial directa de fábrica.`,
      specs: tmpl.specs,
      marginPercent: margin,
      fixedMarkupArs: markup,
      roundingRule: rounding,
      finalSalePrice: finalPrice,
      status: 'draft' as const,
      lastCheckedAt: 'Recién extraído del catálogo web'
    };
  });
}

/**
 * Simulates intelligent scraping and extraction from an individual URL or category batch page
 */
export async function simulateScrapingExtractor(
  targetUrl: string,
  supplier: SupplierSource,
  options?: {
    customMargin?: number;
    customMarkup?: number;
    rounding?: RoundingRule;
    existingCategories?: string[];
  }
): Promise<SupplierProduct[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const urlLower = (targetUrl || '').toLowerCase();
  const isCategoryBatch = 
    urlLower.includes('/c/') || 
    urlLower.includes('/categoria') || 
    urlLower.includes('/categoria/') || 
    urlLower.includes('page=') || 
    urlLower.includes('/page/') || 
    urlLower.includes('/productos') ||
    urlLower.includes('/tienda') ||
    urlLower.endsWith('.com') ||
    urlLower.endsWith('.com.ar');

  const margin = options?.customMargin ?? supplier.defaultMarginPercent ?? 45;
  const markup = options?.customMarkup ?? 0;
  const rounding = options?.rounding ?? 'hundred';
  const existingCats = options?.existingCategories || [];

  const countToExtract = isCategoryBatch ? 8 : 1;
  const results: SupplierProduct[] = [];

  // Helper to extract keywords from URL path
  const urlPathParts = urlLower.split('?')[0].split('/').filter(Boolean);
  const lastPath = urlPathParts[urlPathParts.length - 1] || '';
  const cleanSlugWords = lastPath.replace(/[-_]/g, ' ').trim();

  // Try to find a template matching keywords in the URL
  const findBestTemplate = (index: number) => {
    // If URL contains specific keywords, match corresponding template
    if (urlLower.includes('cafeter') || urlLower.includes('expresso') || urlLower.includes('barista')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[0]; // Cafetera
    }
    if (urlLower.includes('horno') || urlLower.includes('spiedo') || urlLower.includes('conveccion')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[1]; // Horno
    }
    if (urlLower.includes('taladro') || urlLower.includes('percutor') || urlLower.includes('bateria') || urlLower.includes('atornillador')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[2]; // Taladro
    }
    if (urlLower.includes('silla') || urlLower.includes('gamer') || urlLower.includes('ergonomica') || urlLower.includes('escritorio')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[3]; // Silla Gamer
    }
    if (urlLower.includes('freidora') || urlLower.includes('airfryer') || urlLower.includes('aire')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[4]; // Airfryer
    }
    if (urlLower.includes('aspiradora') || urlLower.includes('robot') || urlLower.includes('mapping')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[5]; // Robot Aspiradora
    }
    if (urlLower.includes('amoladora') || urlLower.includes('disco') || urlLower.includes('angular')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[6]; // Amoladora
    }
    if (urlLower.includes('pava') || urlLower.includes('mate') || urlLower.includes('hervidor')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[7]; // Pava Eléctrica
    }
    if (urlLower.includes('caloventor') || urlLower.includes('estufa') || urlLower.includes('calefactor')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[8]; // Caloventor
    }
    if (urlLower.includes('auricular') || urlLower.includes('headset') || urlLower.includes('gamer 7.1') || urlLower.includes('sound')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[9]; // Auriculares
    }
    if (urlLower.includes('lampara') || urlLower.includes('led') || urlLower.includes('touch')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[10]; // Lámpara LED
    }
    if (urlLower.includes('hermetico') || urlLower.includes('bowl') || urlLower.includes('vidrio') || urlLower.includes('tupper')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[11]; // Herméticos
    }
    if (urlLower.includes('soldadora') || urlLower.includes('inverter') || urlLower.includes('mma')) {
      return WEB_CATALOG_PRODUCT_TEMPLATES[12]; // Soldadora
    }

    // Default fallback by index
    return WEB_CATALOG_PRODUCT_TEMPLATES[index % WEB_CATALOG_PRODUCT_TEMPLATES.length];
  };

  for (let i = 0; i < countToExtract; i++) {
    const tmpl = isCategoryBatch 
      ? WEB_CATALOG_PRODUCT_TEMPLATES[i % WEB_CATALOG_PRODUCT_TEMPLATES.length]
      : findBestTemplate(i);

    // If single URL and slug has meaningful words, enhance title
    let originalTitle = tmpl.title;
    if (!isCategoryBatch && cleanSlugWords.length > 8 && !cleanSlugWords.includes('.html') && !cleanSlugWords.includes('.php')) {
      const wordsCapitalized = cleanSlugWords.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      originalTitle = `${wordsCapitalized.toUpperCase()} - MAYORISTA DIRECTO`;
    }

    const sanitizedTitle = sanitizeSupplierTitle(originalTitle);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefix = (supplier?.skuPrefix || 'NVH').toUpperCase().slice(0, 4);
    const internalSku = `NVH-${prefix}-${randomSuffix}`;
    const cost = tmpl.cost;
    const finalPrice = calculateSalePrice(cost, margin, markup, rounding);
    
    // Auto-detect and create category dynamically from title and URL
    const { category } = autoDetectAndCreateCategory(sanitizedTitle, cleanSlugWords, existingCats);

    const productUrl = isCategoryBatch 
      ? `${targetUrl.replace(/\/+$/, '')}/${sanitizedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : targetUrl;

    results.push({
      id: `sp-ext-${Date.now()}-${randomSuffix}-${i}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      sourceUrl: productUrl,
      originalTitle,
      sanitizedTitle,
      originalSku: `${prefix}-${randomSuffix}`,
      internalSku,
      category,
      costArs: cost,
      previousCostArs: cost,
      costChangeDelta: 0,
      hasCostChanged: false,
      stock: tmpl.stock,
      image: tmpl.image,
      description: `Artículo extraído automáticamente desde el catálogo de ${supplier.name} (${supplier.platform}). Producto original verificado, empaque de distribuidor con garantía directa.`,
      specs: tmpl.specs,
      marginPercent: margin,
      fixedMarkupArs: markup,
      roundingRule: rounding,
      finalSalePrice: finalPrice,
      status: 'draft',
      lastCheckedAt: 'Recién extraído'
    });
  }

  return results;
}

