export default async function handler(req, res) {
  // Ambil sisa path setelah /api/binance/
  // req.url misal: /api/binance/klines?symbol=BTC...
  const path = req.url.replace(/^\/api\/binance/, '');
  const targetUrl = `https://data-api.binance.vision/api/v3${path}`;

  try {
    const response = await fetch(targetUrl);
    
    // Handle jika Binance error
    if (!response.ok) {
        return res.status(response.status).json({ error: `Binance Error ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy Error' });
  }
}