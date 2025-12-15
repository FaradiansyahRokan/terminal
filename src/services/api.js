// api.js

// --- KONFIGURASI API ---
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const YAHOO_SEARCH_URL = 'https://query2.finance.yahoo.com/v1/finance/search';

// API Key (Jika limit habis, sistem akan otomatis beralih ke Mock Data)
const FINNHUB_KEY = 'd4vdnlhr01qs25evdo2gd4vdnlhr01qs25evdo30'; 

// --- 1. HELPER: GENERATE MOCK DATA (WAJIB ADA DI ATAS) ---
// const generateMockStockData = (symbol, resolution, count = 100) => {
//   console.log(`%c 🛠️ GENERATING MOCK DATA FOR ${symbol} `, 'background: #222; color: #bada55');
  
//   let data = [];
//   let now = Math.floor(Date.now() / 1000); 
  
//   // FIX: Jika jam komputermu di tahun 2025, kita paksa mundur ke 2024 agar chart masuk akal
//   if (now > 1735689600) {
//       now = 1734200000; 
//   }

//   let intervalSeconds = 3600; // Default 1H

//   if (resolution.includes('m')) intervalSeconds = parseInt(resolution) * 60;
//   else if (resolution.includes('D')) intervalSeconds = 86400;
//   else if (resolution.includes('W')) intervalSeconds = 604800;

//   let currentPrice = symbol === 'BTC' ? 65000 : (symbol === 'AAPL' ? 220 : 150);
//   let startTime = now - (count * intervalSeconds);

//   for (let i = 0; i < count; i++) {
//     const volatility = 0.02; 
//     const change = currentPrice * (Math.random() - 0.5) * volatility;
    
//     const open = currentPrice;
//     const close = open + change;
//     const high = Math.max(open, close) + (Math.random() * Math.abs(change));
//     const low = Math.min(open, close) - (Math.random() * Math.abs(change));
    
//     data.push({
//       time: startTime + (i * intervalSeconds),
//       open: parseFloat(open.toFixed(2)),
//       high: parseFloat(high.toFixed(2)),
//       low: parseFloat(low.toFixed(2)),
//       close: parseFloat(close.toFixed(2)),
//       volume: Math.floor(Math.random() * 50000) + 1000
//     });
    
//     currentPrice = close;
//   }
//   return data;
// };

// --- 2. SERVICES ---

