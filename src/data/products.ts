import { Product } from '../types';
import { ASSET_IMAGES } from '../utils/imageUtils';

export const HERO_IMAGE = ASSET_IMAGES.hero;

export const CATALOG_CATEGORIES = [
  'Todos',
  'Cocina y Electro',
  'Hogar y Climatización',
  'Herramientas y Ferretería',
  'Muebles y Decoración',
  'Cuidado Personal y Deportes',
  'Tecno y Varios'
] as const;

export const INITIAL_PRODUCTS: Product[] = [
  // 1. Cocina y Electro
  {
    id: 'prod-coc-01',
    name: 'HORNO ELÉCTRICO PIONEER HOME 50L',
    hook: '50 LITROS 2000 W HORNO DE MESA',
    category: 'Cocina y Electro',
    sku: 'EH-COC-071',
    brand: 'Pioneer',
    priceUnit: 140000,
    priceTiers: {
      tier5: 138000,
      tier10: 137000,
      tier100: 133000
    },
    badges: ['50 L', '2000 W', '250 °C'],
    specs: [
      { label: '50 LITROS', desc: 'Entra una fuente grande.', iconName: 'maximize' },
      { label: '100 A 250 °C', desc: 'Selector con timer de 60 minutos.', iconName: 'clock' },
      { label: '4 RESISTENCIAS', desc: 'Dos arriba y dos abajo, con luz interior.', iconName: 'flame' },
      { label: 'ACCESORIOS', desc: 'Bandeja esmaltada, rejilla y agarradera.', iconName: 'check-circle' }
    ],
    image: ASSET_IMAGES.horno,
    stock: 45,
    featured: true
  },
  {
    id: 'prod-coc-02',
    name: 'HORNO ELÉCTRICO PIONEER HOME 75L',
    hook: '75 LITROS PARA FAMILIA HORNO DE MESA',
    category: 'Cocina y Electro',
    sku: 'EH-COC-072',
    brand: 'Pioneer',
    priceUnit: 190000,
    priceTiers: {
      tier5: 188000,
      tier10: 186000,
      tier100: 180500
    },
    badges: ['75 L', '2000 W', 'CONVECCIÓN'],
    specs: [
      { label: '75 LITROS', desc: 'Para reuniones y familias grandes.', iconName: 'users' },
      { label: 'CONVECCIÓN', desc: 'Cocción pareja en toda la cavidad.', iconName: 'wind' },
      { label: '2000 W', desc: 'Temperatura regulable con timer.', iconName: 'zap' },
      { label: 'LUZ INTERIOR', desc: 'Mirás sin abrir la puerta.', iconName: 'sun' }
    ],
    image: ASSET_IMAGES.horno,
    stock: 28,
    featured: true
  },
  {
    id: 'prod-coc-03',
    name: 'HORNO ELÉCTRICO TELEFUNKEN TF',
    hook: '38 LITROS TURBO CONVECCIÓN 250 °C',
    category: 'Cocina y Electro',
    sku: 'EH-COC-086',
    code: 'COD. E400',
    brand: 'Telefunken',
    priceUnit: 132250,
    priceTiers: {
      tier5: 130250,
      tier10: 128250,
      tier100: 125600
    },
    badges: ['38 L', 'CONVECCIÓN', 'ANTIADHERENTE'],
    specs: [
      { label: '38 LITROS', desc: 'Timer de 60 minutos.', iconName: 'clock' },
      { label: '65 A 250 °C', desc: 'Regulable para cada receta.', iconName: 'thermometer' },
      { label: 'TURBO CONVECCIÓN', desc: 'Ventilador que circula el aire caliente.', iconName: 'wind' },
      { label: 'INTERIOR ANTIADHERENTE', desc: 'Con lámpara, bandeja, rejilla y mango.', iconName: 'shield' }
    ],
    image: ASSET_IMAGES.horno,
    stock: 35
  },
  {
    id: 'prod-coc-04',
    name: 'CAFETERA EXPRESSO WINCO 20 BAR',
    hook: 'ESPRESSO Y CAPUCHINO 20 BAR TOUCH',
    category: 'Cocina y Electro',
    sku: 'EH-CAF-014',
    code: 'COD. W1927',
    brand: 'Winco',
    priceUnit: 153000,
    priceTiers: {
      tier5: 151000,
      tier10: 149000,
      tier100: 145400
    },
    badges: ['20 BAR', '950 W', '1,2 L'],
    specs: [
      { label: '20 BARES', desc: 'Extracción con crema espesa.', iconName: 'gauge' },
      { label: 'PANEL TOUCH', desc: 'Con visor de temperatura digital.', iconName: 'activity' },
      { label: 'VAPORIZADOR', desc: 'Latte y capuchino con espuma en casa.', iconName: 'cloud' },
      { label: 'TANQUE 1,2 L', desc: 'Removible, filtro de 1 o 2 pocillos.', iconName: 'droplet' }
    ],
    image: ASSET_IMAGES.cafetera,
    stock: 22,
    featured: true
  },
  {
    id: 'prod-coc-05',
    name: 'PAVA DIGITAL CON NUVOH SELECTOR',
    hook: 'ELEGÍ LA TEMPERATURA PAVA DIGITAL',
    category: 'Cocina y Electro',
    sku: 'EH-COC-039',
    brand: 'Nuvoh',
    priceUnit: 49500,
    priceTiers: {
      tier5: 48500,
      tier10: 48000,
      tier100: 47000
    },
    badges: ['DIGITAL', 'SELECTOR MATE', 'MANTIENE CALOR'],
    specs: [
      { label: 'SELECTOR', desc: 'Varias temperaturas: té, mate, hervor.', iconName: 'sliders' },
      { label: 'PANEL DIGITAL', desc: 'En la manija, de un vistazo.', iconName: 'monitor' },
      { label: 'MANTIENE CALOR', desc: 'Conserva la temperatura elegida.', iconName: 'flame' },
      { label: 'BASE 360°', desc: 'Con corte automático de seguridad.', iconName: 'rotate-cw' }
    ],
    image: ASSET_IMAGES.cafetera,
    stock: 60,
    isNew: true
  },
  {
    id: 'prod-coc-06',
    name: 'FREIDORA DE AIRE DIGITAL 4,2L',
    hook: 'BOWL DE VIDRIO 4,2L DIGITAL SIN ACEITE',
    category: 'Cocina y Electro',
    sku: 'EH-COC-081',
    code: 'COD. FREI420D',
    brand: 'Nuvoh',
    priceUnit: 69900,
    priceTiers: {
      tier5: 67900,
      tier10: 65900,
      tier100: 65900
    },
    badges: ['4,2 L', 'VIDRIO', '5 MENÚS'],
    specs: [
      { label: 'BOWL DE VIDRIO', desc: 'Ves la cocción completa en tiempo real.', iconName: 'eye' },
      { label: 'PANEL TÁCTIL', desc: '5 menús automáticos preprogramados.', iconName: 'grid' },
      { label: '80 A 200 °C', desc: 'Timer digital de 60 minutos.', iconName: 'clock' },
      { label: 'ANTIADHERENTE', desc: 'Cesta extraíble fácil de lavar.', iconName: 'sparkles' }
    ],
    image: ASSET_IMAGES.horno,
    stock: 40
  },
  {
    id: 'prod-coc-07',
    name: 'COCINA USMAN 4 HORNALLAS + PLANCHA',
    hook: '4 HORNALLAS Y PLANCHA INDUSTRIAL USMAN',
    category: 'Cocina y Electro',
    sku: 'HO-COC-061',
    brand: 'Usman',
    priceUnit: 510000,
    priceTiers: {
      tier5: 495000,
      tier10: 490000,
      tier100: 480000
    },
    badges: ['INDUSTRIAL', 'PLANCHA', 'MULTIGAS'],
    specs: [
      { label: '4 HORNALLAS', desc: 'Mecheros industriales de alta potencia.', iconName: 'flame' },
      { label: 'PLANCHA', desc: 'Bifera integrada de fundición.', iconName: 'layers' },
      { label: 'ACERO INOXIDABLE', desc: 'Mesada de vidrio templado reforzado.', iconName: 'shield' },
      { label: 'VÁLVULA SEGURIDAD', desc: 'De corte total y multigas homologado.', iconName: 'check' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 12
  },

  // 2. Hogar y Climatización
  {
    id: 'prod-hog-01',
    name: 'ESTUFA NUVOH FIJA 3 VELAS CUARZO',
    hook: 'CALOR INFRARROJO 3 VELAS DE CUARZO',
    category: 'Hogar y Climatización',
    sku: 'EH-EST-003',
    brand: 'Nuvoh',
    priceUnit: 23650,
    priceTiers: {
      tier5: 22500,
      tier10: 21800,
      tier100: 20500
    },
    badges: ['3 VELAS', 'CUARZO', 'SIN RUIDO'],
    specs: [
      { label: '3 VELAS', desc: 'Calor inmediato, sin precalentar.', iconName: 'zap' },
      { label: 'INFRARROJO', desc: 'No reseca el aire ni produce ruidos.', iconName: 'sun' },
      { label: 'POTENCIA', desc: 'Por niveles, según cuántas velas prendés.', iconName: 'sliders' },
      { label: 'SEGURA', desc: 'Corte automático por caída y fusible térmico.', iconName: 'shield' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 90
  },
  {
    id: 'prod-hog-02',
    name: 'CONVECTOR ELÉCTRICO NUVOH 2000 W',
    hook: 'CALOR SILENCIOSO CONVECTOR 2000 W',
    category: 'Hogar y Climatización',
    sku: 'EH-EST-005',
    code: 'COD. N-544',
    brand: 'Nuvoh',
    priceUnit: 50000,
    priceTiers: {
      tier5: 48000,
      tier10: 46500,
      tier100: 44000
    },
    badges: ['2000 W', 'SILENCIOSO', 'TERMOSTATO'],
    specs: [
      { label: '1000 / 2000 W', desc: 'Dos niveles con selector de termostato.', iconName: 'zap' },
      { label: 'SÚPER SILENCIOSO', desc: 'Convección natural sin ventilador.', iconName: 'volume-x' },
      { label: 'LIVIANO', desc: '60 x 35 x 10 cm, patas y fácil de mover.', iconName: 'box' },
      { label: 'SEGURO', desc: 'Materiales ignífugos de alto rendimiento.', iconName: 'shield' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 55,
    featured: true
  },
  {
    id: 'prod-hog-03',
    name: 'LAVARROPAS ENOVA CARGA FRONTAL INVERTER 8KG',
    hook: '8 KG INVERTER CARGA FRONTAL 1400 RPM',
    category: 'Hogar y Climatización',
    sku: 'EH-LAV-001',
    code: 'COD. 8KG',
    brand: 'Enova',
    priceUnit: 664645,
    priceTiers: {
      tier5: 655000,
      tier10: 648000,
      tier100: 630000
    },
    badges: ['8 KG', 'INVERTER', '1400 RPM'],
    specs: [
      { label: '8 KG CARGA', desc: 'Centrifugado potente a 1400 RPM.', iconName: 'rotate-cw' },
      { label: 'MOTOR INVERTER', desc: 'Menos ruido, menos consumo, clase A+++.', iconName: 'zap' },
      { label: '16 PROGRAMAS', desc: 'Rápido 15m, lana, alergias, sábanas.', iconName: 'list' },
      { label: 'PANTALLA DIGITAL', desc: 'Control de temperatura fría y caliente.', iconName: 'monitor' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 14
  },
  {
    id: 'prod-hog-04',
    name: 'ASPIRADORA ROBOT GADNIC MOPA Y WIFI',
    hook: 'ASPIRA Y TRAPEA CON ALEXA Y GOOGLE',
    category: 'Hogar y Climatización',
    sku: 'EH-RBT-011',
    code: 'COD. ROB00507',
    brand: 'Gadnic',
    priceUnit: 215300,
    priceTiers: {
      tier5: 214300,
      tier10: 213300,
      tier100: 205000
    },
    badges: ['4 MODOS', 'MOPA INTELIGENTE', 'ALEXA/GOOGLE'],
    specs: [
      { label: '4 MODOS', desc: 'Aspira y trapea, depósitos 350ml + 150ml.', iconName: 'sparkles' },
      { label: 'ALEXA Y GOOGLE', desc: 'Comandos por voz y app móvil desde donde estés.', iconName: 'mic' },
      { label: 'FILTRO HEPA', desc: 'Retiene ácaros y polen con sensor anticaída.', iconName: 'shield' },
      { label: '11.800 RPM', desc: 'Batería de 2000 mAh de larga duración.', iconName: 'battery' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 30,
    featured: true
  },
  {
    id: 'prod-hog-05',
    name: 'DIFUSOR HUMIDIFICADOR EFECTO FUEGO',
    hook: 'AROMA Y LUZ DE FOGATA EN CASA',
    category: 'Hogar y Climatización',
    sku: 'HO-DEC-018',
    code: 'COD. DIFU0018',
    brand: 'Nuvoh',
    priceUnit: 18500,
    priceTiers: {
      tier5: 17500,
      tier10: 16500,
      tier100: 15200
    },
    badges: ['EFECTO FUEGO', 'AROMAS', 'USB'],
    specs: [
      { label: 'EFECTO FUEGO', desc: 'Vapor iluminado cálido que parece una llama.', iconName: 'flame' },
      { label: 'AROMATERAPIA', desc: 'Compatible con aceites esenciales naturales.', iconName: 'droplet' },
      { label: 'HUMIDIFICA', desc: 'Mejora el aire seco en habitaciones y oficinas.', iconName: 'wind' },
      { label: 'CONEXIÓN USB', desc: 'Se conecta a cualquier cargador o computadora.', iconName: 'cpu' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 85
  },

  // 3. Herramientas y Ferretería
  {
    id: 'prod-her-01',
    name: 'TALADRO NUVOH C/MALETÍN Y 50 ACCESORIOS',
    hook: 'TODO EL TALLER EN UN MALETÍN DOS BATERÍAS 48V LI-ION',
    category: 'Herramientas y Ferretería',
    sku: 'EH-HER-028',
    brand: 'Nuvoh',
    priceUnit: 90000,
    priceTiers: {
      tier5: 88000,
      tier10: 86000,
      tier100: 84500
    },
    badges: ['INALÁMBRICO', '2 BATERÍAS 48V', '50 ACCESORIOS'],
    specs: [
      { label: 'TALADRO 48 V', desc: 'Atornillador a batería de torque reforzado.', iconName: 'tool' },
      { label: 'DOBLE BATERÍA', desc: 'Dos baterías Li-ion de 48V y cargador incluidos.', iconName: 'battery' },
      { label: 'KIT DE MANO', desc: 'Arco de sierra, pinzas, destornilladores y cutter.', iconName: 'briefcase' },
      { label: 'TODO ORDENADO', desc: 'Mechas, tubos, tester, cinta de 3m y tarugos.', iconName: 'check-square' }
    ],
    image: ASSET_IMAGES.taladro,
    stock: 50,
    featured: true
  },
  {
    id: 'prod-her-02',
    name: 'MINI MOTOSIERRA NUVOH 48V ESPADA 6"',
    hook: 'PODÁ CON UNA MANO ESPADA 6" SIN CABLES',
    category: 'Herramientas y Ferretería',
    sku: 'EH-HER-026',
    brand: 'Nuvoh',
    priceUnit: 45000,
    priceTiers: {
      tier5: 44000,
      tier10: 43000,
      tier100: 42000
    },
    badges: ['48 V', 'COMPACTA', '2 BATERÍAS'],
    specs: [
      { label: 'ESPADA 6 PULGADAS', desc: 'Para ramas finas, leña chica y poda de jardín.', iconName: 'scissors' },
      { label: 'DOS BATERÍAS 48 V', desc: 'Cambiás la batería y seguís cortando sin parar.', iconName: 'battery' },
      { label: 'CADENA DE REPUESTO', desc: 'Incluye cadena extra 1/4-043 de 6 pulgadas.', iconName: 'repeat' },
      { label: 'LISTA PARA USAR', desc: 'Cargador rápido y maletín de transporte.', iconName: 'package' }
    ],
    image: ASSET_IMAGES.taladro,
    stock: 40
  },
  {
    id: 'prod-her-03',
    name: 'SET TUBOS 46 PIEZAS CROMO VANADIO',
    hook: '46 PIEZAS A MANO ENCASTRE DE 1/4"',
    category: 'Herramientas y Ferretería',
    sku: 'VA-LLA-003',
    brand: 'Nuvoh',
    priceUnit: 10990,
    priceTiers: {
      tier5: 9990,
      tier10: 8990,
      tier100: 8300
    },
    badges: ['CRIQUE', 'TORX', '13 TUBOS'],
    specs: [
      { label: 'TUBOS DE 4 A 14 MM', desc: 'Trece medidas completas en cromo vanadio.', iconName: 'circle' },
      { label: 'CRIQUE REVERSIBLE', desc: 'Cambiás el giro con botón sin sacar el tubo.', iconName: 'refresh-cw' },
      { label: '21 PUNTAS', desc: 'Torx, hexagonales, planas y Phillips.', iconName: 'hash' },
      { label: 'CAJA ORDENADA', desc: 'Estuche rígido rojo de alta resistencia.', iconName: 'box' }
    ],
    image: ASSET_IMAGES.taladro,
    stock: 120
  },
  {
    id: 'prod-her-04',
    name: 'AMOLADORA KONAN 720 W 115 MM',
    hook: 'AMOLADORA ANGULAR 720 W 115 MM 11.000 RPM',
    category: 'Herramientas y Ferretería',
    sku: 'EH-HER-032',
    code: 'COD. KC115',
    brand: 'Konan',
    priceUnit: 33500,
    priceTiers: {
      tier5: 32500,
      tier10: 31500,
      tier100: 30500
    },
    badges: ['720 W', '11.000 RPM', '115 MM'],
    specs: [
      { label: 'MOTOR 720 W', desc: 'Corta, desbasta, lija y pule sin esfuerzo.', iconName: 'zap' },
      { label: '11.000 RPM', desc: 'Velocidad sin carga para corte parejo en metal.', iconName: 'gauge' },
      { label: 'DISCO INCLUIDO', desc: 'Viene con disco de corte de 115 x 1,6 mm.', iconName: 'disc' },
      { label: 'ROSCA M14', desc: 'Compatible con discos y accesorios estándar.', iconName: 'check' }
    ],
    image: ASSET_IMAGES.taladro,
    stock: 65,
    isNew: true
  },
  {
    id: 'prod-her-05',
    name: 'ROTOMARTILLO BRON BY GADNIC SDS',
    hook: 'ROMPÉ Y PERFORÁ HORMIGÓN BRON SDS',
    category: 'Herramientas y Ferretería',
    sku: 'EH-HER-048',
    code: 'COD. DESELE56',
    brand: 'Bron Gadnic',
    priceUnit: 115000,
    priceTiers: {
      tier5: 114000,
      tier10: 113000,
      tier100: 109000
    },
    badges: ['ROTOMARTILLO', 'BRON', 'SDS PLUS'],
    specs: [
      { label: 'PERCUSIÓN', desc: 'Para hormigón y mampostería pesada.', iconName: 'target' },
      { label: 'POTENTE', desc: 'Pensado para obras y trabajos exigentes.', iconName: 'zap' },
      { label: 'ACCESORIOS', desc: 'Mechas y cinceles incluidos en el kit.', iconName: 'box' },
      { label: 'MALETÍN', desc: 'Valija rígida para guardar todo en orden.', iconName: 'briefcase' }
    ],
    image: ASSET_IMAGES.taladro,
    stock: 25
  },

  // 4. Muebles y Decoración
  {
    id: 'prod-mue-01',
    name: 'MESA RATONA ELEVABLE VITTORE',
    hook: 'MESA RATONA QUE SE ELEVA: TU LIVING ES TU OFICINA',
    category: 'Muebles y Decoración',
    sku: 'HO-NUV-007',
    code: 'COD. HYT14',
    brand: 'Nuvoh',
    priceUnit: 495000,
    priceTiers: {
      tier5: 485000,
      tier10: 475000,
      tier100: 460000
    },
    badges: ['ELEVABLE', 'GUARDADO', 'MADERA CLARA'],
    specs: [
      { label: 'TAPA ELEVABLE', desc: 'La tapa sube y queda a la altura ideal del sofá.', iconName: 'arrow-up' },
      { label: 'BASE EN X', desc: 'Estructura metálica negra con patas cruzadas.', iconName: 'maximize-2' },
      { label: 'GUARDADO OCULTO', desc: 'Debajo de la tapa entran controles y notebooks.', iconName: 'archive' },
      { label: 'MADERA Y METAL', desc: 'Tapa de madera clara con herrajes reforzados.', iconName: 'layers' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 18,
    isNew: true,
    featured: true
  },
  {
    id: 'prod-mue-02',
    name: 'SILLAS DE COMEDOR AMALFI X4',
    hook: 'RESPALDO ALTO BIEN MULLIDO COLOR CAMEL',
    category: 'Muebles y Decoración',
    sku: 'HO-NUV-009',
    code: 'COD. HYST01',
    brand: 'Nuvoh',
    priceUnit: 268000,
    priceTiers: {
      tier5: 258000,
      tier10: 248000,
      tier100: 238000
    },
    badges: ['TAPIZADA', 'CAMEL', 'MADERA'],
    specs: [
      { label: 'MEDIDAS', desc: 'Mide 46 cm ancho, 44 fondo y 93 de alto.', iconName: 'ruler' },
      { label: 'RESPALDO CURVO', desc: 'Acompaña la postura de la espalda al cenar.', iconName: 'user' },
      { label: 'TAPIZADO SUAVE', desc: 'Tela tipo chenille en tono camel cálido.', iconName: 'heart' },
      { label: 'PATAS DE MADERA', desc: 'Cuatro patas de madera clara, prolijas y firmes.', iconName: 'shield' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 30,
    isNew: true
  },
  {
    id: 'prod-mue-03',
    name: 'SILLA GAMER NUVOH SHADOW STRIKE',
    hook: 'BUTACA DE CARRERA: JUGÁ SIN CANSARTE',
    category: 'Muebles y Decoración',
    sku: 'HO-NUV-011',
    brand: 'Nuvoh',
    priceUnit: 150000,
    priceTiers: {
      tier5: 148000,
      tier10: 147000,
      tier100: 142000
    },
    badges: ['RECLINABLE', 'TIPO BUTACA', 'RESPALDO ALTO'],
    specs: [
      { label: 'ESTILO BUTACA', desc: 'Asiento envolvente como el de auto deportivo.', iconName: 'award' },
      { label: 'RESPALDO ALTO', desc: 'Sostiene la columna hasta la nuca.', iconName: 'user-check' },
      { label: 'SE RECLINA', desc: 'Bajás el respaldo para descansar entre partidas.', iconName: 'chevrons-down' },
      { label: 'BASE DE 5 RUEDAS', desc: 'Ruedas giratorias 360° y pistón a gas clase 4.', iconName: 'rotate-cw' }
    ],
    image: ASSET_IMAGES.silla,
    stock: 45,
    featured: true
  },
  {
    id: 'prod-mue-04',
    name: 'ESCRITORIO GAMER NUVOH ASTRIX',
    hook: 'TU ESCRITORIO GAMER TODO A MANO TEXTURA CARBONO',
    category: 'Muebles y Decoración',
    sku: 'HO-NUV-013',
    brand: 'Nuvoh',
    priceUnit: 185000,
    priceTiers: {
      tier5: 184000,
      tier10: 183000,
      tier100: 178000
    },
    badges: ['FIBRA CARBONO', 'PORTA VASO', 'PATAS EN Y'],
    specs: [
      { label: 'TEXTURA CARBONO', desc: 'Superficie negra anti-rayas premium.', iconName: 'square' },
      { label: 'PATAS EN Y', desc: 'Estructura metálica que no se bambolea.', iconName: 'anchor' },
      { label: 'GANCHO Y VASO', desc: 'Soporte para auriculares y vaso integrados.', iconName: 'headphones' },
      { label: 'BORDE CONTENCIÓN', desc: 'Pasa-cables para que nada se caiga de la mesa.', iconName: 'sliders' }
    ],
    image: ASSET_IMAGES.silla,
    stock: 25
  },

  // 5. Cuidado Personal y Deportes
  {
    id: 'prod-cui-01',
    name: 'MASAJEADOR GADNIC TODO EL CUERPO',
    hook: 'RELAJÁ TODO EL CUERPO EN CASA CUANDO QUIERAS',
    category: 'Cuidado Personal y Deportes',
    sku: 'CP-MAS-004',
    code: 'COD. MASAJ169',
    brand: 'Gadnic',
    priceUnit: 21700,
    priceTiers: {
      tier5: 20700,
      tier10: 19700,
      tier100: 18900
    },
    badges: ['CUERPO ENTERO', '4 CABEZALES', '2 INTENSIDADES'],
    specs: [
      { label: '4 CABEZALES', desc: 'Puntero, 5 puntas, plano y silicona.', iconName: 'circle' },
      { label: '2 INTENSIDADES', desc: 'Regulá la fuerza según la zona a tratar.', iconName: 'activity' },
      { label: 'TODO EL CUERPO', desc: 'Cuello, espalda, piernas, pies y manos.', iconName: 'user' },
      { label: 'LIVIANO', desc: 'Diseño ergonómico fácil de usar a una mano.', iconName: 'feather' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 50
  },
  {
    id: 'prod-cui-02',
    name: 'CABINA FACIAL Y CORPORAL GADNIC 7 LUCES',
    hook: 'FOTOTERAPIA PARA LA PIEL 7 LUCES UN EQUIPO',
    category: 'Cuidado Personal y Deportes',
    sku: 'CP-ACC-007',
    code: 'COD. LEDMASK5',
    brand: 'Gadnic',
    priceUnit: 162000,
    priceTiers: {
      tier5: 158000,
      tier10: 154000,
      tier100: 149000
    },
    badges: ['7 COLORES', '96 W', 'PLEGABLE'],
    specs: [
      { label: '7 COLORES LED', desc: 'Roja, azul, verde, amarilla, celeste, violeta, blanca.', iconName: 'sun' },
      { label: '96 W POTENCIA', desc: 'Cubre rostro, cuello y escote en una sola sesión.', iconName: 'zap' },
      { label: 'PANTALLA TÁCTIL', desc: 'Elegís color y temporizador con un toque.', iconName: 'monitor' },
      { label: 'PLEGABLE', desc: 'Se guarda sin ocupar lugar. Incluye antiparras.', iconName: 'eye' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 16,
    featured: true
  },
  {
    id: 'prod-cui-03',
    name: 'PISTOLA MASAJEADORA GADNIC PERCUSIÓN',
    hook: 'ALIVIÁ LA TENSIÓN EN MINUTOS MASAJE DE PERCUSIÓN',
    category: 'Cuidado Personal y Deportes',
    sku: 'CP-ACC-016',
    code: 'COD. MASAJ141',
    brand: 'Gadnic',
    priceUnit: 22500,
    priceTiers: {
      tier5: 22000,
      tier10: 21500,
      tier100: 20200
    },
    badges: ['PERCUSIÓN', 'CABEZALES', 'RECARGABLE'],
    specs: [
      { label: 'PERCUSIÓN', desc: 'Descarga muscular profunda post entrenamiento.', iconName: 'zap' },
      { label: 'CABEZALES', desc: '4 cabezales intercambiables según grupo muscular.', iconName: 'grid' },
      { label: 'INTENSIDADES', desc: 'Selector de 6 velocidades progresivas.', iconName: 'sliders' },
      { label: 'RECARGABLE USB', desc: 'Batería de larga autonomía sin cables.', iconName: 'battery' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 70
  },
  {
    id: 'prod-cui-04',
    name: 'CINTA PARA CORRER FORCE GADNIC PLEGABLE',
    hook: 'CAMINÁ SIN ENCHUFE CINTA MAGNÉTICA HASTA 120 KG',
    category: 'Cuidado Personal y Deportes',
    sku: 'HO-DEP-004',
    code: 'COD. CINTA034',
    brand: 'Gadnic',
    priceUnit: 255000,
    priceTiers: {
      tier5: 250000,
      tier10: 245000,
      tier100: 238000
    },
    badges: ['SIN MOTOR', 'HASTA 120 KG', 'PLEGABLE'],
    specs: [
      { label: 'SIN MOTOR', desc: 'Se mueve con tu paso: cero consumo eléctrico.', iconName: 'activity' },
      { label: 'HASTA 120 KG', desc: 'Superficie de carrera de 100 x 35 cm reforzada.', iconName: 'shield' },
      { label: 'PANTALLA DIGITAL', desc: 'Mide tiempo, velocidad, distancia y calorías.', iconName: 'monitor' },
      { label: 'PLEGABLE', desc: 'Ruedas de traslado y disco giratorio de cintura.', iconName: 'move' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 20
  },

  // 6. Tecno y Varios
  {
    id: 'prod-tec-01',
    name: 'MONITOR GADNIC 24" FULL HD 75 HZ',
    hook: '24" FULL HD A 75 HZ PARA TRABAJAR Y JUGAR',
    category: 'Tecno y Varios',
    sku: 'TE-MON-005',
    code: 'COD. MON00136',
    brand: 'Gadnic',
    priceUnit: 148300,
    priceTiers: {
      tier5: 145300,
      tier10: 141300,
      tier100: 136000
    },
    badges: ['24"', 'FULL HD 1080P', '75 HZ'],
    specs: [
      { label: 'FULL HD', desc: '1920 x 1080 píxeles nítidos en 24 pulgadas.', iconName: 'monitor' },
      { label: '75 HZ FLUIDEZ', desc: 'Mayor suavidad de imagen para gaming y trabajo.', iconName: 'zap' },
      { label: 'HDMI Y VGA', desc: 'Doble conectividad compatible con toda PC.', iconName: 'tv' },
      { label: 'SOPORTE VESA', desc: 'Montable en pared o brazo de escritorio.', iconName: 'maximize' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 35,
    featured: true
  },
  {
    id: 'prod-tec-02',
    name: 'TECLADO MECÁNICO MAGMA 60% RGB',
    hook: 'MECÁNICO 60% COMPACTO Y RGB SWITCHES REALES',
    category: 'Tecno y Varios',
    sku: 'TE-TEC-002',
    brand: 'Magma',
    priceUnit: 80000,
    priceTiers: {
      tier5: 78000,
      tier10: 76000,
      tier100: 73000
    },
    badges: ['MECÁNICO', 'FORMATO 60%', 'RGB CUSTOM'],
    specs: [
      { label: 'SWITCHES MECÁNICOS', desc: 'Respuesta táctil rápida y clic satisfactorio.', iconName: 'cpu' },
      { label: 'FORMATO 60%', desc: 'Sin pad numérico: máximo espacio para el mouse.', iconName: 'layout' },
      { label: 'ILUMINACIÓN RGB', desc: 'Múltiples patrones y animaciones de color.', iconName: 'sun' },
      { label: 'KEYCAPS BI-COLOR', desc: 'Teclas amarillas y negras en plástico de alta gama.', iconName: 'grid' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 45
  },
  {
    id: 'prod-tec-03',
    name: 'PARLANTE TORRE WINCO CON LUCES Y DJ',
    hook: 'TORRE CON LUCES DJ Y KARAOKE DE 50 W',
    category: 'Tecno y Varios',
    sku: 'TE-PAR-073',
    code: 'COD. W219',
    brand: 'Winco',
    priceUnit: 136755,
    priceTiers: {
      tier5: 134755,
      tier10: 132755,
      tier100: 128000
    },
    badges: ['50 W', 'KARAOKE', 'CONTROL REMOTO'],
    specs: [
      { label: '50 W RMS', desc: 'Torre de 60 cm con woofers iluminados.', iconName: 'volume-2' },
      { label: 'KARAOKE Y DJ', desc: 'Entrada de micrófono con control de eco y graves.', iconName: 'mic' },
      { label: 'BLUETOOTH, USB, FM', desc: 'Reproduce radio, pendrive y conexión inalámbrica.', iconName: 'radio' },
      { label: 'BATERÍA INTERNA', desc: 'Recargable para transportar a cualquier evento.', iconName: 'battery' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 24,
    featured: true
  },
  {
    id: 'prod-tec-04',
    name: 'CERRADURA BIOMÉTRICA GADNIC DIGITAL',
    hook: 'ABRÍ CON EL DEDO MANIJA BIOMÉTRICA SIN LLAVE',
    category: 'Tecno y Varios',
    sku: 'EH-SEG-004-GRIS',
    brand: 'Gadnic',
    priceUnit: 59500,
    priceTiers: {
      tier5: 58500,
      tier10: 57500,
      tier100: 55000
    },
    badges: ['HUELLA DIGITAL', 'SIN LLAVE', 'A PILAS'],
    specs: [
      { label: 'LECTOR BIOMÉTRICO', desc: 'Reconoce tu huella en menos de 0.5 segundos.', iconName: 'fingerprint' },
      { label: 'HASTA 50 HUELLAS', desc: 'Registra a toda la familia y empleados.', iconName: 'users' },
      { label: 'AUTONOMÍA 1 AÑO', desc: 'A pilas AAA con puerto de emergencia USB.', iconName: 'battery' },
      { label: 'FÁCIL MONTAJE', desc: 'Se instala directamente en puertas estándar.', iconName: 'tool' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 50,
    isNew: true
  },
  {
    id: 'prod-tec-05',
    name: 'MONOPATÍN ELÉCTRICO DAIHATSU V300',
    hook: 'MÁS POTENCIA MÁS AUTONOMÍA DAIHATSU PLEGABLE',
    category: 'Tecno y Varios',
    sku: 'HO-ROD-006-NEGRO',
    brand: 'Daihatsu',
    priceUnit: 1290000,
    priceTiers: {
      tier5: 1275000,
      tier10: 1260000,
      tier100: 1210000
    },
    badges: ['ELÉCTRICO', 'DOBLE FRENO', 'PLEGABLE'],
    specs: [
      { label: 'MOTOR REFORZADO', desc: 'Fuerza continua para subidas y peso adulto.', iconName: 'zap' },
      { label: 'GRAN AUTONOMÍA', desc: 'Batería de litio para trayectos de todo el día.', iconName: 'battery-charging' },
      { label: 'DOBLE FRENO', desc: 'Frenado seguro delantero y a disco trasero.', iconName: 'shield' },
      { label: 'PLEGABLE 3 SEG', desc: 'Lo guardás en el baúl del auto o en la oficina.', iconName: 'package' }
    ],
    image: ASSET_IMAGES.hero,
    stock: 8,
    featured: true
  }
];

export const WHOLESALE_MINIMUM_ORDER = 100000; // $100.000 ARS as stated in the catalog cover!
