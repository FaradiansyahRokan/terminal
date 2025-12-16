// src/services/api.js

// --- 1. KONFIGURASI API ---
// GANTI KE DATA-API (Lebih ramah untuk frontend/browser dan menghindari Error 418)
const BINANCE_BASE_URL = 'https://data-api.binance.vision/api/v3'; 
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const YAHOO_SEARCH_URL = 'https://query2.finance.yahoo.com/v1/finance/search';
// Yahoo sering memblokir request langsung, kita gunakan CORS Proxy jika perlu, 
// atau biarkan fetch berjalan jika environment mendukung.
const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// API Key
const FINNHUB_KEY = 'd4vdnlhr01qs25evdo2gd4vdnlhr01qs25evdo30'; 

// --- 2. SERVICES ---

export const BinanceService = {
    async getAllTickers() {
        try {
            // Menggunakan data-api.binance.vision
            const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (!response.ok) {
                // Log status error untuk debugging
                console.warn(`Binance Ticker Failed: ${response.status} ${response.statusText}`);
                throw new Error(`Binance fetch failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) { 
            console.error("Binance Ticker Error:", error);
            // Return array kosong agar App tidak crash (white screen)
            return []; 
        }
    },

    async getKlines(symbol, interval) {
        try {
            const limitPerRequest = 1000; 
            // Mapping interval agar sesuai dengan format Binance
            // Pastikan interval valid: 1s, 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
            let reqInterval = interval;
            if (interval === '1H') reqInterval = '1h';
            else if (interval === '1D') reqInterval = '1d';
            else if (interval === '1W') reqInterval = '1w';
            else if (interval === '1M') reqInterval = '1M';
            else reqInterval = interval.toLowerCase();

            const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${reqInterval}&limit=${limitPerRequest}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Binance Kline Failed: ${response.status}`);
                throw new Error(`Binance Kline Failed: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Validasi apakah data array
            if (!Array.isArray(data)) return [];

            return data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5]),
            })).filter(c => c.open != null); // Filter data corrupt
        } catch (error) { 
            console.error("Binance Klines Error:", error);
            return [];
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
    async getAssetNews(symbol, isCrypto) {
        try {
            let yahooSymbol = symbol;
            
            if (isCrypto) {
                 if (!symbol.includes('-USD')) yahooSymbol = `${symbol}-USD`;
            } else if (symbol.includes('=X') || symbol.includes('^')) {
                 yahooSymbol = symbol;
            } else {
                 yahooSymbol = symbol.replace('^', '');
            }

            // Yahoo Finance Search API kadang memblokir akses tanpa cookie valid
            // Kita coba fetch, tapi handle error dengan graceful
            const response = await fetch(`${YAHOO_SEARCH_URL}?q=${yahooSymbol}`);
            if (!response.ok) throw new Error("Yahoo Search Failed");
            
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
    },
    
    async getYahooCandles(symbol, resolution) {
        try {
            const yahooMap = {
                '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
                '1H': '60m', '4H': '60m', 
                '1D': '1d', '1W': '1wk', '1M': '1mo'
            };
            
            const interval = yahooMap[resolution] || '1d';
            
            let range = '1y'; 
            if (resolution === '1M' || resolution === '1W') {
                range = '5y'; 
            } else if (resolution.includes('m') || resolution === '1H' || resolution === '4H') {
                 range = (resolution === '1H' || resolution === '4H') ? '1mo' : '5d'; 
            }

            // 🔥 FIX: AUTO CONVERT SYMBOL FOR YAHOO 🔥
            let targetSymbol = symbol;
            
            // 1. Ubah BTCUSDT -> BTC-USD (Format Yahoo)
            if (targetSymbol.endsWith('USDT')) {
                targetSymbol = targetSymbol.replace('USDT', '-USD');
            }
            
            // 2. Forex (EURUSD -> EURUSD=X) - Cek jika 6 huruf kapital tanpa karakter aneh
            if (targetSymbol.length === 6 && !targetSymbol.includes('=X') && !targetSymbol.includes('-') && !targetSymbol.includes('^')) {
                 targetSymbol = targetSymbol + '=X';
            }

            // NOTE: Yahoo Finance API v8 sering memblokir request CORS dari localhost.
            // Solusi terbaik sebenarnya pakai Proxy, tapi untuk demo kita try/catch.
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${targetSymbol}?interval=${interval}&range=${range}`;
            
            const response = await fetch(yahooUrl);
            
            if (!response.ok) {
                // Jangan throw Error generik, return array kosong biar App gak crash
                console.warn(`Yahoo Fetch 404/Error for ${targetSymbol}`);
                return []; 
            }
            
            const json = await response.json();
            const result = json.chart.result?.[0];
            
            if (!result || !result.timestamp) return [];

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
             console.warn("Yahoo Candles Error (Silent):", e.message); // Ubah jadi warn agar console tidak merah
             return [];
        }
    }
};


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 5. FINNHUB SERVICE (DENGAN RATE LIMIT HANDLING) ---
export const FinnhubService = {
    // --- 1. Get Quote ---
    async getQuote(symbol) {
        // Fallback untuk Forex/Index yang diblokir oleh Finnhub
        if (symbol.includes('=X') || symbol.includes('^')) {
            return this.getYahooQuote(symbol);
        }

        try {
            // Tambahkan delay acak kecil untuk menghindari burst request bersamaan
            await delay(Math.random() * 500); 

            const response = await fetch(`${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
            
            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`Finnhub Quote Limit (429) for ${symbol}. Switching to Yahoo.`);
                    // Jika limit habis, langsung fallback ke Yahoo tanpa throw error
                    return this.getYahooQuote(symbol);
                }
                throw new Error("Finnhub Error");
            }
            
            const data = await response.json();

            // Validasi data (c = current price harus > 0)
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
            // Fallback ke Yahoo jika ada error apapun
            return this.getYahooQuote(symbol);
        }
    },

    // --- HELPER: AMBIL QUOTE DARI YAHOO ---
    async getYahooQuote(symbol) {
        try {
            // Gunakan delay sedikit lebih lama untuk Yahoo agar tidak kena blokir juga
            await delay(Math.random() * 1000);

            const candles = await YahooService.getYahooCandles(symbol, '1D');
            
            if (candles && candles.length > 1) {
                const last = candles[candles.length - 1]; 
                const prev = candles[candles.length - 2]; 
                
                const change = last.close - prev.close;
                const pct = (prev.close > 0) ? (change / prev.close) * 100 : 0;

                return {
                    price: last.close, 
                    change: change, 
                    pct: pct, 
                    high: last.high,
                    low: last.low,
                    open: last.open,
                    prevClose: prev.close,
                    vol: last.volume 
                };
            }
        } catch (err) {
             // console.warn(`Yahoo Fallback Quote Failed for ${symbol}`); // Silent fail agar console bersih
        }
        return { price: 0, change: 0, pct: 0, high: 0, low: 0, open: 0, prevClose: 0, vol: 0 };
    },

    // --- 2. Get Candles (HISTORY/CHART) ---
    async getStockCandles(symbol, resolution) {
        return YahooService.getYahooCandles(symbol, resolution);
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
        try {
            const cleanSymbol = symbol.replace('=X', '');
            const response = await fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${FINNHUB_KEY}`);
            if (response.status === 429) console.warn("Finnhub Profile: Rate Limit Reached (429).");
            if(response.ok) return await response.json();
        } catch(e) {}
        
        return {
            name: symbol.replace('=X', '').replace('^', ''),
            logo: `https://ui-avatars.com/api/?name=${symbol.replace('=X', '').replace('^', '')}&background=random`,
            weburl: '#',
            description: `Market data for ${symbol}`
        };
    },

    // --- 5. News ---
    async getNews(symbol, isCrypto) {
        return YahooService.getAssetNews(symbol, isCrypto);
    },

    // --- 6. Global News ---
    async getGeneralNews(category = 'general') {
        try {
            const response = await fetch(`${FINNHUB_BASE_URL}/news?category=${category}&token=${FINNHUB_KEY}`);
            if (response.status === 429) {
                console.warn(`Finnhub General News (${category}): Rate Limit Reached (429).`);
                return [];
            }
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