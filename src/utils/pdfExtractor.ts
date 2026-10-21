import * as pdfjsLib from 'pdfjs-dist';
import { PriceStampConfig } from '../types';

// Configure worker src with fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('Could not set workerSrc from unpkg, will use embedded fallback:', err);
  }
}

export interface ExtractedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Splits any uploaded PDF file into individual high-resolution JPG images (one per page).
 */
export async function splitPdfToJpgPages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedPdfPage[]> {
  const arrayBuffer = await file.arrayBuffer();

  // Load document
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const extractedPages: ExtractedPdfPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, numPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    // Render at crisp 2x resolution for printing/sharing
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!ctx) continue;

    // Fill white background before rendering
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({
      canvasContext: ctx,
      viewport,
      canvas: canvas
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    extractedPages.push({
      pageNumber: pageNum,
      dataUrl,
      width: viewport.width,
      height: viewport.height
    });
  }

  return extractedPages;
}

/**
 * Stamps a new price badge directly onto a catalog flyer image, covering the supplier's original printed price.
 * Outputs a real, high-resolution JPG with the new price cleanly baked into the pixels.
 */
export async function stampPriceOnFlyerImage(
  imageUrl: string,
  price: number,
  config: Partial<PriceStampConfig> = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(imageUrl);
      }

      canvas.width = img.naturalWidth || img.width || 1200;
      canvas.height = img.naturalHeight || img.height || 1200;

      // Draw original flyer image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const position = config.position || 'bottom-right';
      const style = config.badgeStyle || 'red-gold';
      const badgeText = config.badgeText || 'PRECIO X BLISTER';
      const formattedPrice = `$ ${price.toLocaleString('es-AR')}`;

      // Calculate dimensions proportional to canvas
      const badgeW = canvas.width * 0.44;
      const badgeH = canvas.height * 0.17;
      let badgeX = canvas.width - badgeW - (canvas.width * 0.03);
      let badgeY = canvas.height - badgeH - (canvas.height * 0.03);

      if (position === 'bottom-center') {
        badgeX = (canvas.width - badgeW) / 2;
        badgeY = canvas.height - badgeH - (canvas.height * 0.03);
      } else if (position === 'bottom-left') {
        badgeX = canvas.width * 0.03;
        badgeY = canvas.height - badgeH - (canvas.height * 0.03);
      } else if (position === 'top-right') {
        badgeX = canvas.width - badgeW - (canvas.width * 0.03);
        badgeY = canvas.height * 0.04;
      } else if (position === 'top-left') {
        badgeX = canvas.width * 0.03;
        badgeY = canvas.height * 0.04;
      }

      const radius = 24;

      // Draw drop shadow for 3D depth
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 10;

      // Draw badge background
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);

      if (style === 'red-gold') {
        const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
        grad.addColorStop(0, '#e11d48'); // Rose-600
        grad.addColorStop(0.5, '#b91c1c'); // Red-700
        grad.addColorStop(1, '#881337'); // Rose-900
        ctx.fillStyle = grad;
      } else if (style === 'yellow-black') {
        const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
        grad.addColorStop(0, '#fde047'); // Yellow-300
        grad.addColorStop(1, '#ca8a04'); // Yellow-600
        ctx.fillStyle = grad;
      } else if (style === 'dark-neon') {
        const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
      } else {
        const grad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH);
        grad.addColorStop(0, '#2563eb');
        grad.addColorStop(1, '#1e3a8a');
        ctx.fillStyle = grad;
      }

      ctx.fill();
      ctx.restore();

      // Draw metallic border
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
      ctx.lineWidth = 6;
      if (style === 'red-gold') {
        const borderGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
        borderGrad.addColorStop(0, '#fef08a');
        borderGrad.addColorStop(0.5, '#eab308');
        borderGrad.addColorStop(1, '#ca8a04');
        ctx.strokeStyle = borderGrad;
      } else if (style === 'yellow-black') {
        ctx.strokeStyle = '#000000';
      } else if (style === 'dark-neon') {
        ctx.strokeStyle = '#10b981';
      } else {
        ctx.strokeStyle = '#93c5fd';
      }
      ctx.stroke();
      ctx.restore();

      // Draw subtle top highlight shine
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(badgeX + 6, badgeY + 4, badgeW - 12, badgeH * 0.42, [radius - 4, radius - 4, 0, 0]);
      const shineGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX, badgeY + badgeH * 0.42);
      shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      shineGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      ctx.fillStyle = shineGrad;
      ctx.fill();
      ctx.restore();

      // Subtitle / Label (e.g. PRECIO X BLISTER)
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelFontSize = Math.round(badgeH * 0.22);
      ctx.font = `900 ${labelFontSize}px system-ui, -apple-system, sans-serif`;

      if (style === 'red-gold') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
      } else if (style === 'yellow-black') {
        ctx.fillStyle = '#000000';
      } else if (style === 'dark-neon') {
        ctx.fillStyle = '#34d399';
      } else {
        ctx.fillStyle = '#ffffff';
      }

      ctx.fillText(badgeText.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH * 0.28);
      ctx.restore();

      // Main Bold Price (e.g. $ 8.400)
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const priceFontSize = Math.round(badgeH * 0.52);
      ctx.font = `900 ${priceFontSize}px Impact, "Arial Black", system-ui, sans-serif`;

      if (style === 'red-gold') {
        // Yellow 3D text with black outline like the flyer
        ctx.lineWidth = Math.round(priceFontSize * 0.12);
        ctx.strokeStyle = '#7f1d1d';
        ctx.strokeText(formattedPrice, badgeX + badgeW / 2, badgeY + badgeH * 0.68);

        const textGrad = ctx.createLinearGradient(
          badgeX,
          badgeY + badgeH * 0.45,
          badgeX,
          badgeY + badgeH * 0.9
        );
        textGrad.addColorStop(0, '#ffffff');
        textGrad.addColorStop(0.35, '#fde047');
        textGrad.addColorStop(1, '#eab308');
        ctx.fillStyle = textGrad;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
      } else if (style === 'yellow-black') {
        ctx.fillStyle = '#000000';
      } else if (style === 'dark-neon') {
        ctx.fillStyle = '#10b981';
      } else {
        ctx.fillStyle = '#fde047';
      }

      ctx.fillText(formattedPrice, badgeX + badgeW / 2, badgeY + badgeH * 0.68);
      ctx.restore();

      const bakedJpg = canvas.toDataURL('image/jpeg', 0.92);
      resolve(bakedJpg);
    };

    img.onerror = () => {
      console.warn('Could not load image into canvas for stamping:', imageUrl);
      resolve(imageUrl);
    };

    img.src = imageUrl;
  });
}

/**
 * Downloads a dataUrl image directly in the user browser
 */
export function downloadDataUrlAsImage(dataUrl: string, fileName: string = 'folleto-oferta.jpg') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
