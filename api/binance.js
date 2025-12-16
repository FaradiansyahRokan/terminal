export default async function handler(req, res) {
  const requestUrl = req.url;
  const path = requestUrl.replace('/api/binance', '');
  const targetUrl = `https://data-api.binance.vision/api/v3${path}`;

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Binance Proxy Error' });
  }
}