export default async function handler(req, res) {
  // CORS Headers (Wajib agar bisa diakses dari frontend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { symbol, interval, range } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // 1. Decode Symbol (Mengubah %5E jadi ^, %3D jadi =)
    // Ini krusial untuk Index (^GSPC) dan Forex (EURUSD=X)
    const decodedSymbol = decodeURIComponent(symbol);

    // 2. Gunakan Range default yang aman jika tidak ada
    const queryRange = range || '1mo'; 
    const queryInterval = interval || '1d';

    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${decodedSymbol}?interval=${queryInterval}&range=${queryRange}`;

    // 3. Fetch dengan Header Penyamaran
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      // Jangan return error 500/404, return JSON kosong saja biar frontend gak crash
      return res.status(200).json({ chart: { result: null, error: { code: response.status, description: response.statusText } } });
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(200).json({ chart: { result: null, error: error.message } });
  }
}