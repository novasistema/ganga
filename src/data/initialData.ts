import { Product, CompanySettings } from '../types';

export const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'GangaStore Dropshipping',
  email: 'contacto@gangastore.com',
  phone: '+54 9 11 4055-7890',
  whatsappNumber: '5491140557890',
  address: 'Av. Santa Fe 3200, CABA, Argentina',
  logoUrl: '',
  defaultProfitMargin: 40,
  currencySymbol: '$',
  bankName: 'Banco Santander / Galicia',
  bankCbuAlias: 'GANGA.DROP.PAGOS',
  bankAccountHolder: 'Bruzzone Distribuidora SRL',
  bankCuit: '30-71894215-4',
  gatewayEnabled: true,
  freeShippingThreshold: 35000,
  announcementText: '🔥 OFERTAS DE TEMPORADA: Envío GRATIS en compras superiores a $35.000 • 3 Cuotas sin interés • 10% OFF por Transferencia',
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  mercadoPagoAliasCvu: 'DISTRIBUIDORA.BRUZZONE.MP',
  mercadoPagoNotificationWebhookUrl: '',
  updatedAt: new Date().toISOString()
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-seed-1',
    title: 'Smartwatch Pro Ultra Serie 9 Pantalla AMOLED 2.02"',
    description: 'Reloj inteligente de última tecnología con caja de titanio aeroespacial, monitor de ritmo cardíaco, oxímetro, GPS integrado, llamadas bluetooth y resistencia al agua IP68.',
    originalPrice: 22000,
    markupPercentage: 45,
    finalPrice: 31900,
    category: 'Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 28,
    supplierUrl: 'https://es.aliexpress.com/item/smartwatch-ultra',
    inStock: true,
    featured: true,
    rating: 4.9,
    reviewsCount: 142,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-2',
    title: 'Auriculares Inalámbricos Noise Cancelling Pro ANC Bass',
    description: 'Cancelación activa de ruido inteligente con 4 micrófonos, sonido espacial 360°, estuche de carga rápida con hasta 38 horas de batería total y modo transparencia.',
    originalPrice: 19500,
    markupPercentage: 40,
    finalPrice: 27300,
    category: 'Audio & Sonido',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 45,
    supplierUrl: 'https://es.aliexpress.com/item/anc-headphones',
    inStock: true,
    featured: true,
    rating: 4.8,
    reviewsCount: 89,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-3',
    title: 'Mochila Urbana Antirrobo Impermeable con Conector USB',
    description: 'Diseño elegante y seguro con cierre principal oculto en la espalda, tejido oxford reforzado repelente al agua, puerto USB externo para cargar celular y bolsillo para notebook de 15.6".',
    originalPrice: 14000,
    markupPercentage: 50,
    finalPrice: 21000,
    category: 'Moda & Accesorios',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 32,
    supplierUrl: 'https://es.aliexpress.com/item/anti-theft-backpack',
    inStock: true,
    featured: true,
    rating: 4.7,
    reviewsCount: 64,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-4',
    title: 'Mini Proyector Portátil HD WiFi Cinema 1080p',
    description: 'Transforma cualquier pared en una sala de cine de hasta 130 pulgadas. Altavoces estéreo incorporados, conexión HDMI y WiFi directo para streaming desde tu celular o computadora.',
    originalPrice: 42000,
    markupPercentage: 40,
    finalPrice: 58800,
    category: 'Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 14,
    supplierUrl: 'https://es.aliexpress.com/item/mini-projector-hd',
    inStock: true,
    featured: true,
    rating: 4.9,
    reviewsCount: 115,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-5',
    title: 'Lámpara de Noche LED Táctil con Cargador Inalámbrico Qi',
    description: 'Iluminación moderna con regulación táctil de intensidad y 3 tonos de luz (cálida, neutra y fría). Brazo flexible y plataforma con carga inalámbrica rápida para smartphones.',
    originalPrice: 11000,
    markupPercentage: 45,
    finalPrice: 15950,
    category: 'Hogar & Confort',
    imageUrl: 'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 20,
    supplierUrl: 'https://es.aliexpress.com/item/wireless-charging-lamp',
    inStock: true,
    featured: false,
    rating: 4.6,
    reviewsCount: 42,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-6',
    title: 'Cámara de Seguridad Doméstica 360° WiFi HD Visión Nocturna',
    description: 'Cámara giratoria motorizada con sensor de movimiento, detección humana inteligente por IA, audio bidireccional y control total desde la aplicación en tu celular.',
    originalPrice: 16500,
    markupPercentage: 35,
    finalPrice: 22275,
    category: 'Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 19,
    supplierUrl: 'https://es.aliexpress.com/item/ip-camera-360',
    inStock: true,
    featured: false,
    rating: 4.8,
    reviewsCount: 78,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-7',
    title: 'Pistola Masajeadora Muscular de Percusión Fascial Pro',
    description: 'Alivia tensiones y acelera la recuperación física con 6 cabezales intercambiables y 30 velocidades ajustables. Motor silencioso brushless de alto torque y display LCD táctil.',
    originalPrice: 23000,
    markupPercentage: 40,
    finalPrice: 32200,
    category: 'Fitness & Salud',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 16,
    supplierUrl: 'https://es.aliexpress.com/item/massage-gun-pro',
    inStock: true,
    featured: true,
    rating: 4.9,
    reviewsCount: 96,
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-seed-8',
    title: 'Aspiradora Portátil Inalámbrica Potente para Auto y Hogar',
    description: 'Succión ciclónica de alta potencia de 9000Pa con batería recargable USB-C. Incluye boquilla para rincones, cepillo para tapizados y filtro HEPA lavable reutilizable.',
    originalPrice: 13500,
    markupPercentage: 45,
    finalPrice: 19575,
    category: 'Hogar & Confort',
    imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
    galleryUrls: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80'
    ],
    stock: 25,
    supplierUrl: 'https://es.aliexpress.com/item/handheld-vacuum',
    inStock: true,
    featured: false,
    rating: 4.7,
    reviewsCount: 53,
    createdAt: new Date().toISOString()
  }
];
