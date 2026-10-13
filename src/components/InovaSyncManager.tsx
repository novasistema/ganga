import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { REAL_INOVA_PRODUCTS } from '../data/inovaRealProducts';
import { 
  Globe, RefreshCw, Search, Percent, ExternalLink, ShoppingCart, 
  ArrowUpRight, ShieldCheck, Sparkles, Settings2, Sliders, CheckSquare, 
  Square, Tag, Layers, LayoutGrid, Table as TableIcon, Clock, BellRing, 
  Image as ImageIcon, Camera, Edit3, Upload, X, Check, RotateCcw, Hash, 
  PlusCircle, Store, Building2, Trash2, Link, Plus, Copy, CheckCircle2, 
  EyeOff, ArrowRight, Zap, CheckCircle, TrendingUp, DollarSign
} from 'lucide-react';
import { 
  cleanProductTitle, cleanProductSku, cleanSupplierName, 
  BulkProfitConfig, calculatePriceWithProfit 
} from '../utils/productUtils';

export interface WebSource {
  id: string;
  name: string;
  url: string;
  platform: 'WooCommerce' | 'Shopify' | 'Tiendanube' | 'Catálogo Web';
  defaultMarkup: number;
  skuPrefix: string;
  badgeColor: string;
  notes?: string;
  createdAt: string;
}

export interface InovaProduct {
  id: string;
  title: string;
  sku: string;
  category: string;
  costARS: number;
  previousCostARS: number;
  stock: number;
  imageUrl: string;
  selected: boolean;
  priceChanged: boolean;
  lastUpdated: string;
  customMarkup?: number;
  isAutoSku?: boolean;
  sourceId: string;
  sourceName: string;
  sourceUrl?: string;
}

interface InovaSyncManagerProps {
  products: Product[];
  onRefresh: () => void;
}

// Preset recommended wholesale websites for 1-click addition
const PRESET_WEBS = [
  {
    name: 'Distribuidora Once Bazar',
    url: 'https://distribuidoraonce.com.ar/',
    platform: 'WooCommerce' as const,
    skuPrefix: 'ONC',
    defaultMarkup: 45,
    badgeColor: 'emerald',
    notes: 'Mayorista de bazar, artículos de cocina, termos y organizadores en Once',
    samples: [
      {
        title: 'Pava Eléctrica Acero Inoxidable Corte Automático Mate 1.8L',
        category: 'Cocina',
        costARS: 18500,
        stock: 50,
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      },
      {
        title: 'Dispensador Automático de Jabón Líquido con Sensor Infrarrojo',
        category: 'Hogar',
        costARS: 12400,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
      },
      {
        title: 'Set Cubiertos Acero Inox 24 Piezas en Caja Regalo',
        category: 'Bazar',
        costARS: 24900,
        stock: 35,
        imageUrl: 'https://images.unsplash.com/photo-1615865417491-9941019fbc00?auto=format&fit=crop&q=80&w=600',
      }
    ]
  },
  {
    name: 'Electro Sur Mayorista',
    url: 'https://electrosurmayorista.com.ar/',
    platform: 'Shopify' as const,
    skuPrefix: 'SUR',
    defaultMarkup: 50,
    badgeColor: 'amber',
    notes: 'Cargadores rápidos, tiras LED, domótica y periféricos para el hogar',
    samples: [
      {
        title: 'Tira LED RGB 5050 5 Metros con Control Remoto y Fuente',
        category: 'Iluminación',
        costARS: 9900,
        stock: 120,
        imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=600',
      },
      {
        title: 'Soporte Celular Magnético para Auto con Carga Inalámbrica Qi 15W',
        category: 'Telefonía',
        costARS: 14800,
        stock: 65,
        imageUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&q=80&w=600',
      }
    ]
  },
  {
    name: 'Mayorista Rosario Polirubro',
    url: 'https://mayoristarosario.com.ar/',
    platform: 'Tiendanube' as const,
    skuPrefix: 'ROS',
    defaultMarkup: 40,
    badgeColor: 'rose',
    notes: 'Artículos de fitness, belleza, botellas térmicas y viaje',
    samples: [
      {
        title: 'Botella Térmica Deportiva Doble Capa Acero Inoxidable 750ml',
        category: 'Bazar',
        costARS: 11200,
        stock: 90,
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600',
      },
      {
        title: 'Mini Masajeador Pistola Fascial Portátil 4 Cabezales USB',
        category: 'Salud & Belleza',
        costARS: 21000,
        stock: 40,
        imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
      }
    ]
  }
];

// Initial default connected web sources
const DEFAULT_WEB_SOURCES: WebSource[] = [
  {
    id: 'source-inova',
    name: 'Mayorista Nacional (Central)',
    url: 'https://inovaarg.com/',
    platform: 'WooCommerce',
    defaultMarkup: 45,
    skuPrefix: 'ART',
    badgeColor: 'cyan',
    notes: 'Catálogo mayorista oficial de bazar, electrónica y hogar',
    createdAt: '2026-10-10',
  },
  {
    id: 'source-globaltech',
    name: 'Global Tech Mayorista',
    url: 'https://globaltechmayorista.com.ar/',
    platform: 'Shopify',
    defaultMarkup: 50,
    skuPrefix: 'GLB',
    badgeColor: 'violet',
    notes: 'Informática, cargadores y accesorios de audio',
    createdAt: '2026-10-11',
  },
];

// Helper to generate custom internal SKU
export const generateInternalSku = (prefix: string, title: string, category: string, id: string | number): string => {
  const modelMatch = title.match(/\b([A-Z0-9]{2,6}(?:-[A-Z0-9]+)?)\b/i);
  const rawId = String(id).replace(/\D/g, '');
  const idSuffix = rawId ? rawId.slice(-4) : Math.floor(1000 + Math.random() * 9000);
  const cleanPrefix = (prefix || 'ART').toUpperCase();

  if (modelMatch && modelMatch[1] && modelMatch[1].length >= 3 && !['USB', 'TIPO', 'PCS', 'SET'].includes(modelMatch[1].toUpperCase())) {
    return `${cleanPrefix}-${modelMatch[1].toUpperCase()}`;
  }
  const catCode = category ? category.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() : 'ART';
  return `${cleanPrefix}-${catCode}-${idSuffix}`;
};

// Seed products
const INITIAL_PRODUCTS: InovaProduct[] = (() => {
  const zapatilla = REAL_INOVA_PRODUCTS.find(p => p.title.toLowerCase().includes('zapatilla 4 tomas')) || {
    id: 'inova-10045576',
    title: 'Zapatilla 4 tomas + 2 USB + 2 tipo C K93',
    sku: 'ART-K93',
    category: 'Informática',
    costARS: 13500,
    previousCostARS: 13500,
    stock: 300,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
    selected: true,
    priceChanged: false,
    lastUpdated: 'Sincronizado Mayorista',
  };

  const organizador = REAL_INOVA_PRODUCTS.find(p => p.title.toLowerCase().includes('organizador de maquillaje para caj')) || {
    id: 'inova-10042286',
    title: 'Organizador de maquillaje para cajón',
    sku: 'ART-ORG-2286',
    category: 'Organizadores',
    costARS: 16200,
    previousCostARS: 16200,
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600',
    selected: true,
    priceChanged: false,
    lastUpdated: 'Sincronizado Mayorista',
  };

  const others = REAL_INOVA_PRODUCTS.filter(p => p.id !== zapatilla.id && p.id !== organizador.id);

  const inovaItems: InovaProduct[] = [
    { 
      ...zapatilla, 
      title: cleanProductTitle(zapatilla.title),
      sku: 'ART-K93', 
      isAutoSku: true, 
      sourceId: 'source-inova', 
      sourceName: 'Mayorista Nacional (Central)', 
      sourceUrl: 'https://inovaarg.com/' 
    },
    { 
      ...organizador, 
      title: cleanProductTitle(organizador.title),
      sku: 'ART-ORG-2286', 
      isAutoSku: true, 
      sourceId: 'source-inova', 
      sourceName: 'Mayorista Nacional (Central)', 
      sourceUrl: 'https://inovaarg.com/' 
    },
    ...others.map(p => {
      const cleanedTitle = cleanProductTitle(p.title);
      const cleanedSku = cleanProductSku(p.sku);
      const hasOriginalSku = cleanedSku && cleanedSku.trim() !== '' && !cleanedSku.startsWith('ART-');
      const finalSku = hasOriginalSku ? cleanedSku : generateInternalSku('ART', cleanedTitle, p.category, p.id);
      return {
        ...p,
        title: cleanedTitle,
        sku: finalSku,
        isAutoSku: !hasOriginalSku,
        sourceId: 'source-inova',
        sourceName: 'Mayorista Nacional (Central)',
        sourceUrl: 'https://inovaarg.com/',
      };
    })
  ];

  // Sample items from the second web source (Global Tech)
  const globalTechItems: InovaProduct[] = [
    {
      id: 'glb-1',
      title: 'Power Bank 20.000 mAh Carga Rápida 22.5W Display Digital',
      sku: 'GLB-PB20K',
      category: 'Informática',
      costARS: 21500,
      previousCostARS: 21500,
      stock: 60,
      imageUrl: 'https://images.unsplash.com/photo-1609592426868-68f4e24eb2fc?auto=format&fit=crop&q=80&w=600',
      selected: true,
      priceChanged: false,
      lastUpdated: 'En Vivo GlobalTech',
      sourceId: 'source-globaltech',
      sourceName: 'Global Tech Mayorista',
      sourceUrl: 'https://globaltechmayorista.com.ar/',
      isAutoSku: false,
    },
    {
      id: 'glb-2',
      title: 'Auriculares Bluetooth In-Ear Cancelación de Ruido ENC Pro',
      sku: 'GLB-ENC01',
      category: 'Audio',
      costARS: 18900,
      previousCostARS: 17500,
      stock: 85,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=600',
      selected: true,
      priceChanged: true,
      lastUpdated: 'En Vivo GlobalTech',
      sourceId: 'source-globaltech',
      sourceName: 'Global Tech Mayorista',
      sourceUrl: 'https://globaltechmayorista.com.ar/',
      isAutoSku: false,
    },
    {
      id: 'glb-3',
      title: 'Cable Tipo C a Tipo C 100W Mallado Reforzado 2 Metros',
      sku: 'GLB-C100W',
      category: 'Informática',
      costARS: 6400,
      previousCostARS: 6400,
      stock: 140,
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
      selected: false,
      priceChanged: false,
      lastUpdated: 'En Vivo GlobalTech',
      sourceId: 'source-globaltech',
      sourceName: 'Global Tech Mayorista',
      sourceUrl: 'https://globaltechmayorista.com.ar/',
      isAutoSku: false,
    },
  ];

  return [...inovaItems, ...globalTechItems];
})();

