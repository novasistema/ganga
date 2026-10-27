export default async function handler(req: any, res: any) {
  // Set full CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const rawUrl = req.query?.url as string;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).send('URL requerida');
  }

  const targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return res.status(400).send('URL inválida');
  }

  try {
    let referer = '';
    try {
      referer = `${new URL(targetUrl).protocol}//${new URL(targetUrl).hostname}/`;
    } catch {}

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);

    if (upstream.ok) {
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await upstream.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.status(200).send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    // Continue to fallback
  }

  // Fallback redirect to weserv.nl CORS proxy
  return res.redirect(302, `https://images.weserv.nl/?url=${encodeURIComponent(targetUrl)}&default=1`);
}
