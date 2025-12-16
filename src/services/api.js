// src/services/api.js

// --- 1. CONFIGURATION ---
const CONFIG = {
    // Path relative agar masuk ke Proxy Vercel
    BINANCE_BASE_URL: '/api/binance', 
    CRYPTOCOMPARE_BASE_URL: 'https://min-api.cryptocompare.com/data',
    FINNHUB_BASE_URL: '/api/finnhub',
    YAHOO_SEARCH_URL: '/api/yahoo-search',
    YAHOO_CHART_URL: '/api/yahoo-chart',
    
    // API Key
    FINNHUB_KEY: 'd4vdnlhr01qs25evdo2gd4vdnlhr01qs25evdo30' 
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 2. SERVICES ---

export const BinanceService = {
    async getAllTickers() {
        try {
            const response = await fetch(`${CONFIG.BINANCE_BASE_URL}/ticker/24hr`);
            if (!response.ok) return [];
            return await response.json();
        } catch (error) { return []; }
    },

    async getKlines(symbol, interval) {
        try {
            const limit = 1000; 
            let reqInterval = interval.toLowerCase();
            if (interval === '1H') reqInterval = '1h';
            else if (interval === '1D') reqInterval = '1d';
            else if (interval === '1W') reqInterval = '1w';
            else if (interval === '1M') reqInterval = '1M';

            const url = `${CONFIG.BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${reqInterval}&limit=${limit}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            return Array.isArray(data) ? data.map(d => ({
                time: d[0] / 1000, open: parseFloat(d[1]), high: parseFloat(d[2]),
                low: parseFloat(d[3]), close: parseFloat(d[4]), volume: parseFloat(d[5]),
            })).filter(c => c.open != null) : [];
        } catch (error) { return []; }
    }
};

export const CryptoCompareService = {
    async getAssetStats(symbol) {
        try {
            const sym = symbol.toUpperCase().replace('USDT', '');
            const response = await fetch(`${CONFIG.CRYPTOCOMPARE_BASE_URL}/pricemultifull?fsyms=${sym}&tsyms=USD`);
            if (!response.ok) return null;
            const data = await response.json();
            const rawData = data.RAW?.[sym]?.USD;
            if (!rawData) return null;
            return {
                marketCap: rawData.MKTCAP, supply: rawData.SUPPLY,
                totalVol24h: rawData.TOTALVOLUME24H, price: rawData.PRICE,
                high24: rawData.HIGH24HOUR, low24: rawData.LOW24HOUR
            };
        } catch (e) { return null; }
    }
};

export const YahooService = {
    // --- FITUR UTAMA: AMBIL HARGA (QUOTE) ---
    async getQuote(symbol) {
        try {
            // Priority: Ambil data 5 hari terakhir (1D). Ini paling stabil untuk Stock/Forex.
            // Range '5d' memastikan kita dapat candle kemarin dan hari ini untuk hitung % change.
            let candles = await this.getYahooCandles(symbol, '1D', '5d');
            
            // Fallback: Jika 5d kosong (misal Index ^GSPC kadang butuh range lebih lebar), coba 1 bulan
            if (!candles || candles.length === 0) {
                candles = await this.getYahooCandles(symbol, '1D', '1mo');
            }

            if (candles && candles.length > 0) {
                const last = candles[candles.length - 1]; 
                // Jika cuma ada 1 candle, gunakan open sebagai prev close
                const prev = candles.length > 1 ? candles[candles.length - 2] : { close: last.open };
                
                const currentPrice = last.close;
                const prevClose = prev.close;
                const change = currentPrice - prevClose;
                const pct = prevClose > 0 ? (change / prevClose) * 100 : 0;

                return {
                    price: currentPrice, change: change, pct: pct,
                    high: last.high, low: last.low, open: last.open,
                    prevClose: prevClose, vol: last.volume
                };
            }
        } catch (err) { }
        
        // Return 0 jika gagal total, jangan throw error biar app gak crash
        return { price: 0, change: 0, pct: 0, high: 0, low: 0, open: 0, prevClose: 0, vol: 0 };
    },

    async getAssetNews(symbol, isCrypto) {
        try {
            // Formatting simbol untuk Search News
            let yahooSymbol = symbol;
            if (isCrypto && symbol.endsWith('USDT')) yahooSymbol = symbol.replace('USDT', '-USD');
            else if (!isCrypto && !symbol.includes('^')) yahooSymbol = symbol.replace('=X', '');

            const response = await fetch(`${CONFIG.YAHOO_SEARCH_URL}?q=${yahooSymbol}`);
            if (!response.ok) return [];
            const data = await response.json();
            
            if (data.news) {
                return data.news.map(item => ({
                    id: item.uuid, datetime: item.providerPublishTime,
                    headline: item.title, source: item.publisher,
                    url: item.link, summary: `Latest coverage for ${symbol}`, 
                    image: item.thumbnail?.resolutions?.[0]?.url 
                })).filter(i => i.headline);
            }
            return [];
        } catch (e) { return []; }
    },
    
    // --- CORE CHART ENGINE ---
    async getYahooCandles(symbol, resolution, customRange = null) {
        try {
            const yahooMap = {
                '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
                '1H': '60m', '4H': '60m', 
                '1D': '1d', '1W': '1wk', '1M': '1mo'
            };
            const interval = yahooMap[resolution] || '1d';
            
            // Logic Range Otomatis
            let range = customRange || '1y'; 
            if (!customRange) {
                if (['1m', '5m', '15m', '30m'].includes(resolution)) range = '5d'; // Intraday max 5-7 hari
                else if (['1H', '4H'].includes(resolution)) range = '1y'; // Hourly max 2 tahun
                else if (['1D'].includes(resolution)) range = '1y';
                else if (resolution === 'MAX') range = 'max';
            }

            // --- SYMBOL FORMATTING CRITICAL ---
            let targetSymbol = symbol;
            
            // 1. Crypto: BTCUSDT -> BTC-USD
            if (targetSymbol.endsWith('USDT')) {
                targetSymbol = targetSymbol.replace('USDT', '-USD');
            } 
            // 2. Indeks: ^GSPC tetap ^GSPC (jangan diubah)
            else if (targetSymbol.startsWith('^')) {
                // Do nothing, keep the caret
            }
            // 3. Forex: EURUSD -> EURUSD=X (Jika 6 huruf kapital dan bukan crypto/saham populer)
            else if (targetSymbol.length === 6 && /^[A-Z]+$/.test(targetSymbol) && !['NVDA','TSLA','AAPL','GOOG','AMZN'].includes(targetSymbol)) {
                 targetSymbol = targetSymbol + '=X';
            }

            // --- ENCODING SYMBOL (Wajib untuk ^GSPC dan =X) ---
            const encodedSymbol = encodeURIComponent(targetSymbol);
            
            // Fetch ke API Proxy
            const url = `${CONFIG.YAHOO_CHART_URL}?symbol=${encodedSymbol}&interval=${interval}&range=${range}`;
            
            const response = await fetch(url);
            if (!response.ok) return [];
            
            const json = await response.json();
            const result = json.chart?.result?.[0]; // Safe navigation
            
            if (!result || !result.timestamp || !result.indicators.quote[0]) return [];

            const { timestamp } = result;
            const { open, high, low, close, volume } = result.indicators.quote[0];

            return timestamp.map((t, i) => ({
                time: t,
                open: open[i], high: high[i], low: low[i], close: close[i], 
                volume: volume[i] || 0
            })).filter(c => c.close != null && c.open != null);

        } catch (e) {
             return [];
        }
    }
};

export const FinnhubService = {
    // --- 1. Get Quote (BYPASS KE YAHOO) ---
    // Ini kunci agar Stocks/Forex/TickerTape muncul tanpa limit Finnhub
    async getQuote(symbol) {
        return YahooService.getQuote(symbol);
    },

    // --- 2. Get Candles ---
    async getStockCandles(symbol, resolution) {
        return YahooService.getYahooCandles(symbol, resolution);
    },

    // --- 3. Profile ---
    async getProfile(symbol, isCrypto) {
        if (isCrypto) {
            return {
                name: symbol, logo: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase().replace('usdt','')}@2x.png`,
                weburl: 'https://binance.com', description: `Crypto asset ${symbol}`
            };
        }
        try {
            // Finnhub butuh simbol bersih (misal GOTO.JK -> GOTO) untuk beberapa endpoint, 
            // tapi untuk US Stock biasanya aman.
            const cleanSymbol = symbol.replace('=X', '').replace('^', '');
            const response = await fetch(`${CONFIG.FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${CONFIG.FINNHUB_KEY}`);
            if(response.ok) return await response.json();
        } catch(e) {}
        return { name: symbol, logo: '', weburl: '#', description: '' };
    },

    // --- 4. News & Global News ---
    async getNews(symbol, isCrypto) { return YahooService.getAssetNews(symbol, isCrypto); },
    
    async getGeneralNews(category = 'general') {
        try {
            const response = await fetch(`${CONFIG.FINNHUB_BASE_URL}/news?category=${category}&token=${CONFIG.FINNHUB_KEY}`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map(item => ({
                id: item.id, datetime: item.datetime, headline: item.headline,
                source: item.source, url: item.url, summary: item.summary, image: item.image
            }));
        } catch (e) { return []; }
    }
};