// src/services/api.js

// --- 1. CONFIGURATION ---
const CONFIG = {
    BINANCE_BASE_URL: '/api/binance', 
    CRYPTOCOMPARE_BASE_URL: 'https://min-api.cryptocompare.com/data',
    FINNHUB_BASE_URL: '/api/finnhub',
    YAHOO_SEARCH_URL: '/api/yahoo-search',
    YAHOO_CHART_URL: '/api/yahoo-chart',
    
    // API Key Finnhub - Replace with your actual key
    FINNHUB_KEY: 'd4vdnlhr01qs25evdo2gd4vdnlhr01qs25evdo30' 
};

// --- HELPER: DELAY ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER: SYMBOL FORMATTER ---
const formatSymbolForYahoo = (symbol) => {
    // 1. Crypto
    if (symbol.endsWith('USDT')) return symbol.replace('USDT', '-USD');
    
    // 2. Forex (Simple check: 6 chars, all caps, no numbers)
    // Avoid adding =X to things that already have it or are indices (start with ^)
    if (symbol.length === 6 && /^[A-Z]+$/.test(symbol) && !['BTC','ETH','BNB','SOL','XRP'].includes(symbol)) {
         return symbol + '=X';
    }
    
    // 3. Indices or others usually kept as is (e.g. ^GSPC, ^IXIC)
    return symbol;
};

// --- 2. SERVICES ---

export const BinanceService = {
    async getAllTickers() {
        try {
            const response = await fetch(`${CONFIG.BINANCE_BASE_URL}/ticker/24hr`, {
                headers: { 'Accept': 'application/json' }
            });
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
            if (!Array.isArray(data)) return [];

            return data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]), high: parseFloat(d[2]),
                low: parseFloat(d[3]), close: parseFloat(d[4]),
                volume: parseFloat(d[5]),
            })).filter(c => c.open != null);
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
    // --- MAIN FEATURE: GET QUOTE FROM CHART ---
    async getQuote(symbol) {
        try {
            // Priority: Try fetching 5 days of Daily data. 
            let candles = await this.getYahooCandles(symbol, '1D', '5d');
            
            // Fallback: If 5d fails/empty, try 1mo (1 month)
            if (!candles || candles.length === 0) {
                candles = await this.getYahooCandles(symbol, '1D', '1mo');
            }

            if (candles && candles.length > 0) {
                const last = candles[candles.length - 1]; 
                const prev = candles.length > 1 ? candles[candles.length - 2] : last;
                
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
        } catch (err) {
            // console.warn(`Quote failed for ${symbol}`);
        }
        return { price: 0, change: 0, pct: 0, high: 0, low: 0, open: 0, prevClose: 0, vol: 0 };
    },

    async getAssetNews(symbol, isCrypto) {
        try {
            const yahooSymbol = formatSymbolForYahoo(symbol);
            const response = await fetch(`${CONFIG.YAHOO_SEARCH_URL}?q=${yahooSymbol}`);
            if (!response.ok) return [];
            const data = await response.json();
            
            if (data.news && data.news.length > 0) {
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
            
            // Logic Range
            let range = customRange || '1y'; 
            if (!customRange) {
                if (['1m', '5m', '15m', '30m'].includes(resolution)) range = '7d';
                else if (['1H', '4H'].includes(resolution)) range = '730d'; 
                else if (['1D', '1W', '1M'].includes(resolution) && !symbol.includes('USDT')) range = 'max';
                else if (resolution === 'MAX') range = 'max';
            }

            // Symbol Formatting
            let targetSymbol = symbol;
            if (targetSymbol.endsWith('USDT')) targetSymbol = targetSymbol.replace('USDT', '-USD');
            if (targetSymbol.length === 6 && !/[^A-Z]/.test(targetSymbol)) targetSymbol = targetSymbol + '=X';

            // 🔥 PERUBAHAN UTAMA DI SINI 🔥
            // Ubah format URL dari Path Parameter menjadi Query Parameter
            //encodeURIComponent penting agar karakter ^ dan = aman dikirim
            const encodedSymbol = encodeURIComponent(targetSymbol);
            
            const url = `${YAHOO_CHART_URL}?symbol=${encodedSymbol}&interval=${interval}&range=${range}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                // Log silent warning
                return []; 
            }
            
            const json = await response.json();
            const result = json.chart?.result?.[0]; // Safe navigation (?.)
            
            if (!result || !result.timestamp || !result.indicators.quote[0]) return [];

            const { timestamp } = result;
            const { open, high, low, close, volume } = result.indicators.quote[0];

            return timestamp.map((t, i) => ({
                time: t,
                open: open[i],
                high: high[i],
                low: low[i],
                close: close[i],
                volume: volume[i] || 0
            })).filter(c => c.open != null && c.close != null);

        } catch (e) {
             return [];
        }
    }
};

export const FinnhubService = {
    async getQuote(symbol) { return YahooService.getQuote(symbol); },
    async getStockCandles(symbol, resolution) { return YahooService.getYahooCandles(symbol, resolution); },
    
    // --- 3. Profile (Robust 403 Handling) ---
    async getProfile(symbol, isCrypto) {
        if (isCrypto) {
            return {
                name: symbol,
                logo: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase().replace('usdt','')}@2x.png`,
                weburl: 'https://binance.com', description: `Crypto asset ${symbol}`
            };
        }
        try {
            // Strip suffix like .JK for Finnhub profile lookup (usually works better without exchange suffix on free tier)
            const cleanSymbol = symbol.replace(/\.[A-Z]{1,3}$/g, '').replace('^', ''); 
            const response = await fetch(`${CONFIG.FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${CONFIG.FINNHUB_KEY}`);
            
            if (!response.ok) {
                // Handle 403 Forbidden or 429 Too Many Requests gracefully
                // console.warn(`Finnhub Profile Error ${response.status} for ${symbol}`);
                return { name: symbol, logo: '', weburl: '#', description: '' };
            }
            
            return await response.json();
        } catch(e) {
            return { name: symbol, logo: '', weburl: '#', description: '' };
        }
    },

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