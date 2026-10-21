/**
 * High-fidelity vector/canvas flyer graphic matching the user's exact uploaded promotional catalog page:
 * "SUPER OFERTA - EXTRACTOR O-RING SET X 4 PIEZAS - CODIGO S1840"
 * Allows displaying the exact flyer while dynamically modifying the price badge!
 */

export function generateOringFlyerDataUrl(price: number = 8400, label: string = 'PRECIO X BLISTER'): string {
  const formattedPrice = `$${price.toLocaleString('es-AR')}`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <!-- Background Gradients -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#3d2a14"/>
      <stop offset="60%" stop-color="#1c1309"/>
      <stop offset="100%" stop-color="#0a0704"/>
    </radialGradient>
    
    <linearGradient id="goldTextGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff8d6"/>
      <stop offset="40%" stop-color="#fbd926"/>
      <stop offset="80%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>

    <linearGradient id="silverTextGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>

    <linearGradient id="redBadgeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="45%" stop-color="#dc2626"/>
      <stop offset="85%" stop-color="#991b1b"/>
      <stop offset="100%" stop-color="#7f1d1d"/>
    </linearGradient>

    <linearGradient id="goldBorderGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>

    <linearGradient id="yellowCardGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#eab308"/>
    </linearGradient>

    <filter id="dropShadow3D" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="4" dy="10" stdDeviation="8" flood-color="#000000" flood-opacity="0.85"/>
    </filter>

    <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f59e0b" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Background: Workshop Garage with Wood Table -->
  <rect width="1000" height="1000" fill="url(#bgGrad)"/>
  
  <!-- Tool Pegboard Pattern in Background -->
  <g opacity="0.15">
    <pattern id="pegboard" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="3" fill="#cbd5e1"/>
    </pattern>
    <rect width="1000" height="700" fill="url(#pegboard)"/>
  </g>

  <!-- Wooden Workbench Surface -->
  <rect y="720" width="1000" height="280" fill="#2d1d0e"/>
  <rect y="720" width="1000" height="8" fill="#543719"/>
  <rect y="740" width="1000" height="4" fill="#1e1208" opacity="0.6"/>

  <!-- Left: Blister Packaging with 4 O-Ring Hook Tools -->
  <g transform="translate(45, 60)" filter="url(#dropShadow3D)">
    <!-- Red Header Card -->
    <rect x="0" y="0" width="380" height="780" rx="20" fill="#dc2626"/>
    <ellipse cx="190" cy="40" rx="35" ry="12" fill="#1e1b4b" opacity="0.8"/>
    <!-- 4pcs tag -->
    <rect x="300" y="20" width="60" height="30" rx="6" fill="#b91c1c" stroke="#fef08a" stroke-width="2"/>
    <text x="330" y="42" font-family="system-ui, sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">4pcs</text>
    
    <!-- Yellow Blister Background -->
    <rect x="0" y="100" width="380" height="680" rx="16" fill="url(#yellowCardGrad)"/>
    <rect x="0" y="100" width="380" height="40" fill="#0f172a"/>
    <text x="190" y="126" font-family="Impact, Arial Black, sans-serif" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="1">FOUR PIECE OIL SEAL HOOK</text>

    <!-- 4 Screwdriver / Hook Tools -->
    <!-- Tool 1: Straight Pick -->
    <g transform="translate(45, 140)">
      <line x1="25" y1="0" x2="25" y2="340" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>
      <path d="M 5 340 C 5 330 45 330 45 340 L 45 600 C 45 615 5 615 5 600 Z" fill="#0f172a"/>
      <path d="M 12 370 Q 25 350 38 370 L 38 580 Q 25 600 12 580 Z" fill="#eab308"/>
      <circle cx="25" cy="570" r="6" fill="#0f172a"/>
    </g>

    <!-- Tool 2: Full Hook -->
    <g transform="translate(125, 140)">
      <path d="M 40 10 Q 15 20 25 60 L 25 340" fill="none" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>
      <path d="M 5 340 C 5 330 45 330 45 340 L 45 600 C 45 615 5 615 5 600 Z" fill="#0f172a"/>
      <path d="M 12 370 Q 25 350 38 370 L 38 580 Q 25 600 12 580 Z" fill="#eab308"/>
      <circle cx="25" cy="570" r="6" fill="#0f172a"/>
    </g>

    <!-- Tool 3: 45 Degree Hook -->
    <g transform="translate(205, 140)">
      <path d="M 45 25 L 25 45 L 25 340" fill="none" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>
      <path d="M 5 340 C 5 330 45 330 45 340 L 45 600 C 45 615 5 615 5 600 Z" fill="#0f172a"/>
      <path d="M 12 370 Q 25 350 38 370 L 38 580 Q 25 600 12 580 Z" fill="#eab308"/>
      <circle cx="25" cy="570" r="6" fill="#0f172a"/>
    </g>

    <!-- Tool 4: 90 Degree Hook -->
    <g transform="translate(285, 140)">
      <path d="M 50 40 L 25 40 L 25 340" fill="none" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>
      <path d="M 5 340 C 5 330 45 330 45 340 L 45 600 C 45 615 5 615 5 600 Z" fill="#0f172a"/>
      <path d="M 12 370 Q 25 350 38 370 L 38 580 Q 25 600 12 580 Z" fill="#eab308"/>
      <circle cx="25" cy="570" r="6" fill="#0f172a"/>
    </g>

    <text x="360" y="765" font-family="system-ui, sans-serif" font-weight="bold" font-size="14" fill="#0f172a" text-anchor="end">MADE IN CHINA</text>
  </g>

  <!-- Right: Big 3D Title "SUPER OFERTA" -->
  <g transform="translate(700, 110)">
    <!-- 3D Shadow for SUPER -->
    <text x="4" y="4" font-family="Impact, 'Arial Black', sans-serif" font-size="108" fill="#000000" text-anchor="middle" font-weight="900" letter-spacing="2">SUPER</text>
    <text x="0" y="0" font-family="Impact, 'Arial Black', sans-serif" font-size="108" fill="url(#goldTextGrad)" stroke="#78350f" stroke-width="8" text-anchor="middle" font-weight="900" letter-spacing="2" filter="url(#glowGold)">SUPER</text>
    
    <!-- 3D Shadow for OFERTA -->
    <text x="4" y="112" font-family="Impact, 'Arial Black', sans-serif" font-size="118" fill="#000000" text-anchor="middle" font-weight="900" letter-spacing="3">OFERTA</text>
    <text x="0" y="108" font-family="Impact, 'Arial Black', sans-serif" font-size="118" fill="url(#silverTextGrad)" stroke="#1e293b" stroke-width="8" text-anchor="middle" font-weight="900" letter-spacing="3">OFERTA</text>
  </g>

  <!-- Product Title Banner: EXTRACTOR O-RING SET X 4 PIEZAS -->
  <g transform="translate(430, 325)">
    <rect x="0" y="0" width="530" height="120" rx="14" fill="#000000" stroke="#f59e0b" stroke-width="4" filter="url(#dropShadow3D)"/>
    <text x="265" y="50" font-family="Impact, 'Arial Black', sans-serif" font-size="52" fill="#fde047" text-anchor="middle" font-weight="900" letter-spacing="1">EXTRACTOR O-RING</text>
    <text x="265" y="102" font-family="Impact, 'Arial Black', sans-serif" font-size="48" fill="#ffffff" text-anchor="middle" font-weight="900" letter-spacing="1">SET X 4 PIEZAS</text>
  </g>

  <!-- 3 Gold Feature Badges -->
  <g transform="translate(440, 485)">
    <!-- Badge 1: Calidad Garantizada -->
    <g transform="translate(50, 0)">
      <circle cx="40" cy="40" r="38" fill="#1e1208" stroke="url(#goldBorderGrad)" stroke-width="5"/>
      <path d="M 28 40 L 36 48 L 52 32" fill="none" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="-35" y="85" width="150" height="42" rx="8" fill="url(#goldBorderGrad)"/>
      <text x="40" y="103" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">CALIDAD</text>
      <text x="40" y="119" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">GARANTIZADA</text>
    </g>

    <!-- Badge 2: Ideal Taller -->
    <g transform="translate(225, 0)">
      <circle cx="40" cy="40" r="38" fill="#1e1208" stroke="url(#goldBorderGrad)" stroke-width="5"/>
      <circle cx="40" cy="40" r="14" fill="none" stroke="#f59e0b" stroke-width="6"/>
      <rect x="-25" y="85" width="130" height="42" rx="8" fill="url(#goldBorderGrad)"/>
      <text x="40" y="103" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">IDEAL</text>
      <text x="40" y="119" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">PARA TALLER</text>
    </g>

    <!-- Badge 3: Venta Mayorista -->
    <g transform="translate(400, 0)">
      <circle cx="40" cy="40" r="38" fill="#1e1208" stroke="url(#goldBorderGrad)" stroke-width="5"/>
      <rect x="25" y="26" width="30" height="28" rx="4" fill="none" stroke="#f59e0b" stroke-width="5"/>
      <rect x="-25" y="85" width="130" height="42" rx="8" fill="url(#goldBorderGrad)"/>
      <text x="40" y="103" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">VENTA</text>
      <text x="40" y="119" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#000000" text-anchor="middle">MAYORISTA</text>
    </g>
  </g>

  <!-- 3 Action Photos: Mechanics using hooks -->
  <g transform="translate(430, 630)">
    <rect x="0" y="0" width="160" height="110" rx="8" fill="#334155" stroke="#f59e0b" stroke-width="3"/>
    <text x="80" y="60" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">Extracción O-Ring</text>
    <rect x="180" y="0" width="160" height="110" rx="8" fill="#334155" stroke="#f59e0b" stroke-width="3"/>
    <text x="260" y="60" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">Retenes de Aceite</text>
    <rect x="360" y="0" width="160" height="110" rx="8" fill="#334155" stroke="#f59e0b" stroke-width="3"/>
    <text x="440" y="60" font-family="system-ui" font-size="12" fill="#94a3b8" text-anchor="middle">Sellos y Mangueras</text>
  </g>

  <!-- Bottom Left: Cart Button CODIGO: S1840 -->
  <g transform="translate(35, 870)" filter="url(#dropShadow3D)">
    <rect x="0" y="0" width="340" height="85" rx="20" fill="#020617" stroke="#fbbf24" stroke-width="4"/>
    <!-- Yellow Cart Icon Box -->
    <rect x="8" y="8" width="75" height="69" rx="14" fill="#facc15"/>
    <path d="M 28 26 L 36 26 L 46 50 L 64 50 L 70 34 L 38 34" fill="none" stroke="#000000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="48" cy="58" r="4" fill="#000000"/>
    <circle cx="62" cy="58" r="4" fill="#000000"/>
    <text x="205" y="52" font-family="Impact, 'Arial Black', sans-serif" font-size="34" fill="#ffffff" text-anchor="middle" font-weight="900" letter-spacing="1">CODIGO: S1840</text>
  </g>

  <!-- Bottom Right: THE RESALE PRICE BADGE OVERLAY (MODIFIED PRICE) -->
  <g transform="translate(450, 760)" filter="url(#dropShadow3D)">
    <!-- Red 3D Curved Badge Background -->
    <path d="M 40 0 Q 250 -25 490 10 C 515 20 520 60 515 110 C 510 160 480 190 440 195 Q 240 215 30 180 C 5 175 -5 140 2 90 C 8 30 20 5 40 0 Z" fill="url(#redBadgeGrad)" stroke="url(#goldBorderGrad)" stroke-width="6"/>

    <!-- Shiny Highlight on Top -->
    <path d="M 45 10 Q 250 -12 480 20 C 470 50 40 40 45 10 Z" fill="#ffffff" opacity="0.35"/>

    <!-- Subtitle (e.g. PRECIO X BLISTER / SUPER OFERTA) -->
    <text x="260" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="2" filter="url(#dropShadow3D)">${label.toUpperCase()}</text>

    <!-- Main Dynamic Selling Price (e.g. $8.400) -->
    <text x="260" y="152" font-family="Impact, 'Arial Black', sans-serif" font-size="102" fill="#7f1d1d" stroke="#7f1d1d" stroke-width="12" text-anchor="middle" font-weight="900">${formattedPrice}</text>
    <text x="260" y="150" font-family="Impact, 'Arial Black', sans-serif" font-size="102" fill="url(#goldTextGrad)" stroke="#b45309" stroke-width="4" text-anchor="middle" font-weight="900" filter="url(#glowGold)">${formattedPrice}</text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
