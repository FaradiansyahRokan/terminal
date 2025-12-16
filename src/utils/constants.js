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
  // --- The Magnificent 7 (Market Movers) ---
    { symbol: 'AAPL', name: 'Apple Inc' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'NVIDIA Corp' },
    { symbol: 'GOOGL', name: 'Alphabet (Google)' },
    { symbol: 'AMZN', name: 'Amazon.com' },
    { symbol: 'META', name: 'Meta Platforms' },
    { symbol: 'TSLA', name: 'Tesla Inc' },

    // --- AI & Semiconductors (High Growth) ---
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'INTC', name: 'Intel Corp' },
    { symbol: 'AVGO', name: 'Broadcom Inc' },
    { symbol: 'TSM', name: 'TSMC' },
    { symbol: 'ASML', name: 'ASML Holding' },
    { symbol: 'SMCI', name: 'Super Micro Computer' },
    { symbol: 'ARM', name: 'Arm Holdings' },
    { symbol: 'QCOM', name: 'Qualcomm' },
    { symbol: 'MU', name: 'Micron Technology' },

    // --- Crypto Proxy & Fintech (High Beta) ---
    { symbol: 'MSTR', name: 'MicroStrategy' },
    { symbol: 'COIN', name: 'Coinbase Global' },
    { symbol: 'MARA', name: 'Marathon Digital' },
    { symbol: 'RIOT', name: 'Riot Platforms' },
    { symbol: 'PYPL', name: 'PayPal' },
    { symbol: 'SQ', name: 'Block (Square)' },
    { symbol: 'HOOD', name: 'Robinhood' },

    // --- Chinese Tech (ADRs) ---
    { symbol: 'BABA', name: 'Alibaba Group' },
    { symbol: 'PDD', name: 'PDD Holdings (Temu)' },
    { symbol: 'JD', name: 'JD.com' },
    { symbol: 'NIO', name: 'NIO Inc' },
    { symbol: 'BIDU', name: 'Baidu' },

    // --- SaaS & Cloud (Volatile) ---
    { symbol: 'NFLX', name: 'Netflix' },
    { symbol: 'PLTR', name: 'Palantir Technologies' },
    { symbol: 'SNOW', name: 'Snowflake' },
    { symbol: 'SHOP', name: 'Shopify' },
    { symbol: 'CRM', name: 'Salesforce' },
    { symbol: 'ADBE', name: 'Adobe' },
    { symbol: 'CRWD', name: 'CrowdStrike' },
    { symbol: 'PANW', name: 'Palo Alto Networks' },

    // --- Traditional / Dow Jones Giants ---
    { symbol: 'JPM', name: 'JPMorgan Chase' },
    { symbol: 'V', name: 'Visa' },
    { symbol: 'MA', name: 'Mastercard' },
    { symbol: 'KO', name: 'Coca-Cola' },
    { symbol: 'PEP', name: 'PepsiCo' },
    { symbol: 'MCD', name: 'McDonald\'s' },
    { symbol: 'DIS', name: 'Walt Disney' },
    { symbol: 'NKE', name: 'Nike' },
    { symbol: 'BA', name: 'Boeing' },
    { symbol: 'BBCA.JK', name: 'Bank Central Asia' },
    { symbol: 'BBRI.JK', name: 'Bank Rakyat Indonesia' },
    { symbol: 'BMRI.JK', name: 'Bank Mandiri' },
    { symbol: 'BBNI.JK', name: 'Bank Negara Indonesia' },

    // --- Commodities & Energy ---
    { symbol: 'ADRO.JK', name: 'Adaro Energy' },
    { symbol: 'PTBA.JK', name: 'Bukit Asam' },
    { symbol: 'PGAS.JK', name: 'Perusahaan Gas Negara' },
    { symbol: 'ANTM.JK', name: 'Aneka Tambang' },
    { symbol: 'MDKA.JK', name: 'Merdeka Copper Gold' },

    // --- Telco & Tech ---
    { symbol: 'TLKM.JK', name: 'Telkom Indonesia' },
    { symbol: 'GOTO.JK', name: 'GoTo Gojek Tokopedia' },
    { symbol: 'ISAT.JK', name: 'Indosat Ooredoo' },

    // --- Consumer & Auto ---
    { symbol: 'ASII.JK', name: 'Astra International' },
    { symbol: 'UNVR.JK', name: 'Unilever Indonesia' },
    { symbol: 'ICBP.JK', name: 'Indofood CBP' }
],
  FOREX: [
  // === Major Pairs ===
  { symbol: 'EURUSD=X', name: 'EUR/USD' },
    { symbol: 'GBPUSD=X', name: 'GBP/USD' },
    { symbol: 'USDJPY=X', name: 'USD/JPY' },
    { symbol: 'USDCHF=X', name: 'USD/CHF' },
    { symbol: 'AUDUSD=X', name: 'AUD/USD' },
    { symbol: 'USDCAD=X', name: 'USD/CAD' },

    // --- Cross Pairs (Volatile) ---
    { symbol: 'GBPJPY=X', name: 'GBP/JPY (The Beast)' },
    { symbol: 'EURJPY=X', name: 'EUR/JPY' },
    { symbol: 'AUDJPY=X', name: 'AUD/JPY' },
    { symbol: 'EURAUD=X', name: 'EUR/AUD' },

    // --- Exotic / Emerging (High Spread) ---
    { symbol: 'USDIDR=X', name: 'USD/IDR (Rupiah)' },
    { symbol: 'USDCNH=X', name: 'USD/CNH (Yuan)' },
    { symbol: 'USDTRY=X', name: 'USD/TRY (Lira)' },
    { symbol: 'USDMXN=X', name: 'USD/MXN (Peso)' },
    { symbol: 'USDSGD=X', name: 'USD/SGD' }
],
  // Finnhub Free susah akses Indices (SPX, DJI), kita pakai ETF populer sebagai pengganti Indices
  INDICES: [
  // === US Market Core ===
  { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
    { symbol: 'DIA', name: 'Dow Jones ETF' },
    { symbol: 'IWM', name: 'Russell 2000 (Small Cap)' },

    // --- Volatility (Fear Gauge) ---
    { symbol: 'VXX', name: 'VIX Short-Term ETN' },
    { symbol: 'UVXY', name: 'Ultra VIX Short-Term' },

    // --- Leveraged ETFs (High Risk/Day Trading) ---
    { symbol: 'TQQQ', name: 'ProShares UltraPro QQQ (3x Bull)' },
    { symbol: 'SQQQ', name: 'ProShares UltraPro Short QQQ (3x Bear)' },
    { symbol: 'SOXL', name: 'Direxion Daily Semi Bull 3x' },
    { symbol: 'SOXS', name: 'Direxion Daily Semi Bear 3x' },

    // --- Commodities (ETF Proxies) ---
    { symbol: 'GLD', name: 'Gold Trust' },
    { symbol: 'SLV', name: 'Silver Trust' },
    { symbol: 'USO', name: 'United States Oil Fund' },
    { symbol: 'UNG', name: 'United States Natural Gas' },
    { symbol: 'TLT', name: '20+ Year Treasury Bond' },

    // --- Global Indices (Futures/Proxies) ---
    { symbol: '^N225', name: 'Nikkei 225 (Japan)' },
    { symbol: '^GDAXI', name: 'DAX Performance (Germany)' },
    { symbol: '^FTSE', name: 'FTSE 100 (UK)' },
    { symbol: '^HSI', name: 'Hang Seng (Hong Kong)' }
],

  MAJOR_MARKET: [
        { symbol: 'BTC-USD', name: 'Bitcoin', source: 'yahoo' },
      { symbol: 'ETH-USD', name: 'Ethereum', source: 'yahoo' },
      { symbol: '^GSPC', name: 'S&P 500', source: 'yahoo' },
      { symbol: '^IXIC', name: 'Nasdaq', source: 'yahoo' },
      { symbol: 'DX-Y.NYB', name: 'DXY (USD Index)', source: 'yahoo' },
      { symbol: 'GC=F', name: 'Gold Futures', source: 'yahoo' }, // Real Futures ticker
      { symbol: 'CL=F', name: 'Crude Oil', source: 'yahoo' }, // Real Futures ticker
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


