import { Deal, Client, Order } from '../types';
import { ASSET_IMAGES } from '../utils/imageUtils';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-01',
    name: 'Carlos Benítez',
    businessName: 'Distribuidora Electro Centro',
    cuitOrDni: '30-71449821-4',
    phone: '+54 9 11 4982-1100',
    email: 'carlos@electrocentro.com.ar',
    city: 'Rosario',
    province: 'Santa Fe',
    tier: 'Mayorista Oro',
    totalSpent: 2840000,
    orderCount: 6,
    notes: 'Compra lotes de hornos Pioneer y caloventores cada 15 días. Paga por transferencia bancaria inmediata.',
    lastContact: '2026-10-12'
  },
  {
    id: 'cli-02',
    name: 'Mariana López',
    businessName: 'Bazar San Martín',
    cuitOrDni: '27-32115689-2',
    phone: '+54 9 351 689-4321',
    email: 'compras@bazarsanmartin.com',
    city: 'Córdoba Capital',
    province: 'Córdoba',
    tier: 'Mayorista Plata',
    totalSpent: 960000,
    orderCount: 3,
    notes: 'Interesada en pavas digitales y cafeteras espresso. Pide despacho por Expreso Morabito.',
    lastContact: '2026-10-10'
  },
  {
    id: 'cli-03',
    name: 'Esteban Domínguez',
    businessName: 'Ferretería El Obrero',
    cuitOrDni: '20-28994112-9',
    phone: '+54 9 223 544-9988',
    email: 'ferreteriaelobrero@gmail.com',
    city: 'Mar del Plata',
    province: 'Buenos Aires',
    tier: 'Distribuidor',
    totalSpent: 4250000,
    orderCount: 8,
    notes: 'Distribuidor zonal de herramientas Lusqtoff y Nuvoh 48V. Siempre consulta precio por 100 unidades.',
    lastContact: '2026-10-13'
  },
  {
    id: 'cli-04',
    name: 'Valeria Rivas',
    businessName: 'Espacio Deco & Hogar',
    cuitOrDni: '27-38445100-3',
    phone: '+54 9 261 412-3344',
    email: 'valeria@espaciodeco.ar',
    city: 'Mendoza',
    province: 'Mendoza',
    tier: 'Minorista',
    totalSpent: 380000,
    orderCount: 1,
    notes: 'Comenzó con pedido inicial de sillas Amalfi y mesa ratona Vittore. Posible reorden en Noviembre.',
    lastContact: '2026-10-08'
  }
];

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-01',
    customerName: 'Santiago Rossi',
    businessName: 'Electrohogar San Isidro',
    phone: '+54 9 11 6543-2199',
    email: 'santiago@electrohogar.com.ar',
    city: 'San Isidro, BA',
    stage: 'lead',
    items: [
      { productId: 'prod-coc-01', productName: 'HORNO ELÉCTRICO PIONEER HOME 50L', quantity: 5, unitPrice: 138000 },
      { productId: 'prod-coc-05', productName: 'PAVA DIGITAL CON NUVOH SELECTOR', quantity: 10, unitPrice: 48000 }
    ],
    totalAmount: 1170000,
    notes: 'Ingresó por formulario de tienda online consultando por stock de hornos Pioneer.',
    createdAt: '2026-10-13',
    updatedAt: '2026-10-13',
    assignedSalesperson: 'Agustín Novoa'
  },
  {
    id: 'deal-02',
    customerName: 'Mariana López',
    businessName: 'Bazar San Martín',
    phone: '+54 9 351 689-4321',
    email: 'compras@bazarsanmartin.com',
    city: 'Córdoba Capital',
    stage: 'contacted',
    items: [
      { productId: 'prod-coc-04', productName: 'CAFETERA EXPRESSO WINCO 20 BAR', quantity: 5, unitPrice: 151000 },
      { productId: 'prod-cui-03', productName: 'PISTOLA MASAJEADORA GADNIC', quantity: 10, unitPrice: 21500 }
    ],
    totalAmount: 970000,
    notes: 'Le enviamos mensaje por WhatsApp confirmando que superó el mínimo de $100.000 con surtido libre.',
    createdAt: '2026-10-11',
    updatedAt: '2026-10-12',
    assignedSalesperson: 'Agustín Novoa'
  },
  {
    id: 'deal-03',
    customerName: 'Carlos Benítez',
    businessName: 'Distribuidora Electro Centro',
    phone: '+54 9 11 4982-1100',
    email: 'carlos@electrocentro.com.ar',
    city: 'Rosario, SF',
    stage: 'quoted',
    items: [
      { productId: 'prod-her-01', productName: 'TALADRO NUVOH C/MALETÍN Y 50 ACCESORIOS', quantity: 10, unitPrice: 86000 },
      { productId: 'prod-her-02', productName: 'MINI MOTOSIERRA NUVOH 48V', quantity: 10, unitPrice: 43000 },
      { productId: 'prod-her-04', productName: 'AMOLADORA KONAN 720 W', quantity: 10, unitPrice: 31500 }
    ],
    totalAmount: 1605000,
    notes: 'Presupuesto oficial NUVOH #084 enviado en PDF y enlace directo a WhatsApp.',
    createdAt: '2026-10-10',
    updatedAt: '2026-10-12',
    assignedSalesperson: 'Agustín Novoa'
  },
  {
    id: 'deal-04',
    customerName: 'Esteban Domínguez',
    businessName: 'Ferretería El Obrero',
    phone: '+54 9 223 544-9988',
    email: 'ferreteriaelobrero@gmail.com',
    city: 'Mar del Plata, BA',
    stage: 'payment_pending',
    items: [
      { productId: 'prod-her-01', productName: 'TALADRO NUVOH C/MALETÍN Y 50 ACCESORIOS', quantity: 20, unitPrice: 84500 },
      { productId: 'prod-tec-01', productName: 'MONITOR GADNIC 24" FULL HD 75 HZ', quantity: 5, unitPrice: 145300 }
    ],
    totalAmount: 2416500,
    notes: 'Esperando comprobante de transferencia bancaria (Alias: NUVOH.OFICIAL.ARS). CBU enviado.',
    createdAt: '2026-10-09',
    updatedAt: '2026-10-13',
    assignedSalesperson: 'Agustín Novoa'
  },
  {
    id: 'deal-05',
    customerName: 'Valeria Rivas',
    businessName: 'Espacio Deco & Hogar',
    phone: '+54 9 261 412-3344',
    email: 'valeria@espaciodeco.ar',
    city: 'Mendoza',
    stage: 'won',
    items: [
      { productId: 'prod-mue-01', productName: 'MESA RATONA ELEVABLE VITTORE', quantity: 1, unitPrice: 495000 },
      { productId: 'prod-mue-02', productName: 'SILLAS DE COMEDOR AMALFI X4', quantity: 1, unitPrice: 268000 }
    ],
    totalAmount: 763000,
    notes: 'Venta cerrada y cobrada. Despachado por Expreso Luján de Cuyo con guía #EX-99238.',
    createdAt: '2026-10-06',
    updatedAt: '2026-10-08',
    assignedSalesperson: 'Agustín Novoa'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'NUV-2026-1042',
    customerName: 'Valeria Rivas',
    businessName: 'Espacio Deco & Hogar',
    documentId: '27-38445100-3',
    phone: '+54 9 261 412-3344',
    email: 'valeria@espaciodeco.ar',
    shippingAddress: 'Av. San Martín 1420',
    city: 'Mendoza',
    province: 'Mendoza',
    shippingMethod: 'transporte_expreso',
    shippingCost: 0,
    invoiceType: 'A',
    taxAmount: 0,
    paymentMethod: 'transferencia',
    items: [
      {
        product: {
          id: 'prod-mue-01',
          name: 'MESA RATONA ELEVABLE VITTORE',
          hook: 'MESA RATONA QUE SE ELEVA: TU LIVING ES TU OFICINA',
          category: 'Muebles y Decoración',
          sku: 'HO-NUV-007',
          brand: 'Nuvoh',
          priceUnit: 495000,
          priceTiers: { tier5: 485000, tier10: 475000 },
          badges: ['ELEVABLE', 'GUARDADO'],
          specs: [],
          image: ASSET_IMAGES.hero,
          stock: 18
        },
        quantity: 1,
        unitPriceApplied: 495000,
        totalPrice: 495000
      },
      {
        product: {
          id: 'prod-mue-02',
          name: 'SILLAS DE COMEDOR AMALFI X4',
          hook: 'RESPALDO ALTO BIEN MULLIDO COLOR CAMEL',
          category: 'Muebles y Decoración',
          sku: 'HO-NUV-009',
          brand: 'Nuvoh',
          priceUnit: 268000,
          priceTiers: { tier5: 258000, tier10: 248000 },
          badges: ['TAPIZADA', 'CAMEL'],
          specs: [],
          image: ASSET_IMAGES.hero,
          stock: 30
        },
        quantity: 1,
        unitPriceApplied: 268000,
        totalPrice: 268000
      }
    ],
    subtotal: 763000,
    discount: 0,
    total: 763000,
    status: 'shipped',
    notes: 'Embalaje especial reforzado con esquineros.',
    createdAt: '2026-10-08 14:30'
  },
  {
    id: 'ord-1002',
    orderNumber: 'NUV-2026-1043',
    customerName: 'Santiago Rossi',
    businessName: 'Electrohogar San Isidro',
    documentId: '20-33291044-8',
    phone: '+54 9 11 6543-2199',
    email: 'santiago@electrohogar.com.ar',
    shippingAddress: 'Av. Centenario 820',
    city: 'San Isidro',
    province: 'Buenos Aires',
    shippingMethod: 'retiro_deposito',
    shippingCost: 0,
    invoiceType: 'B',
    taxAmount: 0,
    paymentMethod: 'transferencia',
    items: [
      {
        product: {
          id: 'prod-coc-01',
          name: 'HORNO ELÉCTRICO PIONEER HOME 50L',
          hook: '50 LITROS 2000 W HORNO DE MESA',
          category: 'Cocina y Electro',
          sku: 'EH-COC-071',
          brand: 'Pioneer',
          priceUnit: 140000,
          priceTiers: { tier5: 138000, tier10: 137000 },
          badges: ['50 L', '2000 W'],
          specs: [],
          image: ASSET_IMAGES.horno,
          stock: 45
        },
        quantity: 5,
        unitPriceApplied: 138000,
        totalPrice: 690000
      }
    ],
    subtotal: 690000,
    discount: 0,
    total: 690000,
    status: 'pending_payment',
    notes: 'Retira comisionista de confianza con orden autorizada.',
    createdAt: '2026-10-13 10:15'
  }
];

