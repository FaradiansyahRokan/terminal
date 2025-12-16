export default async function handler(req, res) {
  // Kita perlu merekonstruksi URL Finnhub asli
  // URL Masuk: /api/finnhub/stock/profile2?symbol=AAPL&token=...
  // Target: https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=...
  
  // Ambil URL request penuh dan ganti base-nya
  const requestUrl = req.url; 
  // Hapus '/api/finnhub' dari path
  const path = requestUrl.replace('/api/finnhub', '');
  
  const targetUrl = `https://finnhub.io/api/v1${path}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Finnhub Proxy Error' });
  }
}