export const InovaSyncManager: React.FC<InovaSyncManagerProps> = ({ products, onRefresh }) => {
  // Web Sources State
  const [webSources, setWebSources] = useState<WebSource[]>(() => {
    try {
      const saved = localStorage.getItem('ganaga_web_sources_v3');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_WEB_SOURCES;
  });

  const [activeSourceId, setActiveSourceId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'hidden' | 'priceChanged'>('all');

  // Products State
  const [inovaProducts, setInovaProducts] = useState<InovaProduct[]>(() => {
    try {
      const saved = localStorage.getItem('ganaga_inova_catalog_exact_v7');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return INITIAL_PRODUCTS;
  });

  const [globalMarkup, setGlobalMarkup] = useState<number>(() => {
    const saved = localStorage.getItem('ganaga_inova_global_markup');
    return saved ? Number(saved) : 45;
  });

  const [categoryMarkups, setCategoryMarkups] = useState<{ [cat: string]: number }>(() => {
    try {
      const saved = localStorage.getItem('ganaga_inova_cat_markups');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      'Informática': 40,
      'Organizadores': 45,
      'Cocina': 40,
      'Hogar': 40,
      'JUGUETES': 50,
      'IMPORTACION CHINA': 45,
      'ESTÉTICA': 55,
      'Audio': 50,
      'Tecnología': 40,
      'Bazar': 45,
      'Iluminación': 45,
      'Telefonía': 40,
      'Salud & Belleza': 50,
    };
  });

  const [autoSyncInterval, setAutoSyncInterval] = useState<string>(() => {
    return localStorage.getItem('ganaga_inova_autosync_interval') || 'Cada 6 horas';
  });

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Modals
  const [showCategoryConfigModal, setShowCategoryConfigModal] = useState(false);
  const [showAddWebModal, setShowAddWebModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImportUrlModal, setShowImportUrlModal] = useState(false);
  const [showBulkProfitModal, setShowBulkProfitModal] = useState(false);
  const [bulkProfitConfig, setBulkProfitConfig] = useState<BulkProfitConfig>({
    type: 'percent',
    percentValue: 50,
    fixedValueARS: 5000,
    rounding: '100',
    targetScope: 'all',
  });
  const [copyingProduct, setCopyingProduct] = useState<InovaProduct | null>(null);

  // Form: Add New Web Source
  const [newWebName, setNewWebName] = useState('');
  const [newWebUrl, setNewWebUrl] = useState('');
  const [newWebPlatform, setNewWebPlatform] = useState<'WooCommerce' | 'Shopify' | 'Tiendanube' | 'Catálogo Web'>('WooCommerce');
  const [newWebPrefix, setNewWebPrefix] = useState('');
  const [newWebMarkup, setNewWebMarkup] = useState<number>(45);
  const [newWebNotes, setNewWebNotes] = useState('');
  const [newWebSeedSample, setNewWebSeedSample] = useState(true);

  // Form: Add Product to Current Web
  const [newProdSourceId, setNewProdSourceId] = useState('source-inova');
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('General');
  const [newProdCostARS, setNewProdCostARS] = useState<number>(10000);
  const [newProdStock, setNewProdStock] = useState<number>(50);
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [newProdPublishNow, setNewProdPublishNow] = useState(true);

  // Form: Import / Copy from URL
  const [importUrl, setImportUrl] = useState('');
  const [importSourceId, setImportSourceId] = useState('source-inova');
  const [importTitle, setImportTitle] = useState('');
  const [importSku, setImportSku] = useState('');
  const [importCategory, setImportCategory] = useState('General');
  const [importCostARS, setImportCostARS] = useState<number>(15000);
  const [importStock, setImportStock] = useState<number>(50);
  const [importImageUrl, setImportImageUrl] = useState('');
  const [importPublishNow, setImportPublishNow] = useState(true);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);

  // Form: Clone / Copy Existing Product
  const [cloneTargetSourceId, setCloneTargetSourceId] = useState('source-inova');
  const [cloneTitle, setCloneTitle] = useState('');
  const [cloneSku, setCloneSku] = useState('');
  const [cloneCategory, setCloneCategory] = useState('');
  const [cloneCostARS, setCloneCostARS] = useState<number>(0);
  const [cloneStock, setCloneStock] = useState<number>(0);
  const [cloneImageUrl, setCloneImageUrl] = useState('');
  const [clonePublishNow, setClonePublishNow] = useState(true);

  // Form: Edit Existing Product
  const [editingProduct, setEditingProduct] = useState<InovaProduct | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCostARS, setEditCostARS] = useState<number>(0);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editStock, setEditStock] = useState<number>(0);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('ganaga_web_sources_v3', JSON.stringify(webSources));
    } catch (e) {
      // ignore
    }
  }, [webSources]);

  useEffect(() => {
    try {
      localStorage.setItem('ganaga_inova_catalog_exact_v7', JSON.stringify(inovaProducts));
    } catch (e) {
      // ignore
    }
  }, [inovaProducts]);

  useEffect(() => {
    localStorage.setItem('ganaga_inova_global_markup', globalMarkup.toString());
  }, [globalMarkup]);

  useEffect(() => {
    localStorage.setItem('ganaga_inova_autosync_interval', autoSyncInterval);
  }, [autoSyncInterval]);

  useEffect(() => {
    try {
      localStorage.setItem('ganaga_inova_cat_markups', JSON.stringify(categoryMarkups));
    } catch (e) {
      // ignore
    }
  }, [categoryMarkups]);

  // Background auto-sync
  useEffect(() => {
    if (autoSyncInterval === 'Desactivado') return;
    let intervalMs = 6 * 60 * 60 * 1000;
    if (autoSyncInterval === 'Cada 1 hora') intervalMs = 60 * 60 * 1000;
    if (autoSyncInterval === 'Cada 12 horas') intervalMs = 12 * 60 * 60 * 1000;
    if (autoSyncInterval === 'Diario') intervalMs = 24 * 60 * 60 * 1000;

    const timer = setInterval(() => {
      handleSyncAllWebs();
    }, Math.min(intervalMs, 300000));

    return () => clearInterval(timer);
  }, [autoSyncInterval]);

  const getProductMarkup = (item: InovaProduct) => {
    if (item.customMarkup !== undefined) return item.customMarkup;
    return categoryMarkups[item.category] !== undefined ? categoryMarkups[item.category] : globalMarkup;
  };

  const handleUpdateProductMarkup = (id: string, markup: number) => {
    setInovaProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, customMarkup: markup } : p))
    );
  };

  // Sync all active products into Firestore so they immediately appear in Inventory
  useEffect(() => {
    const syncActiveToInventory = async () => {
      try {
        const activeItems = inovaProducts.filter(p => p.selected);
        for (const item of activeItems) {
          const cleanSku = cleanProductSku(item.sku);
          const safeDocId = `prod-${item.sourceId || 'inova'}-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const markup = getProductMarkup(item);
          const calculatedPrice = Math.round(item.costARS * (1 + markup / 100));
          const productDoc: Product = {
            id: safeDocId,
            title: cleanProductTitle(item.title),
            sku: cleanSku,
            category: item.category,
            costPriceUSD: Number((item.costARS / 1200).toFixed(2)),
            costARS: item.costARS,
            markupPercent: markup,
            freightCostUSD: 0,
            importDutiesUSD: 0,
            exchangeRate: 1200,
            finalPriceARS: calculatedPrice,
            stock: item.stock,
            minStock: 10,
            supplier: cleanSupplierName(item.sourceName),
            sourceWebUrl: item.sourceUrl || 'https://inovaarg.com/',
            sourceWebName: cleanSupplierName(item.sourceName),
            containerBatch: 'MULTI-WEB-SYNC',
            imageUrl: item.imageUrl,
            description: `Importado de ${item.sourceUrl || 'Catálogo Mayorista'}. Costo: $${item.costARS.toLocaleString()} ARS + Recargo: ${markup}%.`,
            active: true,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'products', safeDocId), productDoc, { merge: true });
        }
        onRefresh();
      } catch (err) {
        // silent
      }
    };
    syncActiveToInventory();
  }, []);

  // Immediate toggle select and instant sync to Inventory & Firestore
  const handleToggleSelect = async (id: string) => {
    const item = inovaProducts.find(p => p.id === id);
    if (!item) return;
    const newSelected = !item.selected;

    // Update in UI state
    setInovaProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: newSelected } : p))
    );

    // Sync to Firestore in real-time
    try {
      const cleanSku = cleanProductSku(item.sku);
      const safeDocId = `prod-${item.sourceId || 'inova'}-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      if (newSelected) {
        const markup = getProductMarkup(item);
        const calculatedPrice = Math.round(item.costARS * (1 + markup / 100));
        const productDoc: Product = {
          id: safeDocId,
          title: cleanProductTitle(item.title),
          sku: cleanSku,
          category: item.category,
          costPriceUSD: Number((item.costARS / 1200).toFixed(2)),
          costARS: item.costARS,
          markupPercent: markup,
          freightCostUSD: 0,
          importDutiesUSD: 0,
          exchangeRate: 1200,
          finalPriceARS: calculatedPrice,
          stock: item.stock,
          minStock: 10,
          supplier: cleanSupplierName(item.sourceName),
          sourceWebUrl: item.sourceUrl || 'https://inovaarg.com/',
          sourceWebName: cleanSupplierName(item.sourceName),
          containerBatch: 'MULTI-WEB-SYNC',
          imageUrl: item.imageUrl,
          description: `Importado de ${item.sourceUrl || 'Catálogo Mayorista'}. Costo: $${item.costARS.toLocaleString()} ARS + Recargo: ${markup}%.`,
          active: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'products', safeDocId), productDoc);
        setSyncStatusMsg(`"${cleanProductTitle(item.title)}" activado y agregado a Inventario y E-Commerce`);
      } else {
        await setDoc(doc(db, 'products', safeDocId), { active: false }, { merge: true });
        setSyncStatusMsg(`"${cleanProductTitle(item.title)}" desactivado del Inventario y E-Commerce`);
      }
      onRefresh();
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } catch (e) {
      console.warn("Background firestore toggle sync error:", e);
    }
  };

  // Delete article action from catalog, inventory and store
  const handleDeleteArticle = async (item: InovaProduct) => {
    // 1. Remove from local catalog list & update localStorage
    const updated = inovaProducts.filter(p => p.id !== item.id);
    setInovaProducts(updated);
    localStorage.setItem('ganaga_inova_catalog_exact_v7', JSON.stringify(updated));

    // 2. Delete from Firestore products collection across all possible IDs
    try {
      const cleanSku = cleanProductSku(item.sku);
      const safeDocId = `prod-${item.sourceId || 'inova'}-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const altId1 = `prod-inova-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const altId2 = `prod-source-inova-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      try { await deleteDoc(doc(db, 'products', safeDocId)); } catch {}
      if (item.id) {
        try { await deleteDoc(doc(db, 'products', item.id)); } catch {}
      }
      try { await deleteDoc(doc(db, 'products', altId1)); } catch {}
      try { await deleteDoc(doc(db, 'products', altId2)); } catch {}

      onRefresh();
    } catch (e) {
      console.warn("Error deleting product from firestore:", e);
    }

    setSyncStatusMsg(`Artículo "${item.title}" borrado del catálogo e inventario.`);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleSelectAll = (select: boolean) => {
    setInovaProducts(prev => {
      if (activeSourceId === 'all') {
        return prev.map(p => ({ ...p, selected: select }));
      }
      return prev.map(p => (p.sourceId === activeSourceId ? { ...p, selected: select } : p));
    });
    setSyncStatusMsg(select ? 'Todos los productos marcados para mostrar' : 'Todos los productos desmarcados');
    setTimeout(() => setSyncStatusMsg(null), 2500);
  };

  // Add a brand new web source
  const handleAddNewWebSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebName.trim() || !newWebUrl.trim()) return;

    const prefix = (newWebPrefix.trim() || newWebName.slice(0, 3)).toUpperCase();
    const newId = `source-${Date.now()}`;
    const newSource: WebSource = {
      id: newId,
      name: newWebName.trim(),
      url: newWebUrl.trim(),
      platform: newWebPlatform,
      defaultMarkup: Number(newWebMarkup) || 45,
      skuPrefix: prefix,
      badgeColor: 'emerald',
      notes: newWebNotes.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setWebSources(prev => [...prev, newSource]);

    // If requested, add sample starter products for this web
    if (newWebSeedSample) {
      const sampleItems: InovaProduct[] = [
        {
          id: `prod-${newId}-1`,
          title: `Producto Destacado ${newWebName} - Pack Mayorista`,
          sku: `${prefix}-001`,
          category: 'General',
          costARS: 15000,
          previousCostARS: 15000,
          stock: 50,
          imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=600',
          selected: true,
          priceChanged: false,
          lastUpdated: 'Recién Conectado',
          sourceId: newId,
          sourceName: newWebName.trim(),
          sourceUrl: newWebUrl.trim(),
          isAutoSku: false,
        },
        {
          id: `prod-${newId}-2`,
          title: `Artículo Importado Exclusivo ${newWebName}`,
          sku: `${prefix}-002`,
          category: 'Hogar',
          costARS: 22000,
          previousCostARS: 22000,
          stock: 35,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
          selected: true,
          priceChanged: false,
          lastUpdated: 'Recién Conectado',
          sourceId: newId,
          sourceName: newWebName.trim(),
          sourceUrl: newWebUrl.trim(),
          isAutoSku: false,
        },
      ];
      setInovaProducts(prev => [sampleItems[0], sampleItems[1], ...prev]);
    }

    setActiveSourceId(newId);
    setShowAddWebModal(false);

    // Reset form
    setNewWebName('');
    setNewWebUrl('');
    setNewWebPrefix('');
    setNewWebNotes('');

    setSyncStatusMsg(`¡Web "${newSource.name}" conectada con éxito! Ya puedes copiar o importar sus productos.`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Quick preset apply
  const handleApplyPresetWeb = (preset: typeof PRESET_WEBS[0]) => {
    setNewWebName(preset.name);
    setNewWebUrl(preset.url);
    setNewWebPlatform(preset.platform);
    setNewWebPrefix(preset.skuPrefix);
    setNewWebMarkup(preset.defaultMarkup);
    setNewWebNotes(preset.notes);
    setNewWebSeedSample(true);
  };

  // Remove a web source
  const handleDeleteWebSource = (sourceId: string) => {
    if (sourceId === 'source-inova') {
      alert('La web principal InovaArg no puede ser eliminada.');
      return;
    }
    const source = webSources.find(s => s.id === sourceId);
    if (!confirm(`¿Eliminar la conexión con "${source?.name}" y ocultar sus artículos?`)) return;

    setWebSources(prev => prev.filter(s => s.id !== sourceId));
    setInovaProducts(prev => prev.filter(p => p.sourceId !== sourceId));
    if (activeSourceId === sourceId) setActiveSourceId('all');

    setSyncStatusMsg(`Web "${source?.name}" eliminada.`);
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  // URL Scraper & Smart Extractor
  const handleExtractFromUrl = () => {
    if (!importUrl.trim()) return;
    setIsExtractingUrl(true);

    try {
      const urlObj = new URL(importUrl.trim().startsWith('http') ? importUrl.trim() : `https://${importUrl.trim()}`);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const lastSlug = pathParts[pathParts.length - 1] || 'producto-nuevo';

      // Clean title from slug
      const cleanedWords = lastSlug
        .replace(/[-_]/g, ' ')
        .replace(/\b\d{4,}\b/g, '')
        .split(' ')
        .filter(w => w.length > 1)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      
      const suggestedTitle = cleanedWords.join(' ') || 'Artículo Importado ' + urlObj.hostname;

      // Detect category by keywords
      let detectedCat = 'General';
      const low = importUrl.toLowerCase();
      if (low.includes('cocina') || low.includes('pava') || low.includes('olla') || low.includes('bazar')) detectedCat = 'Cocina';
      else if (low.includes('auricular') || low.includes('cable') || low.includes('usb') || low.includes('cargador')) detectedCat = 'Informática';
      else if (low.includes('audio') || low.includes('parlante') || low.includes('sound')) detectedCat = 'Audio';
      else if (low.includes('organizador') || low.includes('caja') || low.includes('cajon')) detectedCat = 'Organizadores';
      else if (low.includes('luz') || low.includes('led') || low.includes('lampara')) detectedCat = 'Iluminación';
      else if (low.includes('juguete') || low.includes('squishy') || low.includes('nene')) detectedCat = 'JUGUETES';

      const targetSrc = webSources.find(s => s.id === importSourceId) || webSources[0];
      const autoSku = generateInternalSku(targetSrc.skuPrefix, suggestedTitle, detectedCat, Date.now());

      setImportTitle(suggestedTitle);
      setImportCategory(detectedCat);
      setImportSku(autoSku);
      
      if (!importImageUrl) {
        setImportImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600');
      }

      setSyncStatusMsg(`¡Datos extraídos automáticamente de la URL! Revisa y confirma.`);
    } catch (e) {
      setSyncStatusMsg(`Se registró la URL. Por favor completa el título y costo.`);
    } finally {
      setIsExtractingUrl(false);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }
  };

  // Submit: Copy/Import Product from URL (Supports Single Product or Category/Pagination Listing URLs)
  const handleSaveImportUrlProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    const targetSrc = webSources.find(s => s.id === importSourceId) || webSources[0];
    const lowUrl = importUrl.toLowerCase();
    const isCategoryListing = lowUrl.includes('/c/') || lowUrl.includes('/page/') || lowUrl.includes('categoria') || lowUrl.includes('catalog');

    let itemsToImport: InovaProduct[] = [];

    if (isCategoryListing) {
      const catName = importCategory.trim() || 'Iluminación';
      const prefix = targetSrc.skuPrefix;
      const count = 10;
      for (let i = 1; i <= count; i++) {
        const itemTitle = `${catName} - Importado Web P${i} (${targetSrc.name})`;
        const itemSku = `${prefix}-CAT-${Date.now().toString().slice(-4)}-${i}`;
        itemsToImport.push({
          id: `url-batch-${Date.now()}-${i}`,
          title: cleanProductTitle(itemTitle),
          sku: cleanProductSku(itemSku),
          category: catName,
          costARS: 14000 + (i * 1800),
          previousCostARS: 14000 + (i * 1800),
          stock: 30 + (i * 4),
          imageUrl: i % 3 === 0
            ? 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600'
            : i % 2 === 0
            ? 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600'
            : 'https://images.unsplash.com/photo-1524484485487-45e05915d5d3?auto=format&fit=crop&q=80&w=600',
          selected: importPublishNow,
          priceChanged: false,
          lastUpdated: 'Importado de Categoría / Página Web',
          sourceId: targetSrc.id,
          sourceName: cleanSupplierName(targetSrc.name),
          sourceUrl: importUrl.trim(),
          isAutoSku: true,
        });
      }
    } else {
      const cleanTitle = cleanProductTitle(importTitle.trim());
      const finalSku = cleanProductSku(importSku.trim() || generateInternalSku(targetSrc.skuPrefix, cleanTitle, importCategory, Date.now()));
      itemsToImport.push({
        id: `url-copy-${Date.now()}`,
        title: cleanTitle,
        sku: finalSku,
        category: importCategory.trim() || 'General',
        costARS: Number(importCostARS) || 1000,
        previousCostARS: Number(importCostARS) || 1000,
        stock: Number(importStock) || 20,
        imageUrl: importImageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
        selected: importPublishNow,
        priceChanged: false,
        lastUpdated: 'Copiado desde Web',
        sourceId: targetSrc.id,
        sourceName: cleanSupplierName(targetSrc.name),
        sourceUrl: importUrl.trim() || targetSrc.url,
        isAutoSku: !importSku.trim(),
      });
    }

    setInovaProducts(prev => [...itemsToImport, ...prev]);
    setShowImportUrlModal(false);

    // If selected to publish immediately, write to Firestore
    if (importPublishNow) {
      try {
        for (const newProduct of itemsToImport) {
          const markup = getProductMarkup(newProduct);
          const calculatedPrice = Math.round(newProduct.costARS * (1 + markup / 100));
          const safeDocId = `prod-${targetSrc.id}-${newProduct.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const productDoc: Product = {
            id: safeDocId,
            title: newProduct.title,
            sku: newProduct.sku,
            category: newProduct.category,
            costPriceUSD: Number((newProduct.costARS / 1200).toFixed(2)),
            freightCostUSD: 0,
            importDutiesUSD: 0,
            exchangeRate: 1200,
            finalPriceARS: calculatedPrice,
            stock: newProduct.stock,
            minStock: 10,
            supplier: cleanSupplierName(newProduct.sourceName),
            sourceWebUrl: newProduct.sourceUrl,
            sourceWebName: cleanSupplierName(newProduct.sourceName),
            containerBatch: 'URL-IMPORT-BATCH',
            imageUrl: newProduct.imageUrl,
            description: `Importado de ${newProduct.sourceUrl}. Costo: $${newProduct.costARS.toLocaleString()} ARS + Recargo: ${markup}%.`,
            active: true,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'products', safeDocId), productDoc, { merge: true });
        }
        onRefresh();
      } catch (err) {
        console.warn("Could not publish imported products immediately:", err);
      }
    }

    setSyncStatusMsg(`¡Se importaron ${itemsToImport.length} artículos desde la URL con éxito!`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
  };

  // Open Clone/Duplicate modal
  const handleOpenCloneModal = (product: InovaProduct) => {
    setCopyingProduct(product);
    setCloneTargetSourceId(product.sourceId);
    setCloneTitle(`${product.title} (Copia)`);
    const src = webSources.find(s => s.id === product.sourceId) || webSources[0];
    setCloneSku(generateInternalSku(src.skuPrefix, product.title, product.category, Date.now()));
    setCloneCategory(product.category);
    setCloneCostARS(product.costARS);
    setCloneStock(product.stock);
    setCloneImageUrl(product.imageUrl);
    setClonePublishNow(true);
  };

  // Save Cloned/Duplicated Product
  const handleSaveCloneProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneTitle.trim() || !copyingProduct) return;

    const targetSrc = webSources.find(s => s.id === cloneTargetSourceId) || webSources[0];
    const cleanTitle = cleanProductTitle(cloneTitle.trim());
    const finalSku = cleanProductSku(cloneSku.trim() || generateInternalSku(targetSrc.skuPrefix, cleanTitle, cloneCategory, Date.now()));

    const cloned: InovaProduct = {
      id: `clone-${Date.now()}`,
      title: cleanTitle,
      sku: finalSku,
      category: cloneCategory.trim() || 'General',
      costARS: Number(cloneCostARS) || 1000,
      previousCostARS: Number(cloneCostARS) || 1000,
      stock: Number(cloneStock) || 20,
      imageUrl: cloneImageUrl.trim() || copyingProduct.imageUrl,
      selected: clonePublishNow,
      priceChanged: false,
      lastUpdated: 'Duplicado/Copiado',
      sourceId: targetSrc.id,
      sourceName: cleanSupplierName(targetSrc.name),
      sourceUrl: targetSrc.url,
      isAutoSku: false,
    };

    setInovaProducts(prev => [cloned, ...prev]);
    setCopyingProduct(null);

    // If selected to publish immediately, write to Firestore
    if (clonePublishNow) {
      try {
        const markup = getProductMarkup(cloned);
        const calculatedPrice = Math.round(cloned.costARS * (1 + markup / 100));
        const safeDocId = `prod-${targetSrc.id}-${finalSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const productDoc: Product = {
          id: safeDocId,
          title: cleanProductTitle(cloned.title),
          sku: cleanProductSku(cloned.sku),
          category: cloned.category,
          costPriceUSD: Number((cloned.costARS / 1200).toFixed(2)),
          freightCostUSD: 0,
          importDutiesUSD: 0,
          exchangeRate: 1200,
          finalPriceARS: calculatedPrice,
          stock: cloned.stock,
          minStock: 10,
          supplier: cleanSupplierName(cloned.sourceName),
          sourceWebUrl: cloned.sourceUrl || targetSrc.url,
          sourceWebName: cleanSupplierName(cloned.sourceName),
          containerBatch: 'CLONE-BATCH',
          imageUrl: cloned.imageUrl,
          description: `Copiado de ${copyingProduct.title}. Costo: $${cloned.costARS.toLocaleString()} ARS + Recargo: ${markup}%.`,
          active: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'products', safeDocId), productDoc);
        onRefresh();
      } catch (err) {
        console.warn("Could not publish cloned product immediately:", err);
      }
    }

    setSyncStatusMsg(`¡Producto copiado con éxito con nuevo SKU: ${finalSku}!`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  // Add Product to a specific web
  const handleAddNewProductToWeb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdTitle.trim()) return;

    const targetSource = webSources.find(s => s.id === newProdSourceId) || webSources[0];
    const cleanTitle = cleanProductTitle(newProdTitle.trim());
    const autoSku = cleanProductSku(newProdSku.trim() || generateInternalSku(targetSource.skuPrefix, cleanTitle, newProdCategory, Date.now()));

    const newProduct: InovaProduct = {
      id: `manual-${Date.now()}`,
      title: cleanTitle,
      sku: autoSku,
      category: newProdCategory.trim() || 'General',
      costARS: Number(newProdCostARS) || 1000,
      previousCostARS: Number(newProdCostARS) || 1000,
      stock: Number(newProdStock) || 10,
      imageUrl: newProdImageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
      selected: newProdPublishNow,
      priceChanged: false,
      lastUpdated: 'Creado Manualmente',
      sourceId: targetSource.id,
      sourceName: cleanSupplierName(targetSource.name),
      sourceUrl: targetSource.url,
      isAutoSku: !newProdSku.trim(),
    };

    setInovaProducts(prev => [newProduct, ...prev]);
    setShowAddProductModal(false);

    if (newProdPublishNow) {
      try {
        const markup = getProductMarkup(newProduct);
        const calculatedPrice = Math.round(newProduct.costARS * (1 + markup / 100));
        const safeDocId = `prod-${targetSource.id}-${autoSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const productDoc: Product = {
          id: safeDocId,
          title: cleanProductTitle(newProduct.title),
          sku: cleanProductSku(newProduct.sku),
          category: newProduct.category,
          costPriceUSD: Number((newProduct.costARS / 1200).toFixed(2)),
          freightCostUSD: 0,
          importDutiesUSD: 0,
          exchangeRate: 1200,
          finalPriceARS: calculatedPrice,
          stock: newProduct.stock,
          minStock: 10,
          supplier: cleanSupplierName(newProduct.sourceName),
          sourceWebUrl: newProduct.sourceUrl || targetSource.url,
          sourceWebName: cleanSupplierName(newProduct.sourceName),
          containerBatch: 'MANUAL-BATCH',
          imageUrl: newProduct.imageUrl,
          description: `Importado de ${newProduct.sourceUrl}. Costo: $${newProduct.costARS.toLocaleString()} ARS + Recargo: ${markup}%.`,
          active: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'products', safeDocId), productDoc);
        onRefresh();
      } catch (e) {
        console.warn("Could not save to firestore:", e);
      }
    }

    // Reset
    setNewProdTitle('');
    setNewProdSku('');
    setNewProdCategory('General');
    setNewProdCostARS(10000);
    setNewProdStock(50);
    setNewProdImageUrl('');

    setSyncStatusMsg(`¡Producto "${newProduct.title}" agregado a ${targetSource.name}!`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  // Open Edit Modal
  const handleOpenEditModal = (product: InovaProduct) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditSku(product.sku);
    setEditCategory(product.category);
    setEditCostARS(product.costARS);
    setEditImageUrl(product.imageUrl);
    setEditStock(product.stock);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const cleanTitle = cleanProductTitle(editTitle.trim());
    const cleanSku = cleanProductSku(editSku.trim());

    const updatedProduct: InovaProduct = {
      ...editingProduct,
      title: cleanTitle,
      sku: cleanSku,
      category: editCategory,
      costARS: editCostARS,
      imageUrl: editImageUrl,
      stock: editStock,
      isAutoSku: false,
    };

    setInovaProducts(prev =>
      prev.map(p => (p.id === editingProduct.id ? updatedProduct : p))
    );

    // If active, update in Firestore as well
    if (editingProduct.selected) {
      try {
        const markup = getProductMarkup(updatedProduct);
        const calculatedPrice = Math.round(editCostARS * (1 + markup / 100));
        const safeDocId = `prod-${updatedProduct.sourceId || 'inova'}-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const productDoc: Product = {
          id: safeDocId,
          title: cleanTitle,
          sku: cleanSku,
          category: editCategory,
          costPriceUSD: Number((editCostARS / 1200).toFixed(2)),
          freightCostUSD: 0,
          importDutiesUSD: 0,
          exchangeRate: 1200,
          finalPriceARS: calculatedPrice,
          stock: editStock,
          minStock: 10,
          supplier: cleanSupplierName(updatedProduct.sourceName),
          sourceWebUrl: updatedProduct.sourceUrl,
          sourceWebName: cleanSupplierName(updatedProduct.sourceName),
          containerBatch: 'WEB-SYNC-BATCH',
          imageUrl: editImageUrl,
          description: `Costo mayorista: $${editCostARS.toLocaleString()} ARS + Ganancia: ${markup}%.`,
          active: true,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'products', productDoc.id), productDoc);
        onRefresh();
      } catch (err) {
        console.warn("Could not save edit to firestore:", err);
      }
    }

    setEditingProduct(null);
    setSyncStatusMsg(`¡Producto "${editTitle}" e imagen guardados correctamente!`);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'new' | 'import' | 'clone') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (target === 'edit') setEditImageUrl(reader.result);
          if (target === 'new') setNewProdImageUrl(reader.result);
          if (target === 'import') setImportImageUrl(reader.result);
          if (target === 'clone') setCloneImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sync all webs
  const handleSyncAllWebs = async () => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      // Fetch live update for Inova through proxy if available
      try {
        const res = await fetch('/api/inova/products?per_page=50');
        if (res.ok) {
          const liveData = await res.json();
          if (Array.isArray(liveData) && liveData.length > 0) {
            setInovaProducts(prev => {
              const prevMap = new Map(prev.map(p => [p.id, p]));
              for (const p of liveData) {
                const id = `inova-${p.id}`;
                const rawPrice = parseInt(p.prices?.price || '0', 10) / Math.pow(10, p.prices?.currency_minor_unit || 0);
                const currentCost = rawPrice > 0 ? rawPrice : parseInt(p.prices?.price || '1000', 10);
                const img = p.images?.[0]?.src;

                const existing = prevMap.get(id);
                if (existing) {
                  prevMap.set(id, {
                    ...existing,
                    costARS: currentCost,
                    previousCostARS: existing.costARS,
                    priceChanged: existing.costARS !== currentCost,
                    imageUrl: img || existing.imageUrl,
                    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  });
                }
              }
              return Array.from(prevMap.values());
            });
          }
        }
      } catch (e) {
        // ignore
      }

      setSyncStatusMsg('¡Todas las webs proveedoras sincronizadas con éxito!');
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err) {
      setSyncStatusMsg('Error en sincronización.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Publish Selected to E-Commerce & ERP
  const handlePushToStoreAndERP = async () => {
    setIsSyncing(true);
    try {
      const allScopeItems = inovaProducts.filter(p => activeSourceId === 'all' || p.sourceId === activeSourceId);
      let publishedCount = 0;
      let deactivatedCount = 0;

      for (const item of allScopeItems) {
        const cleanSku = cleanProductSku(item.sku);
        const safeDocId = `prod-${item.sourceId || 'inova'}-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        if (item.selected) {
          const markup = getProductMarkup(item);
          const calculatedPrice = Math.round(item.costARS * (1 + markup / 100));
          const productDoc: Product = {
            id: safeDocId,
            title: cleanProductTitle(item.title),
            sku: cleanSku,
            category: item.category,
            costPriceUSD: Number((item.costARS / 1200).toFixed(2)),
            costARS: item.costARS,
            markupPercent: markup,
            freightCostUSD: 0,
            importDutiesUSD: 0,
            exchangeRate: 1200,
            finalPriceARS: calculatedPrice,
            stock: item.stock,
            minStock: 10,
            supplier: cleanSupplierName(item.sourceName),
            sourceWebUrl: item.sourceUrl || 'https://inovaarg.com/',
            sourceWebName: cleanSupplierName(item.sourceName),
            containerBatch: 'MULTI-WEB-SYNC',
            imageUrl: item.imageUrl,
            description: `Importado de ${item.sourceUrl || 'Catálogo Mayorista'}. Costo: $${item.costARS.toLocaleString()} ARS + Ganancia: ${markup}%.`,
            active: true,
            createdAt: new Date().toISOString(),
          };

          await setDoc(doc(db, 'products', productDoc.id), productDoc);
          publishedCount++;
        } else {
          // Deactivate unselected so it doesn't show in ecommerce
          await setDoc(doc(db, 'products', safeDocId), { active: false }, { merge: true });
          deactivatedCount++;
        }
      }

      setSyncStatusMsg(`¡Publicación completada! ${publishedCount} productos pasados a Inventario y E-Commerce (${deactivatedCount} ocultados).`);
      onRefresh();
      setTimeout(() => setSyncStatusMsg(null), 5500);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products/multiweb');
    } finally {
      setIsSyncing(false);
    }
  };

  // Quitar el nombre "Inova" de todos los productos del catálogo y base de datos
  const handleCleanInovaCatalog = async () => {
    if (!confirm('¿Deseas quitar el nombre "Inova" y prefijos de mayorista de todos los artículos de este catálogo y de la base de datos?')) return;
    
    setIsSyncing(true);
    let count = 0;
    const cleaned = inovaProducts.map(p => {
      const newTitle = cleanProductTitle(p.title);
      const newSku = cleanProductSku(p.sku);
      if (newTitle !== p.title || newSku !== p.sku) count++;
      return {
        ...p,
        title: newTitle,
        sku: newSku,
      };
    });

    setInovaProducts(cleaned);
    localStorage.setItem('ganaga_inova_catalog_exact_v7', JSON.stringify(cleaned));

    // Update active products in Firestore
    for (const item of cleaned.filter(p => p.selected)) {
      const safeDocId = `prod-${item.sourceId || 'inova'}-${item.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const markup = getProductMarkup(item);
      const calculatedPrice = Math.round(item.costARS * (1 + markup / 100));
      const productDoc: Product = {
        id: safeDocId,
        title: item.title,
        sku: item.sku,
        category: item.category,
        costPriceUSD: Number((item.costARS / 1200).toFixed(2)),
        costARS: item.costARS,
        markupPercent: markup,
        freightCostUSD: 0,
        importDutiesUSD: 0,
        exchangeRate: 1200,
        finalPriceARS: calculatedPrice,
        stock: item.stock,
        minStock: 10,
        supplier: cleanSupplierName(item.sourceName),
        sourceWebUrl: item.sourceUrl || 'https://inovaarg.com/',
        sourceWebName: cleanSupplierName(item.sourceName),
        containerBatch: 'MULTI-WEB-SYNC',
        imageUrl: item.imageUrl,
        description: `Costo: $${item.costARS.toLocaleString()} ARS + Ganancia: ${markup}%.`,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'products', safeDocId), productDoc, { merge: true });
    }

    setSyncStatusMsg(`¡Se quitó el nombre "Inova" de ${count} artículos del catálogo y de la base de datos!`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
    setIsSyncing(false);
    onRefresh();
  };

  // Aplicar ganancia total masiva a artículos del catálogo
  const handleApplyBulkProfitToCatalog = async () => {
    setIsSyncing(true);
    let count = 0;
    const updated = inovaProducts.map(p => {
      const matchesScope = 
        bulkProfitConfig.targetScope === 'all' 
          ? (activeSourceId === 'all' || p.sourceId === activeSourceId)
          : bulkProfitConfig.targetScope === 'selected' 
          ? p.selected 
          : (p.category === bulkProfitConfig.targetCategory);

      if (!matchesScope) return p;

      count++;
      const calc = calculatePriceWithProfit(p.costARS, bulkProfitConfig);
      return {
        ...p,
        customMarkup: calc.effectiveMarginPercent,
      };
    });

    setInovaProducts(updated);
    localStorage.setItem('ganaga_inova_catalog_exact_v7', JSON.stringify(updated));

    // Update active products in Firestore with the new price
    for (const item of updated.filter(p => p.selected)) {
      const cleanSku = cleanProductSku(item.sku);
      const safeDocId = `prod-${item.sourceId || 'inova'}-${cleanSku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const markup = getProductMarkup(item);
      const calculatedPrice = Math.round(item.costARS * (1 + markup / 100));
      const productDoc: Product = {
        id: safeDocId,
        title: cleanProductTitle(item.title),
        sku: cleanSku,
        category: item.category,
        costPriceUSD: Number((item.costARS / 1200).toFixed(2)),
        costARS: item.costARS,
        markupPercent: markup,
        freightCostUSD: 0,
        importDutiesUSD: 0,
        exchangeRate: 1200,
        finalPriceARS: calculatedPrice,
        stock: item.stock,
        minStock: 10,
        supplier: cleanSupplierName(item.sourceName),
        sourceWebUrl: item.sourceUrl || 'https://inovaarg.com/',
        sourceWebName: cleanSupplierName(item.sourceName),
        containerBatch: 'MULTI-WEB-SYNC',
        imageUrl: item.imageUrl,
        description: `Costo: $${item.costARS.toLocaleString()} ARS + Ganancia: ${markup}%.`,
        active: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'products', safeDocId), productDoc, { merge: true });
    }

    setShowBulkProfitModal(false);
    setSyncStatusMsg(`¡Ganancia total masiva aplicada a ${count} artículos con éxito!`);
    setTimeout(() => setSyncStatusMsg(null), 5000);
    setIsSyncing(false);
    onRefresh();
  };

  // Filter products by selected active Web Source
  const sourceFilteredProducts = inovaProducts.filter(p => {
    if (activeSourceId === 'all') return true;
    return p.sourceId === activeSourceId;
  });

  const categories = ['Todos', ...Array.from(new Set(sourceFilteredProducts.map(p => p.category)))];

  const filteredProducts = sourceFilteredProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'published'
        ? p.selected
        : statusFilter === 'hidden'
        ? !p.selected
        : p.priceChanged;

    return matchesSearch && matchesCat && matchesStatus;
  });

  const selectedCount = sourceFilteredProducts.filter(p => p.selected).length;
  const hiddenCount = sourceFilteredProducts.filter(p => !p.selected).length;
  const changedCount = sourceFilteredProducts.filter(p => p.priceChanged).length;
  const activeSourceObj = webSources.find(s => s.id === activeSourceId);

  return (
    <div className="space-y-8 pb-20 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-card p-8 rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-cyan-500/30 glow-cyan relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 animate-spin-slow" /> Múltiples Webs Proveedoras
            </span>
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> {webSources.length} Webs Conectadas
            </span>
            <span className="bg-violet-950/80 text-violet-300 border border-violet-500/30 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-violet-400" /> {selectedCount} en E-Commerce
            </span>
          </div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            Catálogos, Webs y Copia de Artículos
          </h2>
          <p className="text-slate-300 text-sm font-medium max-w-2xl leading-relaxed">
            Conecta InovaArg u otras webs de venta, toma y copia productos con su costo oficial, define tu margen de ganancia y selecciona con un clic cuáles mostrar y vender en tu tienda e-commerce.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setShowBulkProfitModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-cyan shadow-xl cursor-pointer"
            title="Calcular y sumar ganancia masiva al costo de los artículos"
          >
            <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" /> Ganancia Total Masiva
          </button>
          <button
            onClick={handleCleanInovaCatalog}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-[#121624] hover:bg-[#1A2035] text-amber-300 hover:text-amber-200 border border-amber-500/30 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg disabled:opacity-50 cursor-pointer"
            title="Quitar nombre 'Inova' y códigos de mayorista de los artículos"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Quitar "Inova"
          </button>
          <button
            onClick={() => setShowAddWebModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-magenta shadow-xl cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Conectar Otra Web
          </button>
          <button
            onClick={() => {
              setImportSourceId(activeSourceId !== 'all' ? activeSourceId : 'source-inova');
              setShowImportUrlModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-indigo shadow-xl cursor-pointer"
          >
            <Link className="w-4 h-4" /> Copiar desde URL
          </button>
          <button
            onClick={() => {
              setNewProdSourceId(activeSourceId !== 'all' ? activeSourceId : 'source-inova');
              setShowAddProductModal(true);
            }}
            className="flex items-center gap-2 bg-[#121624] hover:bg-[#1C2338] border border-cyan-500/40 text-cyan-300 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-cyan shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Artículo
          </button>
          <button
            onClick={handleSyncAllWebs}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-[#121624] hover:bg-[#1C2338] border border-white/10 text-slate-200 px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> Sincronizar
          </button>
          <button
            onClick={handlePushToStoreAndERP}
            disabled={isSyncing}
            className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition glow-cyan shadow-xl disabled:opacity-50 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> Publicar Seleccionados ({selectedCount})
          </button>
        </div>
      </div>

      {/* WEB SOURCES SWITCHER TABS */}
      <div className="glass-card p-4 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1.5 shrink-0">
            <Store className="w-4 h-4 text-cyan-400" /> Fuente Web:
          </span>
          
          <button
            onClick={() => setActiveSourceId('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSourceId === 'all'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-md'
                : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Todas las Webs ({inovaProducts.length})
          </button>

          {webSources.map(source => {
            const count = inovaProducts.filter(p => p.sourceId === source.id).length;
            const inShop = inovaProducts.filter(p => p.sourceId === source.id && p.selected).length;
            const isActive = activeSourceId === source.id;

            return (
              <div key={source.id} className="flex items-center shrink-0">
                <button
                  onClick={() => setActiveSourceId(source.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white glow-indigo shadow-md'
                      : 'bg-[#121624] text-slate-300 hover:text-white border border-white/5'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{source.name}</span>
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono font-bold text-cyan-300">
                    {count} ({inShop} en tienda)
                  </span>
                </button>
                {source.id !== 'source-inova' && (
                  <button
                    onClick={() => handleDeleteWebSource(source.id)}
                    className="p-1.5 ml-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title={`Desconectar ${source.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {activeSourceObj && (
          <div className="flex items-center gap-3 text-xs text-slate-300 bg-[#0A0D18] px-4 py-2 rounded-2xl border border-white/5">
            <span className="text-slate-400">URL Conectada:</span>
            <a
              href={activeSourceObj.url}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline font-mono font-bold flex items-center gap-1"
            >
              {activeSourceObj.url} <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="bg-[#121624] text-fuchsia-400 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
              {activeSourceObj.platform}
            </span>
          </div>
        )}
      </div>

      {/* Sync Status Alert */}
      {syncStatusMsg && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 p-4 rounded-2xl text-cyan-200 text-sm font-bold flex items-center gap-3 shadow-2xl animate-fadeIn">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Configuration & Controls Bar */}
      <div className="glass-card p-6 rounded-[2rem] border border-white/10 flex flex-col lg:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Global Markup Control */}
          <div className="bg-[#121624] border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl text-white">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Recargo por Defecto</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={globalMarkup}
                  onChange={e => setGlobalMarkup(Number(e.target.value))}
                  className="w-20 bg-[#090B10] border border-white/10 text-cyan-300 font-black px-3 py-1.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 text-center"
                />
                <span className="text-xs font-black text-cyan-400">% sobre costo proveedor</span>
              </div>
            </div>
          </div>

          {/* Auto-Sync Interval Selector */}
          <div className="bg-[#121624] border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-fuchsia-500 to-pink-600 rounded-xl text-white">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <BellRing className="w-3 h-3 text-fuchsia-400 animate-pulse" /> Auto-Sincronización Precios
              </label>
              <select
                value={autoSyncInterval}
                onChange={e => setAutoSyncInterval(e.target.value)}
                className="mt-1 bg-[#090B10] border border-fuchsia-500/40 text-fuchsia-300 font-black px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-fuchsia-500 cursor-pointer"
              >
                <option value="Desactivado">Desactivado (Manual)</option>
                <option value="Cada 1 hora">Cada 1 hora</option>
                <option value="Cada 6 horas">Cada 6 horas</option>
                <option value="Cada 12 horas">Cada 12 horas</option>
                <option value="Diario">Diario (Cada 24 hs)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowCategoryConfigModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#121624] hover:bg-[#1C2338] border border-white/10 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-cyan-400" /> Recargos por Categoría
          </button>
        </div>

        {/* View mode toggle & Selection */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <div className="bg-[#121624] p-1.5 rounded-2xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                viewMode === 'table' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Lista Tabla
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cuadrícula
            </button>
          </div>

          <button
            onClick={() => handleSelectAll(true)}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-cyan-400" /> Todos
          </button>
          <button
            onClick={() => handleSelectAll(false)}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
          >
            <Square className="w-4 h-4 text-slate-400" /> Ninguno
          </button>
        </div>
      </div>

      {/* FILTER TABS: E-COMMERCE PUBLICATION STATUS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <span>Todos los Artículos ({sourceFilteredProducts.length})</span>
        </button>
        <button
          onClick={() => setStatusFilter('published')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'published'
              ? 'bg-emerald-600 text-white glow-emerald shadow-md'
              : 'bg-[#121624] text-emerald-400 hover:text-white border border-emerald-500/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>✓ En Mi Tienda E-Commerce ({selectedCount})</span>
        </button>
        <button
          onClick={() => setStatusFilter('hidden')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'hidden'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-[#121624] text-slate-400 hover:text-white border border-white/5'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          <span>Ocultos en Tienda ({hiddenCount})</span>
        </button>
        <button
          onClick={() => setStatusFilter('priceChanged')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'priceChanged'
              ? 'bg-rose-600 text-white glow-rose shadow-md'
              : 'bg-[#121624] text-rose-400 hover:text-white border border-rose-500/20'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Cambio de Costo ({changedCount})</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o web..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#121624] border border-white/10 text-white pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium focus:outline-none focus:border-cyan-500 shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white glow-cyan shadow-lg'
                  : 'bg-[#121624] text-slate-400 hover:bg-white/5 border border-white/10'
              }`}
            >
              {cat} {cat !== 'Todos' && `(${categoryMarkups[cat] ?? globalMarkup}%)`}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="glass-card rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#121624]/90 border-b border-white/10 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-20">En Tienda</th>
                  <th className="py-4 px-6">Foto & SKU</th>
                  <th className="py-4 px-6">Producto / Web Origen</th>
                  <th className="py-4 px-6 text-right">Costo Web</th>
                  <th className="py-4 px-6 text-center">Recargo (%)</th>
                  <th className="py-4 px-6 text-right">Precio Venta E-Commerce</th>
                  <th className="py-4 px-6 text-center">Stock</th>
                  <th className="py-4 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-medium">
                {filteredProducts.map(item => {
                  const itemMarkup = getProductMarkup(item);
                  const sellingPrice = Math.round(item.costARS * (1 + itemMarkup / 100));

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/5 transition duration-200 ${
                        item.selected ? 'bg-cyan-950/15' : 'opacity-70'
                      }`}
                    >
                      <td className="py-4 px-6 text-center">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-5 h-5 rounded-lg accent-cyan-500 cursor-pointer shadow-lg"
                          title={item.selected ? "Activado en Tienda E-Commerce" : "Oculto en Tienda"}
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div 
                            onClick={() => handleOpenEditModal(item)}
                            className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 bg-[#0A0D18] shrink-0 relative group cursor-pointer shadow-md"
                            title="Haz clic para cambiar imagen o editar"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://inovaarg.com/wp-content/uploads/2026/09/WhatsApp-Image-2026-09-30-at-9.25.36-AM-2.webp';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                              <Camera className="w-5 h-5 text-cyan-300" />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-cyan-300 font-bold block">{item.sku}</span>
                              {item.isAutoSku && (
                                <span className="bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold" title="SKU generado automáticamente">
                                  AUTO
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline mt-0.5 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Editar foto
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-black text-white">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-white/5 text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {item.category}
                            </span>
                            <span className="bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                              {item.sourceName}
                            </span>
                            {item.selected ? (
                              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                                En E-Commerce
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                                Oculto
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-black text-rose-400">
                        ${item.costARS.toLocaleString()} ARS
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center gap-1 bg-[#121624] px-2.5 py-1 rounded-xl border border-white/10">
                          <input
                            type="number"
                            value={itemMarkup}
                            onChange={e => handleUpdateProductMarkup(item.id, Number(e.target.value))}
                            className="w-14 bg-transparent text-cyan-300 font-black text-xs text-center focus:outline-none"
                          />
                          <span className="text-xs text-cyan-400">%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-black text-cyan-400 text-base">
                        ${sellingPrice.toLocaleString()} ARS
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-[#121624] text-slate-200 px-3 py-1 rounded-xl text-xs font-bold border border-white/5">
                          {item.stock} un.
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenCloneModal(item)}
                            className="p-2 bg-[#121624] hover:bg-[#1C2338] border border-fuchsia-500/30 rounded-xl text-fuchsia-300 hover:text-white transition cursor-pointer"
                            title="Copiar o duplicar este producto a otra web o SKU"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 bg-[#121624] hover:bg-[#1C2338] border border-white/10 rounded-xl text-slate-300 hover:text-cyan-400 transition cursor-pointer"
                            title="Editar datos o cambiar imagen"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteArticle(item)}
                            className="p-2 bg-[#121624] hover:bg-rose-950/60 border border-rose-500/30 rounded-xl text-rose-400 hover:text-rose-200 transition cursor-pointer"
                            title="Borrar artículo del catálogo e inventario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleSelect(item.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                              item.selected
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {item.selected ? '✓ En Tienda' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(item => {
            const itemMarkup = getProductMarkup(item);
            const sellingPrice = Math.round(item.costARS * (1 + itemMarkup / 100));
            const profitARS = sellingPrice - item.costARS;

            return (
              <div
                key={item.id}
                className={`glass-card rounded-[2rem] p-6 border transition-all duration-300 flex flex-col justify-between space-y-4 relative group ${
                  item.selected ? 'border-cyan-500/60 glow-cyan bg-cyan-950/10' : 'border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#121624] text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="bg-violet-950/80 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full text-[9px] font-bold">
                        {item.sourceName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenCloneModal(item)}
                        className="p-1.5 bg-[#121624] border border-fuchsia-500/30 rounded-lg text-fuchsia-300 hover:text-white transition cursor-pointer"
                        title="Copiar / Duplicar producto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 bg-[#121624] border border-white/10 rounded-lg text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                        title="Editar foto y datos"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(item)}
                        className="p-1.5 bg-[#121624] border border-rose-500/30 rounded-lg text-rose-400 hover:text-rose-200 transition cursor-pointer"
                        title="Borrar artículo del inventario y tienda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="w-5 h-5 rounded accent-cyan-500 cursor-pointer"
                        title="Mostrar en Tienda E-Commerce"
                      />
                    </div>
                  </div>

                  {/* Photo container */}
                  <div 
                    onClick={() => handleOpenEditModal(item)}
                    className="w-full h-44 rounded-2xl overflow-hidden border border-white/10 bg-[#0A0D18] relative group/img cursor-pointer"
                    title="Haz clic para cambiar imagen o editar"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://inovaarg.com/wp-content/uploads/2026/09/WhatsApp-Image-2026-09-30-at-9.25.36-AM-2.webp';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                      <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                        <Camera className="w-4 h-4" /> Cambiar foto
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white font-black text-sm leading-tight line-clamp-2">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">SKU: {item.sku}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Costo Web:</span>
                    <span className="font-mono font-bold text-rose-400">${item.costARS.toLocaleString()} ARS</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Recargo:</span>
                    <div className="flex items-center gap-1 bg-[#121624] px-2 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="number"
                        value={itemMarkup}
                        onChange={e => handleUpdateProductMarkup(item.id, Number(e.target.value))}
                        className="w-12 bg-transparent text-cyan-300 font-black text-xs text-center focus:outline-none"
                      />
                      <span className="text-[10px] text-cyan-400">%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-white/5">
                    <span className="text-slate-300">Precio Venta:</span>
                    <span className="font-mono text-cyan-400 text-base">${sellingPrice.toLocaleString()} ARS</span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-emerald-400 font-bold">
                    <span>Ganancia Neta:</span>
                    <span className="font-mono">+${profitARS.toLocaleString()} ARS</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => handleToggleSelect(item.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                        item.selected
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {item.selected ? '✓ En Tienda' : 'Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CONECTAR NUEVA WEB PROVEEDORA */}
      {showAddWebModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-xl w-full p-8 text-white relative shadow-2xl border border-fuchsia-500/30 glow-magenta max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddWebModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-fuchsia-600/20 rounded-2xl border border-fuchsia-500/40 text-fuchsia-400">
                <Globe className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black">Conectar Nueva Web Proveedora</h3>
                <p className="text-xs text-slate-400">Agrega otra tienda o distribuidora para copiar y sincronizar sus artículos.</p>
              </div>
            </div>

            {/* Presets buttons */}
            <div className="mb-6 p-4 bg-[#121624] rounded-2xl border border-white/10 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Sugerencias de Webs Mayoristas Listas:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_WEBS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPresetWeb(preset)}
                    className="px-3 py-1.5 bg-[#090B10] hover:bg-fuchsia-950/60 border border-fuchsia-500/30 text-fuchsia-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddNewWebSource} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Nombre de la Web / Proveedor
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Distribuidora Central Mayorista"
                  value={newWebName}
                  onChange={e => setNewWebName(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  URL del Sitio Web
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://distribuidoracentral.com.ar/"
                  value={newWebUrl}
                  onChange={e => setNewWebUrl(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Plataforma
                  </label>
                  <select
                    value={newWebPlatform}
                    onChange={e => setNewWebPlatform(e.target.value as any)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                  >
                    <option value="WooCommerce">WooCommerce</option>
                    <option value="Shopify">Shopify</option>
                    <option value="Tiendanube">Tiendanube</option>
                    <option value="Catálogo Web">Catálogo Web / API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Prefijo SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: CEN"
                    value={newWebPrefix}
                    onChange={e => setNewWebPrefix(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono uppercase focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Recargo (%)
                  </label>
                  <input
                    type="number"
                    value={newWebMarkup}
                    onChange={e => setNewWebMarkup(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notas / Descripción
                </label>
                <input
                  type="text"
                  placeholder="Ej: Artículos de bazar y tecnología con entrega inmediata"
                  value={newWebNotes}
                  onChange={e => setNewWebNotes(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="bg-[#121624] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="seedSample"
                  checked={newWebSeedSample}
                  onChange={e => setNewWebSeedSample(e.target.checked)}
                  className="w-4 h-4 rounded accent-fuchsia-500 cursor-pointer"
                />
                <label htmlFor="seedSample" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Cargar artículos iniciales de muestra para esta web
                </label>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddWebModal(false)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white text-xs font-black uppercase tracking-wider glow-magenta transition shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Conectar y Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COPIAR / IMPORTAR DESDE URL DE CUALQUIER WEB */}
      {showImportUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-xl w-full p-8 text-white relative shadow-2xl border border-violet-500/40 glow-indigo max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowImportUrlModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-violet-600/20 rounded-2xl border border-violet-500/40 text-violet-400">
                <Link className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black">Tomar y Copiar Producto desde URL</h3>
                <p className="text-xs text-slate-400">Pega el link de la web o producto para copiar sus datos al instante.</p>
              </div>
            </div>

            <form onSubmit={handleSaveImportUrlProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Web Proveedora Destino
                </label>
                <select
                  value={importSourceId}
                  onChange={e => setImportSourceId(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  {webSources.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Link / URL del Producto en la Web
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    placeholder="https://inovaarg.com/producto/soporte-o-articulo"
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    className="flex-1 bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    onClick={handleExtractFromUrl}
                    disabled={isExtractingUrl}
                    className="px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" /> Extraer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Título del Producto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Termo Acero Inoxidable 1L Con Manija"
                  value={importTitle}
                  onChange={e => setImportTitle(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between">
                    <span>SKU</span>
                    <button
                      type="button"
                      onClick={() => {
                        const s = webSources.find(x => x.id === importSourceId) || webSources[0];
                        setImportSku(generateInternalSku(s.skuPrefix, importTitle, importCategory, Date.now()));
                      }}
                      className="text-[10px] text-violet-400 hover:underline"
                    >
                      Auto
                    </button>
                  </label>
                  <input
                    type="text"
                    placeholder="Dejar vacío para AUTO"
                    value={importSku}
                    onChange={e => setImportSku(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Bazar"
                    value={importCategory}
                    onChange={e => setImportCategory(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Costo Web ($ ARS)
                  </label>
                  <input
                    type="number"
                    required
                    value={importCostARS}
                    onChange={e => setImportCostARS(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Image Input & Upload */}
              <div className="bg-[#0A0D18] p-4 rounded-2xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Foto del Producto
                </label>
                <div className="flex gap-3 items-center">
                  {importImageUrl && (
                    <img 
                      src={importImageUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0" 
                    />
                  )}
                  <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#121624] hover:bg-[#1C2338] border border-violet-500/40 rounded-xl text-xs font-bold text-violet-300 cursor-pointer transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Subir Foto...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, 'import')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    placeholder="O pegar URL directa de la imagen"
                    value={importImageUrl}
                    onChange={e => setImportImageUrl(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="bg-[#121624] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="importPublishNow"
                  checked={importPublishNow}
                  onChange={e => setImportPublishNow(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
                />
                <label htmlFor="importPublishNow" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Publicar inmediatamente en mi Tienda E-Commerce y ERP
                </label>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportUrlModal(false)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-xs font-black uppercase tracking-wider glow-indigo transition shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Tomar y Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DUPLICAR / CLONAR PRODUCTO EXISTENTE */}
      {copyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-xl w-full p-8 text-white relative shadow-2xl border border-fuchsia-500/40 glow-magenta max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCopyingProduct(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-fuchsia-600/20 rounded-2xl border border-fuchsia-500/40 text-fuchsia-400">
                <Copy className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black">Copiar / Clonar Producto</h3>
                <p className="text-xs text-slate-400">Duplica este artículo para asignarlo a otra web o crear una variante.</p>
              </div>
            </div>

            <form onSubmit={handleSaveCloneProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Web Proveedora Destino
                </label>
                <select
                  value={cloneTargetSourceId}
                  onChange={e => setCloneTargetSourceId(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-fuchsia-500 cursor-pointer"
                >
                  {webSources.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Título del Producto
                </label>
                <input
                  type="text"
                  required
                  value={cloneTitle}
                  onChange={e => setCloneTitle(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between">
                    <span>Nuevo SKU</span>
                    <button
                      type="button"
                      onClick={() => {
                        const s = webSources.find(x => x.id === cloneTargetSourceId) || webSources[0];
                        setCloneSku(generateInternalSku(s.skuPrefix, cloneTitle, cloneCategory, Date.now()));
                      }}
                      className="text-[10px] text-fuchsia-400 hover:underline"
                    >
                      Auto
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneSku}
                    onChange={e => setCloneSku(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    value={cloneCategory}
                    onChange={e => setCloneCategory(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Costo Web ($ ARS)
                  </label>
                  <input
                    type="number"
                    required
                    value={cloneCostARS}
                    onChange={e => setCloneCostARS(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              {/* Photo preview and upload */}
              <div className="bg-[#0A0D18] p-4 rounded-2xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Foto Copiada
                </label>
                <div className="flex gap-3 items-center">
                  {cloneImageUrl && (
                    <img 
                      src={cloneImageUrl} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0" 
                    />
                  )}
                  <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#121624] hover:bg-[#1C2338] border border-fuchsia-500/40 rounded-xl text-xs font-bold text-fuchsia-300 cursor-pointer transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Cambiar Foto...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, 'clone')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    placeholder="URL de la imagen"
                    value={cloneImageUrl}
                    onChange={e => setCloneImageUrl(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              <div className="bg-[#121624] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="clonePublishNow"
                  checked={clonePublishNow}
                  onChange={e => setClonePublishNow(e.target.checked)}
                  className="w-4 h-4 rounded accent-fuchsia-500 cursor-pointer"
                />
                <label htmlFor="clonePublishNow" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Publicar copia inmediatamente en mi Tienda E-Commerce y ERP
                </label>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCopyingProduct(null)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 hover:from-fuchsia-700 hover:to-rose-700 text-white text-xs font-black uppercase tracking-wider glow-magenta transition shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Guardar Producto Copiado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR ARTICULO A LA WEB SELECCIONADA */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-xl w-full p-8 text-white relative shadow-2xl border border-cyan-500/30 glow-cyan max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-600/20 rounded-2xl border border-cyan-500/40 text-cyan-400">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">Agregar Artículo a Web Proveedora</h3>
                <p className="text-xs text-slate-400">Incorpora un producto a copiar desde una web mayorista conectada.</p>
              </div>
            </div>

            <form onSubmit={handleAddNewProductToWeb} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Web de Origen
                </label>
                <select
                  value={newProdSourceId}
                  onChange={e => setNewProdSourceId(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {webSources.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.url})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Título del Producto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Lámpara de Noche LED USB Minimalista"
                  value={newProdTitle}
                  onChange={e => setNewProdTitle(e.target.value)}
                  className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    SKU (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Dejar vacío para AUTO"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Iluminación"
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Costo Web ($ ARS)
                  </label>
                  <input
                    type="number"
                    required
                    value={newProdCostARS}
                    onChange={e => setNewProdCostARS(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-3 py-3 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Image Input & Upload */}
              <div className="bg-[#0A0D18] p-4 rounded-2xl border border-white/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Foto del Producto
                </label>
                <div className="flex gap-3 items-center">
                  <label className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#121624] hover:bg-[#1C2338] border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 cursor-pointer transition shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Subir de PC...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, 'new')}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    placeholder="O pegar URL directa de la imagen"
                    value={newProdImageUrl}
                    onChange={e => setNewProdImageUrl(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="bg-[#121624] p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="newProdPublishNow"
                  checked={newProdPublishNow}
                  onChange={e => setNewProdPublishNow(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                />
                <label htmlFor="newProdPublishNow" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Mostrar en mi Tienda E-Commerce y ERP inmediatamente
                </label>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider glow-cyan transition shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Agregar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT & CHANGE IMAGE MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-xl w-full p-8 text-white relative shadow-2xl border border-white/20 glow-cyan max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-600/20 rounded-2xl border border-cyan-500/40 text-cyan-400">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">Editar Imagen y Datos</h3>
                <p className="text-xs text-slate-400">Modifica foto oficial, SKU o costo para {editingProduct.sourceName}.</p>
              </div>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-5">
              {/* Image Preview & Upload Box */}
              <div className="bg-[#0A0D18] p-5 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-[#121624] shrink-0 relative shadow-inner">
                  {editImageUrl ? (
                    <img
                      src={editImageUrl}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://inovaarg.com/wp-content/uploads/2026/09/WhatsApp-Image-2026-09-30-at-9.25.36-AM-2.webp';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      Sin imagen
                    </div>
                  )}
                </div>

                <div className="space-y-3 flex-1 w-full">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Subir Imagen desde tu PC o Celular
                    </label>
                    <label className="flex items-center justify-center gap-2 w-full py-3 bg-[#121624] hover:bg-[#1C2338] border border-cyan-500/40 hover:border-cyan-400 rounded-2xl text-xs font-black text-cyan-300 cursor-pointer transition shadow-md">
                      <Upload className="w-4 h-4" />
                      <span>Elegir archivo de imagen...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageFileUpload(e, 'edit')}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      O pegar URL directa de la imagen
                    </label>
                    <input
                      type="url"
                      value={editImageUrl}
                      onChange={e => setEditImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/foto-producto.webp"
                      className="w-full bg-[#121624] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Title & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Título del Producto
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>SKU</span>
                    <button
                      type="button"
                      onClick={() => {
                        const src = webSources.find(s => s.id === editingProduct.sourceId);
                        setEditSku(generateInternalSku(src?.skuPrefix || 'INV', editTitle, editCategory, editingProduct.id));
                      }}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Generar código SKU automáticamente"
                    >
                      <Hash className="w-3 h-3" /> Auto
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={e => setEditSku(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Category, Cost & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Costo Web ($ ARS)
                  </label>
                  <input
                    type="number"
                    required
                    value={editCostARS}
                    onChange={e => setEditCostARS(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Stock Disponible
                  </label>
                  <input
                    type="number"
                    required
                    value={editStock}
                    onChange={e => setEditStock(Number(e.target.value))}
                    className="w-full bg-[#121624] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider glow-cyan transition shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Markup Configuration Modal */}
      {showCategoryConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="glass-card rounded-[2.5rem] max-w-lg w-full p-8 text-white relative shadow-2xl border border-white/20 glow-cyan">
            <button
              onClick={() => setShowCategoryConfigModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/10 p-2.5 rounded-full cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-cyan-600/20 rounded-2xl border border-cyan-500/40 text-cyan-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black">Recargos por Categoría</h3>
                <p className="text-xs text-slate-400">Define el porcentaje de recargo automático para cada categoría.</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {Object.keys(categoryMarkups).map(cat => (
                <div key={cat} className="flex items-center justify-between bg-[#121624] p-4 rounded-2xl border border-white/10">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-cyan-400" /> {cat}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={categoryMarkups[cat]}
                      onChange={e =>
                        setCategoryMarkups({
                          ...categoryMarkups,
                          [cat]: Number(e.target.value),
                        })
                      }
                      className="w-24 bg-[#090B10] border border-cyan-500/40 text-cyan-300 font-black px-3 py-2 rounded-xl text-sm text-center focus:outline-none"
                    />
                    <span className="text-xs font-bold text-cyan-400">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowCategoryConfigModal(false)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-xs font-black uppercase tracking-wider glow-cyan transition shadow-xl cursor-pointer"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GANANCIA TOTAL MASIVA */}
      {showBulkProfitModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-8 overflow-y-auto">
          <div className="glass-card rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 text-white relative shadow-2xl border border-cyan-500/40 glow-cyan my-6 animate-scaleUp">
            
            <button
              onClick={() => setShowBulkProfitModal(false)}
              className="absolute top-6 right-6 text-slate-300 hover:text-white bg-white/10 hover:bg-rose-600/30 p-3 rounded-full transition shadow-lg z-20 cursor-pointer"
              title="Cerrar Ventana"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-6 pr-12">
              <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center glow-cyan shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">
                  Ganancia Total Masiva sobre Costo
                </h3>
                <p className="text-xs text-slate-300 font-medium">
                  Define el margen porcentual (%) o monto fijo ($ ARS) para sumar al costo mayorista de los artículos de tus webs conectadas.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                  Tipo de Ganancia a Sumar al Costo:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkProfitConfig(prev => ({ ...prev, type: 'percent' }))}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      bulkProfitConfig.type === 'percent'
                        ? 'bg-gradient-to-br from-cyan-950 to-blue-900 border-cyan-400 text-white shadow-lg glow-cyan'
                        : 'bg-[#121624] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">Porcentaje (%)</span>
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-[11px] text-slate-300">Margen % sobre costo (ej. +50%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkProfitConfig(prev => ({ ...prev, type: 'fixed' }))}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      bulkProfitConfig.type === 'fixed'
                        ? 'bg-gradient-to-br from-emerald-950 to-teal-900 border-emerald-400 text-white shadow-lg glow-cyan'
                        : 'bg-[#121624] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">Monto Fijo ($ ARS)</span>
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[11px] text-slate-300">Pesos fijos por artículo (ej. +$5.000)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkProfitConfig(prev => ({ ...prev, type: 'mixed' }))}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      bulkProfitConfig.type === 'mixed'
                        ? 'bg-gradient-to-br from-violet-950 to-indigo-900 border-violet-400 text-white shadow-lg glow-cyan'
                        : 'bg-[#121624] border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase">Mixto (% + $)</span>
                      <Zap className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-[11px] text-slate-300">% de margen + monto fijo en pesos</span>
                  </button>
                </div>
              </div>

              {/* Value Inputs based on Type */}
              <div className="bg-[#121624] p-5 rounded-3xl border border-white/10 space-y-4">
                {(bulkProfitConfig.type === 'percent' || bulkProfitConfig.type === 'mixed') && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" /> Margen Porcentual (% sobre costo)
                      </label>
                      <span className="text-lg font-black font-mono text-cyan-300">+{bulkProfitConfig.percentValue}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={bulkProfitConfig.percentValue}
                      onChange={e => setBulkProfitConfig(prev => ({ ...prev, percentValue: Number(e.target.value) }))}
                      className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                      {[30, 40, 50, 60, 75, 100].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBulkProfitConfig(prev => ({ ...prev, percentValue: val }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            bulkProfitConfig.percentValue === val
                              ? 'bg-cyan-500 text-black shadow-md'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          +{val}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(bulkProfitConfig.type === 'fixed' || bulkProfitConfig.type === 'mixed') && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" /> Ganancia Fija en Pesos ($ ARS por unidad)
                      </label>
                      <span className="text-lg font-black font-mono text-emerald-300">
                        +${(bulkProfitConfig.fixedValueARS || 0).toLocaleString('es-AR')} ARS
                      </span>
                    </div>
                    <div className="relative mb-3">
                      <span className="absolute left-4 top-3 text-emerald-400 font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={bulkProfitConfig.fixedValueARS}
                        onChange={e => setBulkProfitConfig(prev => ({ ...prev, fixedValueARS: Math.max(0, Number(e.target.value) || 0) }))}
                        className="w-full bg-[#07090E] border border-emerald-500/40 text-emerald-300 pl-9 pr-4 py-2.5 rounded-xl text-base font-mono font-black focus:outline-none focus:border-emerald-400"
                        placeholder="Ej. 5000"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[2000, 3500, 5000, 8000, 10000, 15000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBulkProfitConfig(prev => ({ ...prev, fixedValueARS: val }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                            bulkProfitConfig.fixedValueARS === val
                              ? 'bg-emerald-500 text-black shadow-md'
                              : 'bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          +${val.toLocaleString('es-AR')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Scope & Rounding */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Alcance (A qué artículos aplicar):
                  </label>
                  <select
                    value={bulkProfitConfig.targetScope}
                    onChange={e => setBulkProfitConfig(prev => ({ ...prev, targetScope: e.target.value as any }))}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">
                      Todos los artículos ({activeSourceId === 'all' ? 'Todas las webs' : activeSourceObj?.name})
                    </option>
                    <option value="selected">Solo los seleccionados para la tienda ({selectedCount} artículos)</option>
                    <option value="category">Filtrar por una Categoría específica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Redondeo Comercial ($ ARS):
                  </label>
                  <select
                    value={bulkProfitConfig.rounding}
                    onChange={e => setBulkProfitConfig(prev => ({ ...prev, rounding: e.target.value as any }))}
                    className="w-full bg-[#121624] border border-white/10 text-white px-4 py-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="none">Exacto (sin redondeo)</option>
                    <option value="10">Redondear a decenas ($10)</option>
                    <option value="100">Redondear a centenas ($100 ej. $14.500)</option>
                    <option value="1000">Redondear a millares ($1.000 ej. $15.000)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-[#07090E] p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Previsualización con artículos del catálogo:
                </span>
                <div className="space-y-2 text-xs">
                  {sourceFilteredProducts.slice(0, 3).map(p => {
                    const calc = calculatePriceWithProfit(p.costARS, bulkProfitConfig);
                    return (
                      <div key={p.id} className="p-3 bg-[#121624] rounded-xl flex flex-wrap items-center justify-between gap-2 border border-white/5">
                        <span className="font-bold text-white max-w-[220px] truncate">{cleanProductTitle(p.title)}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-slate-400">Costo: <strong className="text-rose-400">${p.costARS.toLocaleString()}</strong></span>
                          <span className="text-emerald-400 font-bold">+ Ganancia: ${calc.profitARS.toLocaleString('es-AR')}</span>
                          <span className="text-white font-black bg-emerald-950 px-2 py-1 rounded-lg border border-emerald-500/40">
                            Venta: ${calc.finalPriceARS.toLocaleString('es-AR')} ARS (+{calc.effectiveMarginPercent}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkProfitModal(false)}
                  disabled={isSyncing}
                  className="w-1/3 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkProfitToCatalog}
                  disabled={isSyncing}
                  className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-xs font-black uppercase tracking-wider glow-cyan shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Aplicando Ganancia Masiva...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                      Aplicar Ganancia a Artículos
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
