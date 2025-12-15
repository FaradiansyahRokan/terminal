import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BinanceService, FinnhubService, CryptoCompareService } from './services/api'; 
import { formatNumber, MARKET_CATEGORIES, ASSET_LISTS } from './utils/constants'; 
import { calculateRSI } from './utils/indicators';

// Import Components
import Header from './components/Header';
import Watchlist from './components/Watchlist';
import ChartWidget from './components/ChartWidget';
import OrderBook from './components/OrderBook';
import MarketStats from './components/MarketStats';
import ScreenerPanel from './components/ScreenerPanel';
import NewsFeed from './components/NewsFeed';
// import NewsReader from './components/NewsReader';
import TickerTape from './components/TickerTape';

// --- HARDCODED COLORS DARI FILE LAIN (Untuk Drag Handle & Tabs) ---
const ACCENT_TEXT = 'text-amber-500';
const BORDER_COLOR = 'border-[#333333]'; 
const BG_PANEL = 'bg-[#1E1E1E]'; 
const BG_DARK = 'bg-[#0D0D0D]'; 


const App = () => {
    // 1. STATE MANAGEMENT
    const [activeCategory, setActiveCategory] = useState(MARKET_CATEGORIES.CRYPTO); 
    const [selectedAsset, setSelectedAsset] = useState('BTC');
    const [timeframe, setTimeframe] = useState('1H');
    const [searchQuery, setSearchQuery] = useState('');
    const [activePanel, setActivePanel] = useState('screener');
    const [viewMode, setViewMode] = useState('chart');
    // const [selectedArticle, setSelectedArticle] = useState(null);
    const [combinedAssets, setCombinedAssets] = useState([]);
    
    // UI/RESIZE STATE
    const [bottomPanelHeight, setBottomPanelHeight] = useState(256); 
    const minBottomHeight = 256;
    const maxBottomHeight = 700; 

    // DATA STATES
    const [marketStatus, setMarketStatus] = useState(null);
    const [fundamentalData, setFundamentalData] = useState(null); 
    const [assetProfile, setAssetProfile] = useState(null); 
    const [assets, setAssets] = useState([]);
    const [candleData, setCandleData] = useState([]);
    const [lastCandle, setLastCandle] = useState(null);
    const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
    const [news, setNews] = useState([]);
    const [screenerResults, setScreenerResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [globalNews, setGlobalNews] = useState([]);

    // GLOBAL HEADER STATS
    const [marketCap, setMarketCap] = useState(0);
    const [volume24h, setVolume24h] = useState(0);
    const [btcDom, setBtcDom] = useState(0);
    const [indices, setIndices] = useState([
        { symbol: 'S&P 500', ticker: 'SPY', price: '-', pct: '0%', positive: true }, 
        { symbol: 'NASDAQ', ticker: 'QQQ', price: '-', pct: '0%', positive: true },
    ]);

    // REFS
    const wsRef = useRef(null); // Ref untuk Selected Asset (Chart/OrderBook)
    const watchlistWsRef = useRef(null); // Ref BARU untuk Realtime Watchlist
    const activeAssetRef = useRef(selectedAsset);
    const mainContentRef = useRef(null); 

    useEffect(() => { activeAssetRef.current = selectedAsset; }, [selectedAsset]);

    // 2. HELPER: CATEGORY CHECK
    const isCrypto = activeCategory === MARKET_CATEGORIES.CRYPTO;

    // 3. MEMO: REALTIME PRICE STATS (RSI Calculation)
    const realtimePriceStats = useMemo(() => {
        const assetInfo = assets.find(a => a.symbol === selectedAsset || a.symbol === selectedAsset + 'USDT');
        
        const currentPrice = (isCrypto && lastCandle) ? lastCandle.close : (assetInfo ? assetInfo.price : 0);
        
        let realRSI = '50';
        if (candleData.length > 14) {
            const closes = candleData.map(c => c.close);
            if (isCrypto && lastCandle) closes.push(lastCandle.close); 
            realRSI = calculateRSI(closes);
        }

        return {
            price: currentPrice,
            positive: (assetInfo ? assetInfo.pct : 0) >= 0,
            changePct: assetInfo ? assetInfo.pct.toFixed(2) : '0.00',
            rsi: realRSI,
            volume: assetInfo ? assetInfo.vol : 0, 
            high: assetInfo ? assetInfo.high : 0, 
            low: assetInfo ? assetInfo.low : 0, 
        };
    }, [selectedAsset, assets, lastCandle, candleData, isCrypto]);


    // 4. RESIZE HANDLERS (Manual Vertical Drag)
    const handleMouseMove = useRef((e) => {
     if (mainContentRef.current) {
         const mainContentRect = mainContentRef.current.getBoundingClientRect();
         const newHeight = mainContentRect.bottom - e.clientY; 
         
         if (newHeight >= minBottomHeight && newHeight <= maxBottomHeight) {
             setBottomPanelHeight(newHeight);
         }
         if (newHeight < minBottomHeight) {
              setBottomPanelHeight(minBottomHeight);
         }
     }
    });

    const handleMouseUp = useRef(() => {
        document.removeEventListener('mousemove', handleMouseMove.current);
        document.removeEventListener('mouseup', handleMouseUp.current);
        document.body.style.cursor = 'default'; 
        document.body.style.userSelect = 'auto'; 
    });

    const handleMouseDown = (e) => {
        e.preventDefault(); 
        document.body.style.cursor = 'ns-resize'; 
        document.body.style.userSelect = 'none'; 
        document.addEventListener('mousemove', handleMouseMove.current);
        document.addEventListener('mouseup', handleMouseUp.current);
    };


    // 5. FETCH ASSET DATA (Indices, Major Market, Watchlist)
    
    // 5a. FETCH INDICES (Dibutuhkan untuk Header)
    const fetchIndices = async () => {
        const newIndices = await Promise.all(
            indices.map(async (index) => {
                const quote = await FinnhubService.getQuote(index.ticker);
                const price = quote.price > 0 ? quote.price : index.price;
                const pct = quote.pct !== 0 ? quote.pct : 0; 
                
                return {
                    ...index,
                    price: price,
                    pct: pct, 
                    positive: pct >= 0,
                };
            })
        );
        setIndices(newIndices);
        return newIndices;
    };

    // 5b. FETCH MAJOR MARKET SNAPSHOT (Dibutuhkan untuk TickerTape)
    const fetchMajorMarketSnapshot = async () => {
        try {
            const majorAssets = ASSET_LISTS.MAJOR_MARKET;
            let promises = majorAssets.map(async (item) => {
                let quote = null;
                let symbolTicker = item.symbol;

                if (item.source === 'crypto') {
                    const tickers = await BinanceService.getAllTickers();
                    const ticker = tickers.find(t => t.symbol === symbolTicker + 'USDT');
                    if (ticker) {
                        quote = { price: parseFloat(ticker.lastPrice), pct: parseFloat(ticker.priceChangePercent) };
                        symbolTicker = item.symbol;
                    }
                } else {
                    quote = await FinnhubService.getQuote(item.symbol);
                }
                
                if (!quote || quote.price === 0) return null;

                return {
                    symbol: symbolTicker.replace('=X', ''),
                    name: item.name,
                    price: quote.price,
                    pct: quote.pct,
                };
            });

            const results = await Promise.all(promises);
            const snapshot = results.filter(r => r !== null);
            setCombinedAssets(snapshot); 

        } catch (e) {
            console.error("Fetch Major Market Snapshot Error:", e);
        }
    };

    // 5c. FETCH WATCHLIST (Digunakan untuk inisialisasi dan sinkronisasi non-crypto)
    const fetchWatchlist = async () => {
        try {
            setLoading(true); 
            let fetchedAssets = []; 
            
            if (!isCrypto) {
                // Default Stats untuk non-crypto
                setVolume24h(100000000000);   
                setMarketCap(2500000000000); 
                setBtcDom(0); 
            }
            
            // Logika Crypto Assets (Digunakan untuk mendapatkan daftar awal dan sinkronisasi statik)
            const cryptos = [
                'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'LTC', 'BCH',
                'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 'ETC', 'FIL', 'ICP',
                'ARB', 'OP', 'MATIC', 'NEAR', 'APT', 'SUI', 'INJ', 'AAVE', 'CRV',
                'LDO', 'RUNE', 'GMX', 'SNX', 'DYDX',
                'FET', 'AGIX', 'OCEAN', 'RNDR', 'TAO', 'WLD',
                'IMX', 'GALA', 'SAND', 'MANA', 'AXS', 'ENJ', 'APE',
                'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BOME',
                'DOGE', 'BABYDOGE', 'BRETT', 'TURBO'
            ];


            if (activeCategory === MARKET_CATEGORIES.CRYPTO) {
                const tickers = await BinanceService.getAllTickers();
                if (tickers.length) {
                    fetchedAssets = tickers
                        .filter(t => cryptos.some(c => t.symbol === c + 'USDT'))
                        .map(t => ({
                            symbol: t.symbol.replace('USDT',''),
                            price: parseFloat(t.lastPrice),
                            change: parseFloat(t.priceChange),
                            pct: parseFloat(t.priceChangePercent),
                            vol: parseFloat(t.quoteVolume),
                            high: parseFloat(t.highPrice),
                            low: parseFloat(t.lowPrice),
                        }));
                    
                    setVolume24h(fetchedAssets.reduce((acc, a) => acc + a.vol, 0));
                    setMarketCap(1200000000000); 
                    setBtcDom(45.5);
                }

            } else {
                // Logika Non-Crypto (Stock/Forex/Indices)
                let targetList = [];
                if (activeCategory === MARKET_CATEGORIES.STOCKS) targetList = ASSET_LISTS.STOCKS;
                else if (activeCategory === MARKET_CATEGORIES.FOREX) targetList = ASSET_LISTS.FOREX;
                else if (activeCategory === MARKET_CATEGORIES.INDICES) targetList = ASSET_LISTS.INDICES;

                const promises = targetList.map(async (item) => {
                    const quote = await FinnhubService.getQuote(item.symbol); 
                    if (!quote || quote.price === 0) return null;
                    
                    return {
                        symbol: item.symbol, name: item.name, price: quote.price, change: quote.change,
                        pct: quote.pct, vol: quote.vol || 0, high: quote.high, low: quote.low
                    };
                });
                
                const results = await Promise.all(promises);
                fetchedAssets = results.filter(r => r !== null);
                
                const status = await FinnhubService.getMarketStatus();
                if(status) setMarketStatus(status);
            }

            setAssets(fetchedAssets);
            setLoading(false);

        } catch (e) { 
            console.error("fetchWatchlist/Indices Error:", e); 
            setLoading(false);
        }
    };

    // FETCH GLOBAL NEWS (Untuk NewsFeed)
    const fetchGlobalNews = async () => {
    try {
        // Ambil dari Finnhub (General dan Forex)
        const [finnhubGeneral, finnhubForex] = await Promise.all([
            FinnhubService.getGeneralNews('general'),
            FinnhubService.getGeneralNews('forex'),
        ]);

        let combined = [...finnhubGeneral, ...finnhubForex];
        
        // Catatan: Karena YahooService.getAssetNews hanya untuk aset spesifik, 
        // kita tidak bisa langsung menggunakannya untuk 'Global News' tanpa simbol.
        // Jika Anda memiliki API yang terpisah untuk Yahoo Global News, tambahkan di sini.

        // combined = [...combined, ...yahooGlobalNews]; // <-- Jika Anda punya sumber lain

        // Urutkan berdasarkan tanggal
        combined.sort((a, b) => (b.datetime || 0) - (a.datetime || 0)); 
        
        // Hapus duplikasi (optional)
        const uniqueNews = Array.from(new Set(combined.map(a => a.id))).map(id => combined.find(a => a.id === id));

        setGlobalNews(uniqueNews); 

    } catch (e) {
        console.error("Fetch Global News Error:", e);
    }
};

    // 6. EFFECT: INITIAL LOAD, POLLING (Non-Crypto) & WATCHLIST WS (Crypto)
    useEffect(() => {
        // 6a. CLEANUP WS LAMA
        if (watchlistWsRef.current) watchlistWsRef.current.close();
        let pollingInterval = null;

        // 6b. AMBIL DATA AWAL & MAJOR SNAPSHOT
        fetchWatchlist();
        fetchMajorMarketSnapshot();
        fetchGlobalNews();

        if (isCrypto) {
            // LOGIC 6c: CRYPTO REALTIME WATCHLIST
            
            // List symbol dari watchlist (harus sama dengan yang ada di fetchWatchlist)
            const cryptos = [
                'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'LTC', 'BCH',
                'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 'ETC', 'FIL', 'ICP',
                'ARB', 'OP', 'MATIC', 'NEAR', 'APT', 'SUI', 'INJ', 'AAVE', 'CRV',
                'LDO', 'RUNE', 'GMX', 'SNX', 'DYDX',
                'FET', 'AGIX', 'OCEAN', 'RNDR', 'TAO', 'WLD',
                'IMX', 'GALA', 'SAND', 'MANA', 'AXS', 'ENJ', 'APE',
                'SHIB', 'PEPE', 'FLOKI', 'BONK', 'WIF', 'BOME',
                'DOGE', 'BABYDOGE', 'BRETT', 'TURBO'
            ];
            
            const streams = cryptos.map(c => `${c.toLowerCase()}usdt@miniTicker`).join('/');
            const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

            try {
                const ws = new WebSocket(wsUrl);
                watchlistWsRef.current = ws;

                ws.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    const ticker = msg.data;
                    
                    if (!ticker || !ticker.s) return; 

                    const symbol = ticker.s.replace('USDT', '');
                    const currentPrice = parseFloat(ticker.c);
                    const priceChangePercent = parseFloat(ticker.pC);

                    setAssets(prevAssets => {
                        const existingAsset = prevAssets.find(a => a.symbol === symbol);
                        
                        if (existingAsset) {
                            // Update asset yang ada dengan data realtime
                            return prevAssets.map(a => 
                                a.symbol === symbol ? {
                                    ...a,
                                    price: currentPrice,
                                    pct: priceChangePercent,
                                    // Volume dan High/Low di-update saat Polling/Awal
                                    // atau menggunakan data 'ticker.q' (quoteVolume) jika ingin realtime volume
                                } : a
                            );
                        } else {
                            // Jika ada asset baru masuk, ini bisa dihandle, tapi kita fokus pada list yang sudah ada
                            return prevAssets;
                        }
                    });
                };
            } catch(e) {
                console.error("Watchlist WS Error:", e);
            }
            
            // Lakukan polling sesekali untuk sinkronisasi Volume/MCAP (setiap 5 menit)
            pollingInterval = setInterval(() => {
                fetchWatchlist(); // Ambil volume/MCAP
                fetchMajorMarketSnapshot(); 
                fetchGlobalNews();
            }, 300000); // 5 menit

        } else {
            // LOGIC 6d: NON-CRYPTO POLLING (Delay 30 detik)
            pollingInterval = setInterval(() => {
                fetchWatchlist();
                fetchMajorMarketSnapshot();
                fetchGlobalNews();
            }, 30000); 
        }

        // 6e. CLEANUP
        return () => { 
            if (pollingInterval) clearInterval(pollingInterval);
            if (watchlistWsRef.current) watchlistWsRef.current.close();
        };
    }, [activeCategory]); 


    // 7. EFFECT: FETCH DETAIL (Hybrid Data)
    // ... (Logic tetap sama) ...
    useEffect(() => {
        setFundamentalData(null); 
        setAssetProfile(null);
        setNews([]);
        
        const loadHybridData = async () => {
            if (isCrypto) {
                const stats = await CryptoCompareService.getAssetStats(selectedAsset);
                setFundamentalData(stats);
            } 

            const profile = await FinnhubService.getProfile(selectedAsset, isCrypto);
            setAssetProfile(profile);

            const newsData = await FinnhubService.getNews(selectedAsset, isCrypto);
            setNews(newsData);
        };

        loadHybridData();
    }, [selectedAsset, isCrypto]);


    // 8. EFFECT: FETCH CANDLES & INITIAL ORDER BOOK
    // ... (Logic tetap sama) ...
    useEffect(() => {
        let isMounted = true;
        
        const loadCandles = async () => {
            setCandleData([]); 
            setLastCandle(null); 
            setOrderBook({ bids: [], asks: [] });
            
            try {
                let data = [];
                if (isCrypto) {
                    data = await BinanceService.getKlines(selectedAsset + 'USDT', timeframe);
                } else {
                    data = await FinnhubService.getStockCandles(selectedAsset, timeframe);
                }
                
                if (isMounted && activeAssetRef.current === selectedAsset) {
                    if (data.length > 0) {
                        setCandleData(data);
                        const last = data[data.length - 1];
                        setLastCandle(last);
                        
                        if (!isCrypto) {
                            setOrderBook({
                                bids: [{ price: last.close * 0.999, qty: 100, total: 1000 }],
                                asks: [{ price: last.close * 1.001, qty: 100, total: 1000 }]
                            });
                        }
                    } else {
                        setCandleData([]);
                    }
                }
            } catch (e) { console.error("Load Candle Error:", e); }
        };

        loadCandles();
        
        return () => { isMounted = false; };
    }, [selectedAsset, timeframe, isCrypto]);


    // 9. EFFECT: WEBSOCKET (Real-time SELECTED asset Chart/OrderBook)
    // ... (Logic tetap sama) ...
    useEffect(() => {
        if (!isCrypto) {
        if (wsRef.current) wsRef.current.close();
        return;
    }

    const targetSymbol = selectedAsset.toLowerCase() + 'usdt';
    const tfMap = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1h', '2H': '2h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M' };
    const interval = tfMap[timeframe] || '1h';
    
    // *** MODIFIKASI INI ***: Gabungkan KLINE dan miniTicker ke dalam satu WS
    const url = `wss://stream.binance.com:9443/stream?streams=${targetSymbol}@kline_${interval}/${targetSymbol}@depth20@100ms/${targetSymbol}@miniTicker`;

    if (wsRef.current) wsRef.current.close();

    try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        
        // Simpan data kline terakhir untuk mengganti harga C (Close) secara realtime
        let latestKlineData = null; 

        ws.onmessage = (e) => {
            if (activeAssetRef.current !== selectedAsset) return;
            const msg = JSON.parse(e.data);
            
            // A. KLINE UPDATE (Mendapatkan data O, H, L dari Bar baru/aktif)
            if (msg.stream.includes('kline')) {
                const k = msg.data.k;
                latestKlineData = { 
                    time: k.t / 1000, 
                    open: parseFloat(k.o), 
                    high: parseFloat(k.h),
                    low: parseFloat(k.l), 
                    close: parseFloat(k.c),
                    volume: parseFloat(k.v)
                };
                
                // Jika bar sudah close (k.x = true), kita pakai harga aslinya
                if (k.x === true) {
                    setLastCandle(latestKlineData);
                }
            }
            
            // B. MINI TICKER UPDATE (Mendapatkan harga C terbaru - Paling Realtime)
            if (msg.stream.includes('miniTicker')) {
                const ticker = msg.data;
                const realtimePrice = parseFloat(ticker.c);

                // Jika kita punya data kline yang sedang aktif (bar belum close)
                if (latestKlineData) {
                    setLastCandle(prev => {
                        const newClose = realtimePrice;
                        const newHigh = Math.max(latestKlineData.high, newClose);
                        const newLow = Math.min(latestKlineData.low, newClose);
                        
                        return {
                            ...latestKlineData,
                            close: newClose, // Paksa harga C menggunakan data realtime dari miniTicker
                            high: newHigh,
                            low: newLow
                        };
                    });
                }
            }

            // C. ORDER BOOK (tetap sama)
            if (msg.stream.includes('depth')) {
                 setOrderBook({
                     bids: msg.data.bids.slice(0,15).map(b=>({price:parseFloat(b[0]), qty:parseFloat(b[1]), total:parseFloat(b[0])*parseFloat(b[1])})),
                     asks: msg.data.asks.slice(0,15).map(a=>({price:parseFloat(a[0]), qty:parseFloat(a[1]), total:parseFloat(a[0])*parseFloat(a[1])})),
                 });
            }
        };
    } catch(e) {}
    return () => { if (wsRef.current) wsRef.current.close(); };

    }, [selectedAsset, timeframe, isCrypto]);

    // 10. LOGIC: SCREENER RUNNER
    const runScreener = () => {
        setScanning(true);
        setTimeout(() => {
            if (assets.length > 0) {
                const results = assets.map(a => ({
                    symbol: a.symbol, price: a.price, pct: a.pct, volume: a.vol,
                    signal: a.pct > 3 ? 'BUY' : a.pct < -3 ? 'SELL' : 'NEUTRAL'
                }));
                setScreenerResults(results);
            }
            setScanning(false);
        }, 500);
    };
    
    // Auto-run screener on initial asset load
    useEffect(() => {
        if (assets.length > 0 && screenerResults.length === 0 && !scanning) runScreener();
    }, [assets]); 


    // 11. HELPER: STYLING UTILS
    // Menggunakan helper yang sudah di hardcode (dari App.jsx sebelumnya)
    const getBgClass = (color) => `bg-[${color}]`;
    const getBorderClass = (color) => `border-[${color}]`;
    const getTextColor = (color) => `text-[${color}]`;


    // 12. RENDER COMPONENT
    return (
        <div className="flex flex-col h-screen w-full bg-black text-gray-400 font-sans overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_3px] opacity-20"></div>
            
            {/* Top Bar: Header & Ticker Tape */}
            <Header indices={indices} marketCap={marketCap} volume24h={volume24h} btcDom={btcDom} marketStatus={marketStatus} />
            <TickerTape combinedAssets={combinedAssets} />
            
            {/* Main Content Area: Watchlist + Chart/Stats */}
            <div className="flex flex-1 overflow-hidden">
                <Watchlist 
                    assets={assets} selectedAsset={selectedAsset}
                    onSelect={(asset) => { setSelectedAsset(asset); setViewMode('chart'); }}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={loading}
                    activeCategory={activeCategory}
                    setActiveCategory={(cat) => {
                        setActiveCategory(cat);
                        // Reset selected asset when category changes
                        if (cat === MARKET_CATEGORIES.CRYPTO) setSelectedAsset('BTC');
                        else if (cat === MARKET_CATEGORIES.STOCKS) setSelectedAsset('AAPL');
                        else if (cat === MARKET_CATEGORIES.FOREX) setSelectedAsset('EURUSD=X');
                        else if (cat === MARKET_CATEGORIES.INDICES) setSelectedAsset('SPY');
                    }}
                />
                
                <div className="flex-1 flex flex-col min-w-0" ref={mainContentRef}>
                    
                    {/* AREA 1: CHART + MARKET STATS */}
                    <div 
                        className="flex-1 flex min-h-0 relative" 
                        style={{ height: `calc(100% - ${bottomPanelHeight}px)` }}
                    >
                        {viewMode === 'chart' ? (
                            <>
                                <ChartWidget 
                                    selectedAsset={selectedAsset} timeframe={timeframe} setTimeframe={setTimeframe}
                                    candleData={candleData} lastCandle={lastCandle} priceData={realtimePriceStats} 
                                />
                                {isCrypto && <OrderBook bids={orderBook.bids} asks={orderBook.asks} />}
                                <MarketStats 
                                    selectedAsset={selectedAsset} priceStats={realtimePriceStats} 
                                    hybridStats={fundamentalData} profile={assetProfile} 
                                    isCrypto={isCrypto} news={news}
                                />
                            </>
                        ) : (
                            // News Reader View
                            <NewsReader news={selectedArticle} onClose={() => setViewMode('chart')} />
                        )}
                    </div>

                    {/* --- DRAG HANDLE (Hardcoded Style) --- */}
                    <div 
                        className={`w-full h-2 ${BG_DARK} ${BORDER_COLOR} hover:bg-amber-500 cursor-ns-resize transition-colors z-40`} 
                        onMouseDown={handleMouseDown} 
                        style={{ flexShrink: 0 }}
                    />
                    
                    {/* AREA 2: SCREENER / NEWS PANEL */}
                    <div 
                        className={`border-t ${BORDER_COLOR} flex flex-col`} 
                        style={{ 
                            height: `${bottomPanelHeight}px`, 
                            minHeight: `${minBottomHeight}px`, 
                            maxHeight: `${maxBottomHeight}px`,
                            flexShrink: 0 
                        }} 
                    >
                        {/* Tab Buttons Container */}
                        <div className={`flex border-b ${BORDER_COLOR} ${BG_DARK}`}>
                            {['screener', 'news'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActivePanel(tab)} 
                                    className={`px-4 py-2 text-[10px] font-bold border-r ${BORDER_COLOR} ${tab === 'screener' && activePanel === 'screener' ? BG_PANEL : BG_DARK} ${activePanel===tab 
                                        ? `${ACCENT_TEXT} border-t-2 border-amber-500` 
                                        : 'text-gray-600'}`}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        
                        {/* Panel Content Area */}
                        <div className='flex-1 overflow-y-auto custom-scrollbar'>
                            {activePanel === 'screener' && <ScreenerPanel results={screenerResults} onScan={runScreener} scanning={scanning} />}
                            {activePanel === 'news' && <NewsFeed news={globalNews} onNewsClick={(a) => { setSelectedArticle(a); setViewMode('news'); }} />}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Global CSS (Marquee animation needs to stay here or in global CSS) */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; } 
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
                .animate-marquee { animation: marquee 30s linear infinite; }
                .fade-in { animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                /* Hardcoded Scrollbar Style for consistency */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFB800; }
            `}</style>
        </div>
    );
};

export default App;