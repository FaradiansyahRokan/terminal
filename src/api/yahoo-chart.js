export default async function handler(req, res) {
  // Ambil parameter symbol, interval, range
  const { symbol, interval, range } = req.query;
  
  // Tangkap path parameter jika URL berbentuk /api/yahoo-chart/SYMBOL
  // Vercel kadang melemparkan path sisa ke query object
  const targetSymbol = symbol || req.query[0] || 'BTC-USD'; 

  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${targetSymbol}?interval=${interval}&range=${range}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      }
    });

    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch Yahoo Chart' });
  }
}