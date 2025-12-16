export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Ambil parameter dari Query String
  const { symbol, interval, range } = req.query;

  if (!symbol) return res.status(400).json({ error: 'Symbol missing' });

  try {
    const decodedSymbol = decodeURIComponent(symbol);
    // URL Yahoo V8
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${decodedSymbol}?interval=${interval||'1d'}&range=${range||'1d'}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Yahoo Proxy Failed' });
  }
}