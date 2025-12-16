export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/finnhub/, '');
  const targetUrl = `https://finnhub.io/api/v1${path}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Finnhub Proxy Failed' });
  }
}