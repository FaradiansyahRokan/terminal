// src/services/api.js

// --- 1. KONFIGURASI API ---
const BINANCE_BASE_URL = '/api/binance'; 
const CRYPTOCOMPARE_BASE_URL = 'https://min-api.cryptocompare.com/data';
const FINNHUB_BASE_URL = '/api/finnhub';
const YAHOO_SEARCH_URL = '/api/yahoo-search';
const YAHOO_CHART_URL = '/api/yahoo-chart';

// API Key Finnhub
const FINNHUB_KEY = 'd4vdnlhr01qs25evdo2gd4vdnlhr01qs25evdo30'; 

// --- HELPER DELAY ---
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- HELPER UNTUK CEK TIPE SIMBOL ---
const isCryptoSymbol = (symbol) => symbol && (symbol.endsWith('USDT') || symbol.includes('-USD'));

// --- 2. SERVICES ---
// ... (BinanceService dan CryptoCompareService tetap sama) ...
export const BinanceService = {
    async getAllTickers() {
        try {
            const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`, {
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`Binance Status: ${response.status}`);
            return await response.json();
        } catch (error) { 
            console.error("Binance Ticker Error:", error);
            return []; 
        }
    },

    async getKlines(symbol, interval) {
        try {
            const limitPerRequest = 1000; 
            let reqInterval = interval;
            if (interval === '1H') reqInterval = '1h';
            else if (interval === '1D') reqInterval = '1d';
            else if (interval === '1W') reqInterval = '1w';
            else if (interval === '1M') reqInterval = '1M';
            else reqInterval = interval.toLowerCase();

            const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${reqInterval}&limit=${limitPerRequest}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Binance Kline Failed: ${response.status}`);
            
            const data = await response.json();
            if (!Array.isArray(data)) return [];

            return data.map(d => ({
                time: d[0] / 1000,
                open: parseFloat(d[1]),
                high: parseFloat(d[2]),
                low: parseFloat(d[3]),
                close: parseFloat(d[4]),
                volume: parseFloat(d[5]),
            })).filter(c => c.open != null);
        } catch (error) { return []; }
    }
};

