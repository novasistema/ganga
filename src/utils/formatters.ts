import { Product } from '../types';

export const formatCurrency = (amount: number | undefined | null, withCurrencySuffix = true): string => {
  const numericAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : (Number(amount) || 0);
  try {
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(numericAmount);

    return withCurrencySuffix ? `${formatted} ARS` : formatted;
  } catch {
    return withCurrencySuffix ? `$ ${Math.round(numericAmount).toLocaleString('es-AR')} ARS` : `$ ${Math.round(numericAmount).toLocaleString('es-AR')}`;
  }
};

export const calculateUnitPrice = (product: Product, quantity: number): number => {
  if (quantity >= 100 && product.priceTiers.tier100) {
    return product.priceTiers.tier100;
  }
  if (quantity >= 10 && product.priceTiers.tier10) {
    return product.priceTiers.tier10;
  }
  if (quantity >= 5 && product.priceTiers.tier5) {
    return product.priceTiers.tier5;
  }
  return product.priceUnit;
};

export const generateWhatsAppLink = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};