export const SALES_SCRIPTS = [
  {
    id: 'script-01',
    title: 'Bienvenida a Revendedor + Catálogo Mayorista',
    category: 'Primer Contacto',
    text: `¡Hola {nombre}! 👋 Gracias por comunicarte con *NUVOH - Tecnología para tu Hogar*.

Somos importadores directos con stock real y envíos a todo el país.
Te comento las condiciones comerciales:
🔹 *Precios:* 100% Mayoristas directos.
🔹 *Pedido Mínimo:* $100.000 ARS.
🔹 *Surtido Libre:* Podés combinar unidades de cualquier categoría sin mínimos por producto.
🔹 *Descuentos por escala:* Desde 5, 10 y 100 unidades por producto.

¿Qué rubro te gustaría incorporar para armarte una propuesta personalizada? 📦`
  },
  {
    id: 'script-02',
    title: 'Envío de Presupuesto con Pedido Mínimo Superado',
    category: 'Cotización',
    text: `Hola {nombre}! Te comparto el presupuesto oficial NUVOH para *{negocio}*.

📋 *Total presupuestado:* {monto} ARS
✅ Cumple con el mínimo mayorista de $100.000 (Surtido Libre activado).
📦 *Stock:* Reservado por 24 horas hábiles.
🚚 *Despacho:* En 24/48hs a tu localidad ({ciudad}) por expreso o transporte de tu preferencia.

¿Querés que te reservemos las unidades para confirmar con los datos de facturación?`
  },
  {
    id: 'script-03',
    title: 'Datos Bancarios para Confirmar el Cierre',
    category: 'Cierre de Venta',
    text: `Excelente {nombre}! Para confirmar tu pedido y coordinar el armado inmediato en depósito, te pasamos los datos:

🏦 *Razón Social:* NUVOH ARGENTINA S.A.
🔹 *Banco:* Santander Río
🔹 *CBU:* 0720123420000001234567
🔹 *Alias:* NUVOH.MAYORISTA.ARS
🔹 *CUIT:* 30-71889922-4

Una vez enviada la transferencia o depósito, mandanos el comprobante por acá para generar tu remito de despacho. 🚚🤝`
  },
  {
    id: 'script-04',
    title: 'Seguimiento de Carrito o Cotización Abierta',
    category: 'Seguimiento',
    text: `Hola {nombre}, ¿cómo estás? Te consulto brevemente por el pedido de *{negocio}* ({monto} ARS).

Como ingresaron varias reservas de ese modelo, queremos confirmarte si dejamos las unidades apartadas para tu despacho esta semana o si necesitás ajustar alguna cantidad o producto del catálogo. 

Quedo atento para darte prioridad de salida! 🙌`
  }
];