export const CryptoCompareService = {
    async getAssetStats(symbol) {
        try {
            const sym = symbol.toUpperCase().replace('USDT', '');
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
    // ... (getQuote tetap sama, memanggil getYahooCandles(..., '1D') range 5 hari) ...
    async getQuote(symbol) {
        try {
            // Delay random kecil supaya Yahoo gak curiga bot spamming
            await delay(Math.random() * 200);

            // Kita ambil candle Harian (1D) range 5 hari ke belakang
            // Menggunakan '5d' untuk memastikan ada 2 candle untuk hitung change
            const candles = await this.getYahooCandles(symbol, '1D', '5d'); 
            
            if (candles && candles.length > 1) {
                const last = candles[candles.length - 1]; // Hari ini (atau candle terakhir)
                const prev = candles[candles.length - 2]; // Kemarin
                
                // Hitung perubahan harga manual
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
            // Silent error
        }
        // Return object nol jika gagal
        return { price: 0, change: 0, pct: 0, high: 0, low: 0, open: 0, prevClose: 0, vol: 0 };
    },

    async getAssetNews(symbol, isCrypto) {
        try {
            // 🔥 FIX: Clean symbol untuk Finnhub/Yahoo Search
            let yahooSymbol = symbol;
            if (isCrypto) {
                 if (!symbol.includes('-USD')) yahooSymbol = `${symbol}-USD`;
            } else if (symbol.includes('=X') || symbol.includes('^')) {
                 yahooSymbol = symbol;
            } else {
                 // Hapus .JK, .SA, dll. jika bukan crypto/index/forex, untuk compatibility Finnhub/Yahoo Search
                 yahooSymbol = symbol.replace(/\.[A-Z]{1,3}$|\^/g, ''); 
            }

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
                        summary: `Latest coverage for ${symbol} from ${item.publisher}.`, 
                        image: item.thumbnail?.resolutions?.[0]?.url || null 
                    };
                }).filter(item => item !== null);
            }
            return [];
        } catch (e) { return []; }
    },
    
    async getYahooCandles(symbol, resolution, customRange = null) {
        try {
            const yahooMap = {
                '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
                '1H': '60m', '4H': '60m', 
                '1D': '1d', '1W': '1wk', '1M': '1mo'
            };
            
            const interval = yahooMap[resolution] || '1d';
            const isCrypto = isCryptoSymbol(symbol);

            // --- 🔥 LOGIC RANGE BARU (FULL HISTORY) 🔥 ---
            let range = customRange || '1y'; // Default Range
            
            if (!customRange) {
                if (['1m', '5m', '15m', '30m'].includes(resolution)) {
                    range = '7d'; // Batas history Intraday Yahoo
                } else if (['1H', '4H'].includes(resolution)) {
                    range = '730d'; // Batas history per jam Yahoo (sekitar 2 tahun)
                } 
                // Daily, Weekly, Monthly: Ambil semua data dari awal, kecuali Crypto.
                else if (['1D', '1W', '1M'].includes(resolution) && !isCrypto) {
                    range = 'max'; // KUNCI: 'max' untuk saham/forex
                }
                // Crypto dengan interval besar akan menggunakan range 'max' (Yahoo Crypto biasanya memiliki data yang lengkap)
                else if (isCrypto && ['1D', '1W', '1M'].includes(resolution)) {
                    range = 'max'; 
                }
            }

            // Symbol Formatting
            let targetSymbol = symbol;
            // Cek jika bukan crypto, bukan index, dan bukan forex
            if (targetSymbol.endsWith('USDT')) targetSymbol = targetSymbol.replace('USDT', '-USD');
            if (targetSymbol.length === 6 && !/[^A-Z]/.test(targetSymbol)) targetSymbol = targetSymbol + '=X';

            // Jika saham Indonesia: YAHOO tidak support .JK, tapi Yahoo Finance API di backend mungkin memerlukan, jadi biarkan saja.
            // Jika proxy Anda memfilter .JK di backend, kode ini sudah benar.

            // Request ke Proxy URL
            const yahooUrl = `${YAHOO_CHART_URL}/${targetSymbol}?interval=${interval}&range=${range}`;
            
            const response = await fetch(yahooUrl);
            
            if (!response.ok) {
                console.warn(`Yahoo Fetch Error for ${targetSymbol}`);
                return []; 
            }
            
            const json = await response.json();
            const result = json.chart.result?.[0];
            
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
             console.warn("Yahoo Candles Error (Silent):", e.message);
             return [];
        }
    }
};

export const FinnhubService = {
    // ... (getQuote, getStockCandles, getNews tetap sama) ...
    async getQuote(symbol) {
        return YahooService.getQuote(symbol);
    },

    async getStockCandles(symbol, resolution) {
        return YahooService.getYahooCandles(symbol, resolution);
    },

    async getProfile(symbol, isCrypto) {
        if (isCrypto) {
            return {
                name: symbol,
                logo: `https://assets.coincap.io/assets/icons/${symbol.toLowerCase().replace('usdt','')}@2x.png`,
                weburl: 'https://binance.com',
                description: `Crypto asset ${symbol}`
            };
        }
        try {
            // 🔥 FIX: Hapus .JK, .SA, dll. untuk Finnhub Profile agar dapat data yang relevan
            const cleanSymbol = symbol.replace(/\.[A-Z]{1,3}$|\^/g, ''); 
            const response = await fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${cleanSymbol}&token=${FINNHUB_KEY}`);
            if(response.ok) return await response.json();
        } catch(e) {}
        
        return {
            name: symbol.replace(/=X|\^/g, ''),
            logo: `https://ui-avatars.com/api/?name=${symbol}&background=random`,
            weburl: '#',
            description: `Market data for ${symbol}`
        };
    },

    async getNews(symbol, isCrypto) {
        return YahooService.getAssetNews(symbol, isCrypto);
    },

    // --- 5. Global News (TETAP PAKE FINNHUB - Sesuai request) ---
    async getGeneralNews(category = 'general') {
        try {
            const response = await fetch(`${FINNHUB_BASE_URL}/news?category=${category}&token=${FINNHUB_KEY}`);
            // Kalau limit abis, return kosong aja jangan error
            if (response.status === 429) return []; 
            if (!response.ok) throw new Error("Finnhub General News Failed");
            
            const data = await response.json();
            return data.map(item => ({
                id: item.id, datetime: item.datetime, headline: item.headline,
                source: item.source, url: item.url, summary: item.summary, image: item.image
            }));
        } catch (e) { return []; }
    }
};