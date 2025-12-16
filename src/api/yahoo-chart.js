// api/yahoo-chart.js

export default async function handler(req, res) {
  // Setup CORS agar bisa diakses dari mana saja
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Ambil parameter dari Query (?symbol=BTC-USD&interval=...)
  const { symbol, interval, range } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    // 2. Decode symbol (PENTING: mengubah %5E jadi ^, %3D jadi =)
    const decodedSymbol = decodeURIComponent(symbol);

    // 3. Susun URL Yahoo
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${decodedSymbol}?interval=${interval || '1d'}&range=${range || '1d'}`;

    // 4. Fetch ke Yahoo dengan Header Penyamaran
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      }
    });

    if (!response.ok) {
      // Jika Yahoo 404, kita kirim balik 404 tapi dengan pesan JSON
      return res.status(response.status).json({ error: `Yahoo reject: ${response.statusText}` });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}