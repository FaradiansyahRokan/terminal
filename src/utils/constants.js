export const THEME = {
  bg: "#0D0D0D",    // Dark Background
  panel: "#1E1E1E", // Dark Panel/Card Background
  border: "#333333", // Strong Industrial Border
  accent: "#FFB800", // Premium Amber/Muted Gold (Main Accent)
  success: "#00FF94", // Neon Green (Buy/Up Signal)
  danger: "#FF2A6D",  // Neon Red/Pink (Sell/Down Signal)
  warning: "#FF7A00", // Bright Orange (Warning/Neutral)
};

export const MARKET_CATEGORIES = {
  CRYPTO: 'CRYPTO',
  STOCKS: 'STOCKS',
  FOREX: 'FOREX',
  INDICES: 'INDICES'
};

export const ASSET_LISTS = {
  STOCKS: [
  // === Big Tech / Magnificent 7 ===
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'GOOGL', name: 'Alphabet (Google)' },
  { symbol: 'AMZN', name: 'Amazon.com' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'TSLA', name: 'Tesla Inc' },

  // === Semiconductors / AI ===
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', name: 'Intel Corp' },
  { symbol: 'AVGO', name: 'Broadcom Inc' },
  { symbol: 'TSM', name: 'TSMC' },
  { symbol: 'ASML', name: 'ASML Holding' },
  { symbol: 'SMCI', name: 'Super Micro Computer' },

  // === Finance / Crypto Exposure ===
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'GS', name: 'Goldman Sachs' },
  { symbol: 'BAC', name: 'Bank of America' },
  { symbol: 'COIN', name: 'Coinbase Global' },
  { symbol: 'MSTR', name: 'MicroStrategy' },

  // === Growth / Retail Favorite / Viral ===
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'SNOW', name: 'Snowflake' },
  { symbol: 'SHOP', name: 'Shopify' },
  { symbol: 'UBER', name: 'Uber Technologies' },
  { symbol: 'RBLX', name: 'Roblox' },
  { symbol: 'HOOD', name: 'Robinhood' }
],
  FOREX: [
  // === Major Pairs ===
  { symbol: 'EURUSD=X', name: 'EUR/USD' },
  { symbol: 'GBPUSD=X', name: 'GBP/USD' },
  { symbol: 'USDJPY=X', name: 'USD/JPY' },
  { symbol: 'USDCHF=X', name: 'USD/CHF' },
  { symbol: 'AUDUSD=X', name: 'AUD/USD' },
  { symbol: 'NZDUSD=X', name: 'NZD/USD' },
  { symbol: 'USDCAD=X', name: 'USD/CAD' },

  // === Cross Pairs ===
  { symbol: 'EURJPY=X', name: 'EUR/JPY' },
  { symbol: 'GBPJPY=X', name: 'GBP/JPY' },
  { symbol: 'EURAUD=X', name: 'EUR/AUD' },
  { symbol: 'GBPAUD=X', name: 'GBP/AUD' },

  // === Emerging Market ===
  { symbol: 'USDIDR=X', name: 'USD/IDR' },
  { symbol: 'USDCNH=X', name: 'USD/CNH' },
  { symbol: 'USDINR=X', name: 'USD/INR' }
],
  // Finnhub Free susah akses Indices (SPX, DJI), kita pakai ETF populer sebagai pengganti Indices
  INDICES: [
  // === US Market Core ===
  { symbol: 'SPY', name: 'S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
  { symbol: 'DIA', name: 'Dow Jones ETF' },
  { symbol: 'IWM', name: 'Russell 2000 ETF' },

  // === Volatility / Sentiment ===
  { symbol: 'VXX', name: 'VIX Short-Term ETN' },

  // === Sector ETFs ===
  { symbol: 'XLK', name: 'Technology Select Sector' },
  { symbol: 'XLF', name: 'Financial Select Sector' },
  { symbol: 'XLE', name: 'Energy Select Sector' },

  // === Commodities (Proxy ETF) ===
  { symbol: 'GLD', name: 'Gold Trust' },
  { symbol: 'SLV', name: 'Silver Trust' },
  { symbol: 'USO', name: 'United States Oil Fund' },

  // === Crypto ETF (Viral banget) ===
  { symbol: 'IBIT', name: 'iShares Bitcoin Trust' },
  { symbol: 'BITO', name: 'Bitcoin Strategy ETF' }
],

  MAJOR_MARKET: [
        // Crypto (Format Binance)
        { symbol: 'BTC', name: 'Bitcoin', source: 'crypto' },
        { symbol: 'ETH', name: 'Ethereum', source: 'crypto' },
        { symbol: 'BNB', name: 'BNB', source: 'crypto' },
        
        // Stock/Saham (Format Yahoo/Finnhub)
        { symbol: 'AAPL', name: 'Apple', source: 'stock' },
        { symbol: 'TSLA', name: 'Tesla', source: 'stock' },

        // Index (Format Yahoo)
        { symbol: '^GSPC', name: 'S&P 500', source: 'yahoo' },
        
        // Forex (Format Yahoo)
        { symbol: 'EURUSD=X', name: 'EUR/USD', source: 'yahoo' },
        { symbol: 'USDIDR=X', name: 'USD/IDR', source: 'yahoo' },
    ],
};

export const formatNumber = (num, decimals = 2) => {
  if (!num) return '0.00';
  return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};


export const formatCompact = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);
};


