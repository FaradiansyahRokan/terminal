export default async function handler(req, res) {
  // Ambil query parameter dari URL (misal: ?q=BTC-USD)
  const { q } = req.query;
  const targetUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${q}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        // 🔥 Header Penyamaran agar tidak diblokir Yahoo
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/'
      }
    });

    if (!response.ok) throw new Error('Yahoo Error');
    
    const data = await response.json();
    
    // Set Header agar browser kamu bisa membacanya (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Yahoo Search' });
  }
}