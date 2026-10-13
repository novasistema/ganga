// Utilities for product cleaning, title sanitization, and bulk profit calculation

/**
 * Removes any trace of "Inova" or "InovaArg" from product titles and descriptions.
 */
export const cleanProductTitle = (title: string): string => {
  if (!title) return '';
  return title
    .replace(/\binovaarg\.com\b/gi, '')
    .replace(/\binovaarg\b/gi, '')
    .replace(/\b(\-|\/|\|)\s*inova\b/gi, '')
    .replace(/\binova\s*(\-|\/|\|)\b/gi, '')
    .replace(/\binova\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-\/\:\.\,]+|[\s\-\/\:\.\,]+$/g, '')
    .trim();
};

/**
 * Sanitizes SKUs so they don't contain wholesale/competitor vendor marks like INOVA- or INV-
 */
export const cleanProductSku = (sku: string): string => {
  if (!sku) return `ART-${Math.floor(1000 + Math.random() * 9000)}`;
  let cleaned = sku
    .replace(/^INOVA-/i, 'ART-')
    .replace(/^INV-/i, 'ART-')
    .trim();
  
  if (!cleaned || cleaned.toLowerCase() === 'inova') {
    return `ART-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return cleaned;
};

/**
 * Cleans supplier name to not expose InovaArg to end users or inventory branding
 */
export const cleanSupplierName = (supplier?: string): string => {
  if (!supplier) return 'Mayorista Central';
  if (/inova/i.test(supplier)) {
    return 'Mayorista Central';
  }
  return supplier.split('(')[0].trim() || 'Mayorista Central';
};

export interface BulkProfitConfig {
  type: 'percent' | 'fixed' | 'mixed';
  percentValue: number;        // e.g. 50 (for 50% profit margin over cost)
  fixedValueARS: number;       // e.g. 5000 (for +$5,000 ARS fixed profit)
  rounding: 'none' | '10' | '100' | '1000';
  targetScope: 'all' | 'selected' | 'category' | 'source';
  targetCategory?: string;
  targetSourceId?: string;
}

/**
 * Calculates selling price and profit in ARS by adding profit to cost price
 */
export const calculatePriceWithProfit = (
  costARS: number,
  config: Pick<BulkProfitConfig, 'type' | 'percentValue' | 'fixedValueARS' | 'rounding'>
): {
  finalPriceARS: number;
  profitARS: number;
  effectiveMarginPercent: number;
} => {
  const baseCost = Math.max(0, Number(costARS) || 0);
  let profit = 0;

  if (config.type === 'percent') {
    profit = baseCost * ((Number(config.percentValue) || 0) / 100);
  } else if (config.type === 'fixed') {
    profit = Math.max(0, Number(config.fixedValueARS) || 0);
  } else if (config.type === 'mixed') {
    const percentPart = baseCost * ((Number(config.percentValue) || 0) / 100);
    const fixedPart = Math.max(0, Number(config.fixedValueARS) || 0);
    profit = percentPart + fixedPart;
  }

  let finalPrice = baseCost + profit;

  // Apply commercial rounding
  if (config.rounding === '10') {
    finalPrice = Math.round(finalPrice / 10) * 10;
  } else if (config.rounding === '100') {
    finalPrice = Math.round(finalPrice / 100) * 100;
  } else if (config.rounding === '1000') {
    finalPrice = Math.round(finalPrice / 1000) * 1000;
  } else {
    finalPrice = Math.round(finalPrice);
  }

  // Recalculate actual profit after rounding
  const finalProfitARS = Math.max(0, finalPrice - baseCost);
  const effectiveMargin = baseCost > 0 ? Math.round((finalProfitARS / baseCost) * 100) : 0;

  return {
    finalPriceARS: finalPrice,
    profitARS: finalProfitARS,
    effectiveMarginPercent: effectiveMargin,
  };
};

/**
 * Returns the source website info and URL for ordering the product
 */
export const getProductSourceWeb = (product: {
  sourceWebUrl?: string;
  sourceWebName?: string;
  supplier?: string;
  description?: string;
}): {
  name: string;
  url: string | null;
  domain: string | null;
} => {
  // 1. Direct field if present
  if (product.sourceWebUrl && product.sourceWebUrl.startsWith('http')) {
    let domain = '';
    try {
      domain = new URL(product.sourceWebUrl).hostname.replace(/^www\./, '');
    } catch {
      domain = product.sourceWebUrl;
    }
    return {
      name: product.sourceWebName || cleanSupplierName(product.supplier) || domain,
      url: product.sourceWebUrl,
      domain,
    };
  }

  // 2. Check if description has an extracted URL
  if (product.description) {
    const urlMatch = product.description.match(/https?:\/\/[^\s,]+/i);
    if (urlMatch) {
      const foundUrl = urlMatch[0];
      let domain = '';
      try {
        domain = new URL(foundUrl).hostname.replace(/^www\./, '');
      } catch {
        domain = foundUrl;
      }
      return {
        name: product.sourceWebName || domain,
        url: foundUrl,
        domain,
      };
    }
  }

  // 3. Fallback based on supplier or default wholesalers
  const supplier = product.supplier || '';
  if (/global\s*tech/i.test(supplier)) {
    return {
      name: 'Global Tech Mayorista',
      url: 'https://globaltechmayorista.com.ar/',
      domain: 'globaltechmayorista.com.ar',
    };
  }

  if (/once|bazar/i.test(supplier)) {
    return {
      name: 'Distribuidora Once Bazar',
      url: 'https://distribuidoraoncebazar.com.ar/',
      domain: 'distribuidoraoncebazar.com.ar',
    };
  }

  if (/inova|central|mayorista/i.test(supplier)) {
    return {
      name: 'Mayorista Nacional (Central)',
      url: 'https://inovaarg.com/',
      domain: 'inovaarg.com',
    };
  }

  if (supplier && supplier !== 'Mayorista Central') {
    return {
      name: supplier,
      url: null,
      domain: null,
    };
  }

  return {
    name: 'Mayorista Nacional (Central)',
    url: 'https://inovaarg.com/',
    domain: 'inovaarg.com',
  };
};
