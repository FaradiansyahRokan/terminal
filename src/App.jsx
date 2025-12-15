import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BinanceService, FinnhubService, CryptoCompareService } from './services/api'; 
import { formatNumber, MARKET_CATEGORIES, ASSET_LISTS } from './utils/constants'; 
// import calculateRSI from './utils/indicators'; // Dihapus, menggunakan technicalindicators
import { RSI } from 'technicalindicators'; // Diimpor

// Import Components
import Header from './components/Header';
import Watchlist from './components/Watchlist';
import ChartWidget from './components/ChartWidget';
import OrderBook from './components/OrderBook';
import MarketStats from './components/MarketStats';
import ScreenerPanel from './components/ScreenerPanel';
import NewsFeed from './components/NewsFeed';
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
    
    // viewMode dan selectedArticle dihapus
    // const [viewMode, setViewMode] = useState('chart'); 
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
    const [rsiData, setRsiData] = useState([]); // State untuk RSI Data Chart

    // GLOBAL HEADER STATS
    const [marketCap, setMarketCap] = useState(0);
    const [volume24h, setVolume24h] = useState(0);
    const [btcDom, setBtcDom] = useState(0);
    const [indices, setIndices] = useState([
        { symbol: 'S&P 500', ticker: 'SPY', price: '-', pct: '0%', positive: true }, 
        { symbol: 'NASDAQ', ticker: 'QQQ', price: '-', pct: '0%', positive: true },
    ]);

    // REFS
    const wsRef = useRef(null); 
    const watchlistWsRef = useRef(null); 
    const activeAssetRef = useRef(selectedAsset);
    const mainContentRef = useRef(null); 

    useEffect(() => { activeAssetRef.current = selectedAsset; }, [selectedAsset]);

    // 2. HELPER: CATEGORY CHECK
    const isCrypto = activeCategory === MARKET_CATEGORIES.CRYPTO;

    // 3. MEMO: REALTIME PRICE STATS (RSI Header Calculation - Menggunakan data sederhana)
    // NOTE: calculateRSI dari utils sudah dihapus, kita hitung RSI sederhana dari candle data
    const realtimePriceStats = useMemo(() => {
        const assetInfo = assets.find(a => a.symbol === selectedAsset || a.symbol === selectedAsset + 'USDT');
        
        const currentPrice = (isCrypto && lastCandle) ? lastCandle.close : (assetInfo ? assetInfo.price : 0);
        
        let realRSI = '50';
        // Hitung RSI sederhana untuk display header (menggunakan candleData)
        if (candleData.length > 14) {
             const closes = candleData.map(c => c.close).filter(c => c != null);
             if (closes.length >= 14) {
                 const rsiCalc = RSI.calculate({ values: closes, period: 14 });
                 realRSI = rsiCalc.length > 0 ? rsiCalc[rsiCalc.length - 1].toFixed(2) : '50';
             }
        }


        return {
            price: currentPrice,
            positive: (assetInfo ? assetInfo.pct : 0) >= 0,
            changePct: assetInfo ? assetInfo.pct.toFixed(2) : '0.00',
            rsi: realRSI, // RSI untuk display di MarketStats
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
    
    // 5a. FETCH INDICES
    const fetchIndices = async () => {
        const newIndices = await Promise.all(
            indices.map(async (index) => {
                const quote = await FinnhubService.getQuote(index.ticker);
                const price = quote.price > 0 ? quote.price : index.price;
                const pct = quote.pct !== 0 ? quote.pct : 0; 
                
                return { ...index, price: price, pct: pct, positive: pct >= 0 };
            })
        );
        setIndices(newIndices);
        return newIndices;
    };

    // 5b. FETCH MAJOR MARKET SNAPSHOT
    const fetchMajorMarketSnapshot = async () => {
        // ... (Logic remains the same) ...
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

                return { symbol: symbolTicker.replace('=X', ''), name: item.name, price: quote.price, pct: quote.pct };
            });

            const results = await Promise.all(promises);
            const snapshot = results.filter(r => r !== null);
            setCombinedAssets(snapshot); 
        } catch (e) { console.error("Fetch Major Market Snapshot Error:", e); }
    };

    // 5c. FETCH WATCHLIST
    const fetchWatchlist = async () => {
        // ... (Logic remains the same) ...
        try {
            setLoading(true); 
            let fetchedAssets = []; 
            
            if (!isCrypto) {
                setVolume24h(100000000000);   
                setMarketCap(2500000000000); 
                setBtcDom(0); 
            }
            
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
                            symbol: t.symbol.replace('USDT',''), price: parseFloat(t.lastPrice),
                            change: parseFloat(t.priceChange), pct: parseFloat(t.priceChangePercent),
                            vol: parseFloat(t.quoteVolume), high: parseFloat(t.highPrice), low: parseFloat(t.lowPrice),
                        }));
                    
                    setVolume24h(fetchedAssets.reduce((acc, a) => acc + a.vol, 0));
                    setMarketCap(1200000000000); 
                    setBtcDom(45.5);
                }

            } else {
                let targetList = [];
                if (activeCategory === MARKET_CATEGORIES.STOCKS) targetList = ASSET_LISTS.STOCKS;
                else if (activeCategory === MARKET_CATEGORIES.FOREX) targetList = ASSET_LISTS.FOREX;
                else if (activeCategory === MARKET_CATEGORIES.INDICES) targetList = ASSET_LISTS.INDICES;

                const promises = targetList.map(async (item) => {
                    const quote = await FinnhubService.getQuote(item.symbol); 
                    if (!quote || quote.price === 0) return null;
                    
                    return { symbol: item.symbol, name: item.name, price: quote.price, change: quote.change,
                        pct: quote.pct, vol: quote.vol || 0, high: quote.high, low: quote.low };
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
        
        // Urutkan berdasarkan tanggal
        combined.sort((a, b) => (b.datetime || 0) - (a.datetime || 0)); 
        
        // Hapus duplikasi
        const uniqueNews = Array.from(new Set(combined.map(a => a.url))).map(url => combined.find(a => a.url === url));

        setGlobalNews(uniqueNews); 

    } catch (e) {
        console.error("Fetch Global News Error:", e);
    }
    };

    // 6. EFFECT: INITIAL LOAD, POLLING (Non-Crypto) & WATCHLIST WS (Crypto)
    useEffect(() => {
        // ... (Logic tetap sama) ...
        if (watchlistWsRef.current) watchlistWsRef.current.close();
        let pollingInterval = null;

        fetchWatchlist();
        fetchMajorMarketSnapshot();
        fetchGlobalNews();

        if (isCrypto) {
            // LOGIC 6c: CRYPTO REALTIME WATCHLIST
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
                            return prevAssets.map(a => 
                                a.symbol === symbol ? {
                                    ...a,
                                    price: currentPrice,
                                    pct: priceChangePercent,
                                } : a
                            );
                        } else { return prevAssets; }
                    });
                };
            } catch(e) { console.error("Watchlist WS Error:", e); }
            
            // Lakukan polling sesekali untuk sinkronisasi Volume/MCAP (setiap 5 menit)
            pollingInterval = setInterval(() => {
                fetchWatchlist(); fetchMajorMarketSnapshot(); fetchGlobalNews();
            }, 300000); 

        } else {
            // LOGIC 6d: NON-CRYPTO POLLING (Delay 30 detik)
            pollingInterval = setInterval(() => {
                fetchWatchlist(); fetchMajorMarketSnapshot(); fetchGlobalNews();
            }, 30000); 
        }

        // 6e. CLEANUP
        return () => { 
            if (pollingInterval) clearInterval(pollingInterval);
            if (watchlistWsRef.current) watchlistWsRef.current.close();
        };
    }, [activeCategory]); 


    // 7. EFFECT: FETCH DETAIL (Hybrid Data)
    useEffect(() => {
        setFundamentalData(null); setAssetProfile(null); setNews([]);
        
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


    // 8. EFFECT: FETCH CANDLES & INDICATORS
    useEffect(() => {
        let isMounted = true;
        
        const loadCandles = async () => {
            setCandleData([]); 
            setLastCandle(null); 
            setOrderBook({ bids: [], asks: [] });
            setRsiData([]); // Reset RSI Data
            
            try {
                let fetchedCandleData = []; 
                
                if (isCrypto) {
                    fetchedCandleData = await BinanceService.getKlines(selectedAsset + 'USDT', timeframe);
                } else {
                    fetchedCandleData = await FinnhubService.getStockCandles(selectedAsset, timeframe);
                }
                
                if (isMounted && activeAssetRef.current === selectedAsset) {
                    
                    if (fetchedCandleData.length > 0) {
                        
                        // 1. Set Candle Data
                        setCandleData(fetchedCandleData);
                        
                        // 2. Set Last Candle
                        const last = fetchedCandleData[fetchedCandleData.length - 1];
                        setLastCandle(last);
                        
                        // 3. Hitung RSI dan Set State rsiData
                        const closes = fetchedCandleData.map(d => d.close).filter(c => c != null);
                        
                        if (closes.length >= 14) { 
                            const rsiValues = RSI.calculate({ values: closes, period: 14 }); 
                            
                            // Map RSI values kembali ke format Lightweight Charts
                            const formattedRsi = rsiValues.map((rsiVal, index) => ({
                                // Sesuaikan timestamp RSI dengan candle yang sesuai
                                time: fetchedCandleData[index + (14 - 1)].time, 
                                value: rsiVal
                            }));
                            setRsiData(formattedRsi);
                        } else {
                            setRsiData([]);
                        }
                        
                        if (!isCrypto) {
                            setOrderBook({
                                bids: [{ price: last.close * 0.999, qty: 100, total: 1000 }],
                                asks: [{ price: last.close * 1.001, qty: 100, total: 1000 }]
                            });
                        }
                    } else {
                        setCandleData([]);
                        setRsiData([]);
                    }
                }
            } catch (e) { 
                console.error("Load Candle Error:", e); 
                if (isMounted) {
                    setCandleData([]);
                    setRsiData([]);
                }
            }
        };

        loadCandles();
        
        return () => { isMounted = false; };
    }, [selectedAsset, timeframe, isCrypto]);


    // 9. EFFECT: WEBSOCKET (Real-time SELECTED asset Chart/OrderBook)
    useEffect(() => {
        if (!isCrypto) {
        if (wsRef.current) wsRef.current.close();
        return;
    }

    const targetSymbol = selectedAsset.toLowerCase() + 'usdt';
    const tfMap = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1h', '2H': '2h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M' };
    const interval = tfMap[timeframe] || '1h';
    
    // Gabungkan KLINE, miniTicker, dan Depth ke dalam satu WS
    const url = `wss://stream.binance.com:9443/stream?streams=${targetSymbol}@kline_${interval}/${targetSymbol}@depth20@100ms/${targetSymbol}@miniTicker`;

    if (wsRef.current) wsRef.current.close();

    try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        
        let latestKlineData = null; 

        ws.onmessage = (e) => {
            if (activeAssetRef.current !== selectedAsset) return;
            const msg = JSON.parse(e.data);
            
            // A. KLINE UPDATE
            if (msg.stream.includes('kline')) {
                const k = msg.data.k;
                latestKlineData = { 
                    time: k.t / 1000, open: parseFloat(k.o), high: parseFloat(k.h),
                    low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v)
                };
                
                if (k.x === true) {
                    setLastCandle(latestKlineData);
                }
            }
            
            // B. MINI TICKER UPDATE (untuk harga realtime paling cepat)
            if (msg.stream.includes('miniTicker')) {
                const ticker = msg.data;
                const realtimePrice = parseFloat(ticker.c);

                if (latestKlineData) {
                    setLastCandle(prev => {
                        const newClose = realtimePrice;
                        const newHigh = Math.max(latestKlineData.high, newClose);
                        const newLow = Math.min(latestKlineData.low, newClose);

                        // Trigger RSI re-calculation based on new close price
                        setRsiData(prevRsi => {
                            const currentCloses = candleData.map(c => c.close).filter(c => c != null);
                            // Cek jika candleData sudah dimuat
                            if (currentCloses.length === 0) return []; 

                            // Update close price untuk candle terakhir (yang sedang aktif)
                            currentCloses[currentCloses.length - 1] = newClose; 

                            if (currentCloses.length >= 14) {
                                const rsiValues = RSI.calculate({ values: currentCloses, period: 14 }); 
                                
                                // RSI data hanya perlu di-update satu nilai terakhir
                                const lastRsiValue = rsiValues[rsiValues.length - 1];
                                
                                // Jika prevRsi kosong, kita ambil data penuh
                                if (prevRsi.length === 0) return prevRsi;
                                
                                // Ganti nilai RSI terakhir
                                return prevRsi.map((r, index) => 
                                    index === prevRsi.length - 1 ? 
                                    { ...r, value: lastRsiValue } : r
                                );
                            }
                            return prevRsi;
                        });
                        
                        return {
                            ...latestKlineData,
                            close: newClose,
                            high: newHigh,
                            low: newLow
                        };
                    });
                }
            }

            // C. ORDER BOOK
            if (msg.stream.includes('depth')) {
                 setOrderBook({
                     bids: msg.data.bids.slice(0,15).map(b=>({price:parseFloat(b[0]), qty:parseFloat(b[1]), total:parseFloat(b[0])*parseFloat(b[1])})),
                     asks: msg.data.asks.slice(0,15).map(a=>({price:parseFloat(a[0]), qty:parseFloat(a[1]), total:parseFloat(a[0])*parseFloat(a[1])})),
                 });
            }
        };
    } catch(e) {}
    return () => { if (wsRef.current) wsRef.current.close(); };

    }, [selectedAsset, timeframe, isCrypto, candleData]); // Tambahkan candleData agar RSI update

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
                    onSelect={(asset) => { setSelectedAsset(asset); }} // viewMode('chart') tidak lagi diperlukan
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={loading}
                    activeCategory={activeCategory}
                    setActiveCategory={(cat) => {
                        setActiveCategory(cat);
                        if (cat === MARKET_CATEGORIES.CRYPTO) setSelectedAsset('BTC');
                        else if (cat === MARKET_CATEGORIES.STOCKS) setSelectedAsset('AAPL');
                        else if (cat === MARKET_CATEGORIES.FOREX) setSelectedAsset('EURUSD=X');
                        else if (cat === MARKET_CATEGORIES.INDICES) setSelectedAsset('SPY');
                    }}
                />
                
                <div className="flex-1 flex flex-col min-w-0" ref={mainContentRef}>
                    
                    {/* AREA 1: CHART + MARKET STATS (Tanpa conditional viewMode) */}
                    <div 
                        className="flex-1 flex min-h-0 relative" 
                        style={{ height: `calc(100% - ${bottomPanelHeight}px)` }}
                    >
                        <ChartWidget 
                            selectedAsset={selectedAsset} timeframe={timeframe} setTimeframe={setTimeframe}
                            candleData={candleData} lastCandle={lastCandle} priceData={realtimePriceStats} 
                            rsiData={rsiData} // Prop baru untuk RSI Chart
                        />
                        
                        {isCrypto && <OrderBook bids={orderBook.bids} asks={orderBook.asks} />}
                        
                        <MarketStats 
                            selectedAsset={selectedAsset} priceStats={realtimePriceStats} 
                            hybridStats={fundamentalData} profile={assetProfile} 
                            isCrypto={isCrypto} news={news}
                        />
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
                            {activePanel === 'news' && <NewsFeed news={globalNews} />} {/* onNewsClick dihapus */}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Global CSS */}
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