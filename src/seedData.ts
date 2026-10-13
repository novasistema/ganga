import { db } from './firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { Product, Supplier, Order, Customer } from './types';

export const initialCustomers: Customer[] = [
  { id: 'cust-1', name: 'Carlos Benítez', company: 'TecnoSur S.R.L.', taxId: '30-71234567-9', email: 'carlos.benitez@tecnosur.com.ar', phone: '+54 11 4455-6677', address: 'Av. Corrientes 1234, CABA', priceTier: 'Mayorista', createdAt: new Date().toISOString() },
  { id: 'cust-2', name: 'Mariana Rivas', company: 'Industrias Rivas', taxId: '27-38910293-4', email: 'mrivas@industriasrivas.com.ar', phone: '+54 351 555-9898', address: 'Bv. San Juan 450, Córdoba', priceTier: 'Distribuidor', createdAt: new Date().toISOString() },
  { id: 'cust-3', name: 'Esteban Gomez', company: 'Gomez Electrónica', taxId: '20-29384756-1', email: 'esteban@gomezelectronica.com', phone: '+54 341 444-2233', address: 'Mitre 789, Rosario', priceTier: 'Minorista', createdAt: new Date().toISOString() }
];

export const initialSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Shenzhen TechGlobal Ltd.', country: 'China', contactPerson: 'Chen Wei', email: 'sales@techglobal.cn', phone: '+86 755 8899 0011', leadTimeDays: 35, activeShipments: 2 },
  { id: 'sup-2', name: 'Pacific Trading Co.', country: 'Taiwán', contactPerson: 'Lin Mei', email: 'lin.mei@pacifictrading.tw', phone: '+886 2 2345 6789', leadTimeDays: 42, activeShipments: 1 },
  { id: 'sup-3', name: 'Andes Logistics & Impex', country: 'Estados Unidos', contactPerson: 'Robert Smith', email: 'rsmith@andesimpex.us', phone: '+1 305 555 0143', leadTimeDays: 15, activeShipments: 3 }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Laser Engraver Pro 20W - CNC Cutter',
    sku: 'IMP-CNC-20W',
    category: 'Herramientas y CNC',
    costPriceUSD: 350,
    freightCostUSD: 45,
    importDutiesUSD: 70,
    exchangeRate: 1250,
    finalPriceARS: 650000,
    stock: 14,
    minStock: 3,
    supplier: 'Shenzhen TechGlobal Ltd.',
    containerBatch: 'CONT-2026-A4',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    description: 'Cortadora y grabadora láser de alta precisión de 20W con asistencia de aire y control offline. Ideal para madera, acrílico y metal.',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    title: 'Smartphone Ultra X12 512GB (Global Ver.)',
    sku: 'IMP-PH-X12',
    category: 'Tecnología',
    costPriceUSD: 480,
    freightCostUSD: 25,
    importDutiesUSD: 95,
    exchangeRate: 1250,
    finalPriceARS: 980000,
    stock: 28,
    minStock: 5,
    supplier: 'Pacific Trading Co.',
    containerBatch: 'CONT-2026-B1',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800',
    description: 'Smartphone de gama alta con pantalla AMOLED 120Hz, cámara de 108MP y carga rápida de 120W.',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    title: 'Panel Solar Monocristalino 500W Bifacial',
    sku: 'IMP-SOL-500',
    category: 'Energía Renovable',
    costPriceUSD: 190,
    freightCostUSD: 60,
    importDutiesUSD: 35,
    exchangeRate: 1250,
    finalPriceARS: 420000,
    stock: 45,
    minStock: 10,
    supplier: 'Andes Logistics & Impex',
    containerBatch: 'CONT-2026-A4',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-e835cfcd3f6b?auto=format&fit=crop&q=80&w=800',
    description: 'Panel solar de alta eficiencia con tecnología bifacial para generación por ambas caras. Certificación internacional.',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    title: 'Generador Solar Portátil 2000W LiFePO4',
    sku: 'IMP-GEN-2000',
    category: 'Energía Renovable',
    costPriceUSD: 850,
    freightCostUSD: 120,
    importDutiesUSD: 170,
    exchangeRate: 1250,
    finalPriceARS: 1650000,
    stock: 8,
    minStock: 2,
    supplier: 'Shenzhen TechGlobal Ltd.',
    containerBatch: 'CONT-2026-C2',
    imageUrl: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&q=80&w=800',
    description: 'Estación de energía portátil con batería de litio LiFePO4 de 2048Wh. Salidas AC puras y carga ultrarrápida.',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    title: 'Kit Cámaras de Seguridad 4K PoE 8 Canales',
    sku: 'IMP-CAM-4K',
    category: 'Seguridad',
    costPriceUSD: 290,
    freightCostUSD: 35,
    importDutiesUSD: 55,
    exchangeRate: 1250,
    finalPriceARS: 540000,
    stock: 19,
    minStock: 4,
    supplier: 'Pacific Trading Co.',
    containerBatch: 'CONT-2026-B1',
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800',
    description: 'Sistema de videovigilancia profesional IP 4K con visión nocturna a color, detección de movimiento por IA y disco duro de 2TB incluido.',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    title: 'Impresora 3D Industrial CoreXY 300x300',
    sku: 'IMP-3D-CORE',
    category: 'Herramientas y CNC',
    costPriceUSD: 620,
    freightCostUSD: 90,
    importDutiesUSD: 120,
    exchangeRate: 1250,
    finalPriceARS: 1190000,
    stock: 6,
    minStock: 2,
    supplier: 'Shenzhen TechGlobal Ltd.',
    containerBatch: 'CONT-2026-C2',
    imageUrl: 'https://images.unsplash.com/photo-1631541574716-613d508dd3a2?auto=format&fit=crop&q=80&w=800',
    description: 'Impresora 3D de alta velocidad tipo CoreXY con recinto cerrado, nivelación automática y extrusor directa de alta temperatura.',
    active: true,
    createdAt: new Date().toISOString()
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'PED-2026-001',
    customerName: 'Carlos Benítez',
    customerEmail: 'carlos.benitez@gmail.com',
    customerPhone: '+54 11 4455-6677',
    shippingAddress: 'Av. Corrientes 1234, CABA, Argentina',
    items: [
      { productId: 'prod-1', title: 'Laser Engraver Pro 20W - CNC Cutter', sku: 'IMP-CNC-20W', quantity: 1, price: 650000 }
    ],
    subtotal: 650000,
    shipping: 15000,
    total: 665000,
    status: 'En Preparación',
    paymentMethod: 'Mercado Pago',
    paymentId: 'MP-89234710',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'ord-102',
    orderNumber: 'PED-2026-002',
    customerName: 'Mariana Rivas',
    customerEmail: 'mrivas@industriasrivas.com.ar',
    customerPhone: '+54 351 555-9898',
    shippingAddress: 'Bv. San Juan 450, Córdoba, Argentina',
    items: [
      { productId: 'prod-3', title: 'Panel Solar Monocristalino 500W Bifacial', sku: 'IMP-SOL-500', quantity: 2, price: 420000 }
    ],
    subtotal: 840000,
    shipping: 25000,
    total: 865000,
    status: 'Listo para Despacho',
    paymentMethod: 'Transferencia Bancaria',
    paymentId: 'TR-448910',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export async function seedDatabaseIfEmpty() {
  try {
    const prodSnap = await getDocs(collection(db, 'products'));
    if (prodSnap.empty) {
      for (const prod of initialProducts) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
    }

    const custSnap = await getDocs(collection(db, 'customers'));
    if (custSnap.empty) {
      for (const cust of initialCustomers) {
        await setDoc(doc(db, 'customers', cust.id), cust);
      }
    }

    const supSnap = await getDocs(collection(db, 'suppliers'));
    if (supSnap.empty) {
      for (const sup of initialSuppliers) {
        await setDoc(doc(db, 'suppliers', sup.id), sup);
      }
    }

    const ordSnap = await getDocs(collection(db, 'orders'));
    if (ordSnap.empty) {
      for (const ord of initialOrders) {
        await setDoc(doc(db, 'orders', ord.id), ord);
      }
    }
  } catch (error) {
    console.warn("Notice during database seeding:", error);
  }
}