export const BinanceService = {
  async getAllTickers() {
    try {
      const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`);
      if (!response.ok) throw new Error('Binance fetch failed');
      return await response.json();
    } catch (error) { 
      return []; 
    }
  },

  async getKlines(symbol, interval) {
    try {
      const limitPerRequest = 200; 
      let reqInterval = interval === '1M' ? '1M' : interval.toLowerCase();
      const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${reqInterval}&limit=${limitPerRequest}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Binance Kline Failed');
      
      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map(d => ({
        time: d[0] / 1000,
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      }));
    } catch (error) { 
        // return generateMockStockData(symbol, interval); 
    }
  }
};

export const CryptoCompareService = {
  async getAssetStats(symbol) {
    try {
      const sym = symbol.toUpperCase();
      const response = await fetch(`${CRYPTOCOMPARE_BASE_URL}/pricemultifull?fsyms=${sym}&tsyms=USD`);
      if (!response.ok) return null;
      const data = await response.json();
      const rawData = data.RAW?.[sym]?.USD;
      if (!rawData) return null;

      return {
        marketCap: rawData.MKTCAP,
        supply: rawData.SUPPLY,
        totalVol24h: rawData.TOTALVOLUME24H,
        price: rawData.PRICE,
        high24: rawData.HIGH24HOUR,
        low24: rawData.LOW24HOUR
      };
    } catch (e) { return null; }
  }
};

export const YahooService = {
  // Memindahkan logic dari FinnhubService.getNews ke sini
  async getAssetNews(symbol, isCrypto) {
    try {
      let yahooSymbol = symbol;
      
      if (isCrypto) {
          if (!symbol.includes('-USD')) yahooSymbol = `${symbol}-USD`;
      } 
      else if (symbol.includes('=X')) {
          yahooSymbol = symbol;
      }
      else {
           yahooSymbol = symbol.replace('^', '');
      }

      console.log(`Fetching Yahoo News for: ${yahooSymbol}`);

      const response = await fetch(`${YAHOO_SEARCH_URL}?q=${yahooSymbol}`);
      const data = await response.json();

      if (data.news && data.news.length > 0) {
          return data.news.map(item => {
              if(!item.title) return null;

              return {
                  id: item.uuid,
                  datetime: item.providerPublishTime,
                  headline: item.title,
                  source: item.publisher,
                  url: item.link,
                  summary: `Latest coverage for ${symbol} from ${item.publisher}. Click to read more.`, 
                  image: item.thumbnail?.resolutions?.[0]?.url || null 
              };
          }).filter(item => item !== null);
      }

      return [];
    } catch (e) { 
      console.warn("Yahoo News Error:", e);
      return []; 
    }
  }
};

export const FinnhubService = {
  // --- 1. Get Quote (MODIFIKASI FINAL) ---
  async getQuote(symbol) {
    // A. DETEKSI FOREX & INDEX (Simbol Yahoo)
    // Jika simbol mengandung "=X" (Forex) atau "^" (Index), 
    // SKIP Finnhub total! Karena Finnhub Free memblokir OANDA (Error 403).
    if (symbol.includes('=X') || symbol.includes('^')) {
        return this.getYahooQuote(symbol);
    }

    // B. UNTUK SAHAM (AAPL, TSLA, NVDA) -> TETAP PAKAI FINNHUB
    // Karena Finnhub Saham masih gratis dan realtime.
    try {
      const response = await fetch(`${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
      
      if (!response.ok) throw new Error("Finnhub Error");
      
      const data = await response.json();

      // Validasi data kosong
      if (data.c && data.c > 0) {
          return {
            price: data.c,
            change: data.d,
            pct: data.dp,
            high: data.h,
            low: data.l,
            open: data.o,
            prevClose: data.pc
          };
      }
      throw new Error("Zero Data");
    } catch (e) { 
        // Jika Finnhub Saham error juga, fallback ke Yahoo
        return this.getYahooQuote(symbol);
    }
  },

  // --- HELPER BARU: AMBIL QUOTE DARI YAHOO (UTK FOREX/INDEX) ---
  async getYahooQuote(symbol) {
      try {
           // Kita manfaatkan fungsi getStockCandles untuk ambil harga terakhir
           // Ambil candle Harian (1D) biar dapet Open, High, Low hari ini
           const candles = await this.getStockCandles(symbol, '1D');
           
           if (candles && candles.length > 0) {
               const last = candles[candles.length - 1]; // Candle Hari Ini
               const prev = candles.length > 1 ? candles[candles.length - 2] : last; // Candle Kemarin
               
               const change = last.close - prev.close;
               const pct = (prev.close > 0) ? (change / prev.close) * 100 : 0;

               return {
                   price: last.close,     // Harga saat ini
                   change: change,        // Perubahan $
                   pct: pct,              // Perubahan %
                   high: last.high,
                   low: last.low,
                   open: last.open,
                   prevClose: prev.close,
                   vol: last.volume
               };
           }
      } catch (err) {
          console.warn(`Yahoo Fallback Failed for ${symbol}`);
      }
      return { price: 0, change: 0, pct: 0, high: 0, low: 0, open: 0, prevClose: 0 };
  },

  // --- 2. Get Candles (HISTORY/CHART) ---
  async getStockCandles(symbol, resolution) {
    try {
      // Mapping Timeframe
      const yahooMap = {
        '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
        '1H': '60m', '4H': '60m', 
        '1D': '1d', '1W': '1wk', '1M': '1mo'
      };
      
      const interval = yahooMap[resolution] || '1d';
      
      // Logika Range: Intraday 5 hari, Daily 1 tahun, Monthly 5 tahun
      let range = '1y'; 

      if (resolution === '1M' || resolution === '1W') {
          range = '5y'; 
      } else if (resolution.includes('m') || resolution === '1H' || resolution === '4H') {
         if (resolution === '1H' || resolution === '4H') {
             range = '1mo'; // 1 Jam butuh range sebulan biar grafik penuh
         } else {
             range = '5d';  // Menit butuh range pendek
         }
      }

      // Pastikan simbol Forex pakai =X (Safety Check)
      let targetSymbol = symbol;
      if (targetSymbol.length === 6 && !targetSymbol.includes('=X') && !targetSymbol.includes('^') && /^[A-Z]+$/.test(targetSymbol)) {
           // Kalau user kirim "EURUSD" ubah jadi "EURUSD=X" buat Yahoo
           targetSymbol = targetSymbol + '=X';
      }

      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${targetSymbol}?interval=${interval}&range=${range}`;
      
      const response = await fetch(yahooUrl);
      
      if (!response.ok) throw new Error(`Yahoo Error ${response.status}`);
      
      const json = await response.json();
      const result = json.chart.result?.[0];
      
      if (!result || !result.timestamp) throw new Error("Yahoo No Data");

      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      return timestamps.map((t, i) => ({
        time: t,
        open: quotes.open[i],
        high: quotes.high[i],
        low: quotes.low[i],
        close: quotes.close[i],
        volume: quotes.volume[i] || 0
      })).filter(c => c.open != null && c.close != null);

    } catch (e) {
      // Fallback Mock Data
      // Import generateMockStockData dari scope global api.js
      // Pastikan fungsi generateMockStockData ada di luar object FinnhubService
      // return generateMockStockData(symbol, resolution);
    }
  },

  // --- 3. Market Status ---
  async getMarketStatus() {
      return { isOpen: true, session: "regular", exchange: "US", timezone: "America/New_York" };
  },

  // --- 4. Profile ---
  async getProfile(symbol, isCrypto) {
    if (isCrypto) {
        return {
            name: symbol,
            logo: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`,
            weburl: 'https://binance.com',
            description: `Crypto asset ${symbol}`
        };
    }
    // Coba Finnhub Profile (biasanya masih aman utk saham)
    try {
        const cleanSymbol = symbol.replace('=X', '');
        const response = await fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${FINNHUB_KEY}`);
        if(response.ok) return await response.json();
    } catch(e) {}
    
    return {
        name: symbol.replace('=X', ''),
        logo: `https://ui-avatars.com/api/?name=${symbol}&background=random`,
        weburl: '#',
        description: `Market data for ${symbol}`
    };
  },

  // --- 5. News ---
  async getNews(symbol, isCrypto) {
      // Panggil Yahoo Service untuk berita spesifik aset
      return YahooService.getAssetNews(symbol, isCrypto);
  },

  // --- MODIFIKASI 2: NEW GLOBAL NEWS ENDPOINT ---
  async getGeneralNews(category = 'general') {
    // category bisa 'general', 'forex', 'crypto', dll.
    try {
      const response = await fetch(`${FINNHUB_BASE_URL}/news?category=${category}&token=${FINNHUB_KEY}`);
      if (!response.ok) throw new Error("Finnhub General News Failed");
      
      const data = await response.json();

      return data.map(item => ({
        id: item.id,
        datetime: item.datetime,
        headline: item.headline,
        source: item.source,
        url: item.url,
        summary: item.summary,
        image: item.image
      }));
    } catch (e) {
      console.warn(`Finnhub General News (${category}) Error:`, e);
      return [];
    }
  }
};