export const INITIAL_INTERACTIONS = [
  {
    id: 'int-01',
    clientId: 'cli-01',
    dealId: 'deal-03',
    type: 'whatsapp' as const,
    note: 'Enviado presupuesto #084 por lote de 10 taladros Nuvoh y amoladoras. Solicitó despacho por Expreso Morabito.',
    author: 'Agustín Novoa',
    createdAt: '2026-10-12 11:30'
  },
  {
    id: 'int-02',
    clientId: 'cli-02',
    dealId: 'deal-02',
    type: 'llamada' as const,
    note: 'Llamada telefónica con Mariana. Consulta por disponibilidad de cafeteras expreso Winco y condiciones de entrega.',
    author: 'Agustín Novoa',
    createdAt: '2026-10-11 15:45'
  },
  {
    id: 'int-03',
    clientId: 'cli-03',
    dealId: 'deal-04',
    type: 'whatsapp' as const,
    note: 'Confirmó que realiza la transferencia bancaria hoy por la tarde para asegurar precio por bulto cerrado.',
    author: 'Agustín Novoa',
    createdAt: '2026-10-13 09:20'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-01',
    type: 'new_order' as const,
    title: '¡Nuevo Pedido Entrante! #NUV-2026-9042',
    message: 'Distribuidora Electro Centro generó un pedido por $585.000 (10x Horno Eléctrico Pioneer). Pendiente de comprobante.',
    createdAt: 'Hace 15 min',
    isRead: false,
    priority: 'high' as const,
    entityId: 'ord-01',
    entityType: 'order' as const,
    metadata: {
      orderNumber: 'NUV-2026-9042',
      total: 585000,
      clientName: 'Distribuidora Electro Centro',
      phone: '+54 9 11 4982-1100'
    }
  },
  {
    id: 'notif-02',
    type: 'urgent_interaction' as const,
    title: '⚠️ Interacción Urgente: Ferretería El Obrero',
    message: 'Esteban Domínguez solicita confirmación inmediata de stock para 50 taladros de impacto antes de cierre bancario (14:00hs).',
    createdAt: 'Hace 35 min',
    isRead: false,
    priority: 'urgent' as const,
    entityId: 'cli-03',
    entityType: 'interaction' as const,
    metadata: {
      clientName: 'Ferretería El Obrero',
      phone: '+54 9 223 544-9988',
      urgencyReason: 'Cierre bancario de lote mayorista'
    }
  },
  {
    id: 'notif-03',
    type: 'new_order' as const,
    title: 'Pedido Web Registrado #NUV-2026-8819',
    message: 'Bazar San Martín ingresó una orden por $296.000 con envío por Expreso Morabito.',
    createdAt: 'Hace 2 horas',
    isRead: true,
    priority: 'normal' as const,
    entityId: 'ord-02',
    entityType: 'order' as const,
    metadata: {
      orderNumber: 'NUV-2026-8819',
      total: 296000,
      clientName: 'Bazar San Martín',
      phone: '+54 9 351 689-4321'
    }
  }
];


