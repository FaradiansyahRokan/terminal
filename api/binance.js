export default async function handler(req, res) {
  // Ambil path setelah /api/binance
  // Contoh req.url: /api/binance/klines?symbol=BTC...
  const path = req.url.replace(/^\/api\/binance/, '');
  const targetUrl = `https://data-api.binance.vision/api/v3${path}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Binance Proxy Failed' });
  }
}