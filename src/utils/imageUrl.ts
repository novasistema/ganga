/**
 * Helper to ensure product images load reliably in any environment
 * (desktop, mobile, iframes, Safari, Chrome) without CORS, mixed content, or hotlinking blocks.
 */
export const DEFAULT_PRODUCT_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="%23f8fafc"/><rect x="130" y="130" width="140" height="140" rx="16" fill="%23e2e8f0"/><path d="M170 210l25-25 35 35M160 235h80" stroke="%2394a3b8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="180" cy="170" r="10" fill="%2394a3b8"/><text x="200" y="305" text-anchor="middle" fill="%2364748b" font-family="system-ui,sans-serif" font-size="13" font-weight="700">Foto de Producto</text></svg>';

/**
 * Helper to ensure product images load reliably in any environment.
 * Direct URLs are preferred for ultra-fast CDN loading.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }

  // Already local data URI, blob, or internal proxy route
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/image-proxy')
  ) {
    return trimmed;
  }

  // Protocol relative
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // Normal HTTP/HTTPS direct URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return trimmed;
}

export function getProxyImageUrl(url: string): string {
  if (!url || !url.startsWith('http')) return url || DEFAULT_PRODUCT_PLACEHOLDER;
  return `/api/image-proxy?url=${encodeURIComponent(url.trim())}`;
}

/**
 * Clean fallback image for categories
 */
export function getCategoryFallbackImage(categoryName?: string): string {
  const low = (categoryName || '').toLowerCase();
  if (low.includes('auricular') || low.includes('audio') || low.includes('sonido')) {
    return '/api/image-proxy?url=https%3A%2F%2Finovaarg.com%2Fwp-content%2Fuploads%2F2026%2F02%2FIMG-20220218-WA0085.webp';
  }
  if (low.includes('reloj') || low.includes('smartwatch')) {
    return '/api/image-proxy?url=https%3A%2F%2Finovaarg.com%2Fwp-content%2Fuploads%2F2026%2F02%2FWhatsApp-Image-2025-09-17-at-10.58.17-AM-scaled-1.webp';
  }
  if (low.includes('joyero') || low.includes('organizador') || low.includes('alhajero')) {
    return '/api/image-proxy?url=https%3A%2F%2Finovaarg.com%2Fwp-content%2Fuploads%2F2026%2F07%2FWhatsApp-Image-2026-07-10-at-6.22.13-PM-1.webp';
  }
  if (low.includes('herramienta') || low.includes('inflador') || low.includes('compresor')) {
    return '/api/image-proxy?url=https%3A%2F%2Finovaarg.com%2Fwp-content%2Fuploads%2F2026%2F10%2FInflador-portatil-con-manometro-analogico-2.png';
  }
  if (low.includes('iluminac') || low.includes('velador') || low.includes('foco') || low.includes('lampara') || low.includes('guirnalda')) {
    return '/api/image-proxy?url=https%3A%2F%2Finovaarg.com%2Fwp-content%2Fuploads%2F2026%2F07%2F10-1.webp';
  }
  if (low.includes('adaptador') || low.includes('viaje') || low.includes('usb') || low.includes('cargador')) {
    return '/api/image-proxy?url=https%3A%2F%2Finovaarg.com%2Fwp-content%2Fuploads%2F2026%2F02%2Fadaptador-viajero.webp';
  }
  return DEFAULT_PRODUCT_PLACEHOLDER;
}
