/**
 * Helper to ensure product images load reliably in any environment
 * (desktop, mobile, iframes, Safari, Chrome) without CORS, mixed content, or hotlinking blocks.
 */
export function resolveImageUrl(url?: string | null): string {
  const fallback =
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  // Already local data URI, blob, or internal proxy route
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/image-proxy')
  ) {
    return trimmed;
  }

  // If the image is hosted on inovaarg.com or any WordPress uploads folder,
  // route it through our high-speed server image proxy to guarantee 100% bypass of hotlink firewalls and CORS restrictions.
  if (
    trimmed.includes('inovaarg.com') ||
    trimmed.includes('/wp-content/uploads/') ||
    trimmed.includes('inova')
  ) {
    return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
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
  return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
}
