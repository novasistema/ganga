import heroImage from '../assets/images/nuvoh_hero_catalog_1791905594543.jpg';
import hornoImage from '../assets/images/nuvoh_horno_electrico_1791905594716.jpg';
import cafeteraImage from '../assets/images/nuvoh_cafetera_expresso_1791905596557.jpg';
import taladroImage from '../assets/images/nuvoh_taladro_maletin_1791905596424.jpg';
import sillaImage from '../assets/images/nuvoh_silla_gamer_1791905596483.jpg';

export const ASSET_IMAGES = {
  hero: heroImage,
  horno: hornoImage,
  cafetera: cafeteraImage,
  taladro: taladroImage,
  silla: sillaImage,
};

/**
 * Resolves any image URL to a valid, production-ready asset URL.
 * Handles Vite bundler asset paths, legacy Firestore /src/assets/ paths,
 * public directory paths, and external HTTP/HTTPS URLs.
 */
export function resolveProductImage(url?: string | null, category?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getCategoryFallback(category);
  }

  const trimmed = url.trim();

  // Match known filenames
  if (trimmed.includes('nuvoh_hero_catalog')) return heroImage;
  if (trimmed.includes('nuvoh_horno_electrico')) return hornoImage;
  if (trimmed.includes('nuvoh_cafetera_expresso')) return cafeteraImage;
  if (trimmed.includes('nuvoh_taladro_maletin')) return taladroImage;
  if (trimmed.includes('nuvoh_silla_gamer')) return sillaImage;

  // External URLs or data URIs
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Handle /src/assets/images/ or /assets/images/
  if (trimmed.startsWith('/src/assets/images/')) {
    const filename = trimmed.replace('/src/assets/images/', '');
    if (filename.includes('horno')) return hornoImage;
    if (filename.includes('cafetera')) return cafeteraImage;
    if (filename.includes('taladro')) return taladroImage;
    if (filename.includes('silla')) return sillaImage;
    if (filename.includes('hero')) return heroImage;
    return `/images/${filename}`;
  }

  if (trimmed.startsWith('/assets/images/')) {
    const filename = trimmed.replace('/assets/images/', '');
    if (filename.includes('horno')) return hornoImage;
    if (filename.includes('cafetera')) return cafeteraImage;
    if (filename.includes('taladro')) return taladroImage;
    if (filename.includes('silla')) return sillaImage;
    if (filename.includes('hero')) return heroImage;
    return `/images/${filename}`;
  }

  return trimmed;
}

/**
 * Fallback image based on product category
 */
export function getCategoryFallback(category?: string): string {
  if (!category) return heroImage;
  const lower = category.toLowerCase();
  if (lower.includes('cocina') || lower.includes('electro')) return hornoImage;
  if (lower.includes('herramienta') || lower.includes('ferreter')) return taladroImage;
  if (lower.includes('mueble') || lower.includes('decor')) return sillaImage;
  if (lower.includes('tecno') || lower.includes('cuidado') || lower.includes('hogar')) return heroImage;
  return heroImage;
}

/**
 * Safe image onError handler to prevent broken image icons
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = event.currentTarget;
  const fallback = getCategoryFallback(category);
  if (target.src !== fallback) {
    target.onerror = null; // Prevent infinite loop if fallback fails
    target.src = fallback;
  }
}
