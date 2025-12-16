// src/App.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BinanceService, FinnhubService, CryptoCompareService } from './services/api'; 
import { MARKET_CATEGORIES, ASSET_LISTS } from './utils/constants'; 
import { calculateRSI } from './utils/indicators'; // Pastikan import ini ada

// Import Components
import Header from './components/Header';
import Watchlist from './components/Watchlist';
import ChartWidget from './components/ChartWidget';
import OrderBook from './components/OrderBook';
import MarketStats from './components/MarketStats';
import ScreenerPanel from './components/ScreenerPanel';
import NewsFeed from './components/NewsFeed';
import TickerTape from './components/TickerTape';

// --- KONFIGURASI INTERVAL ---
const STOCK_POLLING_MS = 120000; 
const NEWS_POLLING_MS = 300000; 

// --- STYLING ---
const ACCENT_TEXT = 'text-amber-500';
const BORDER_COLOR = 'border-[#333333]'; 
const BG_PANEL = 'bg-[#1E1E1E]'; 
const BG_DARK = 'bg-[#0D0D0D]'; 

const App = () => {
    // --- State Management ---
    const [activeCategory, setActiveCategory] = useState(MARKET_CATEGORIES.CRYPTO); 
    const [selectedAsset, setSelectedAsset] = useState('BTC');
    const [timeframe, setTimeframe] = useState('1H');
    const [searchQuery, setSearchQuery] = useState('');
    const [activePanel, setActivePanel] = useState('screener');
    const [viewMode, setViewMode] = useState('chart');
    const [selectedArticle, setSelectedArticle] = useState(null); 
    
    // RESIZE STATE
    const [bottomPanelHeight, setBottomPanelHeight] = useState(256); 
    const minBottomHeight = 256;
    const maxBottomHeight = 700; 

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

    const [realtimePriceStats, setRealtimePriceStats] = useState({ 
        price: 0, pct: 0, high: 0, low: 0, open: 0, rsi: 50 
    }); 
    
    const [combinedAssets, setCombinedAssets] = useState([]); 

    const [marketCap, setMarketCap] = useState(0);
    const [volume24h, setVolume24h] = useState(0);
    const [btcDom, setBtcDom] = useState(0);
    const [indices, setIndices] = useState([
        { symbol: '^GSPC', ticker: 'SPY', price: '-', pct: 0, positive: true }, 
        { symbol: '^IXIC', ticker: 'QQQ', price: '-', pct: 0, positive: true },
    ]);

    const wsRef = useRef(null); 
    const watchlistWsRef = useRef(null); 
    const activeAssetRef = useRef(selectedAsset);
    const assetMapRef = useRef(new Map()); 

    useEffect(() => { activeAssetRef.current = selectedAsset; }, [selectedAsset]);

    const isCrypto = activeCategory === MARKET_CATEGORIES.CRYPTO;

    // --- 1. FETCH INDICES & NEWS ---
    const fetchIndices = useCallback(async () => {
        try {
            const indexPromises = indices.map(index => FinnhubService.getQuote(index.symbol));
            const quotes = await Promise.all(indexPromises);
            
            const newIndices = indices.map((index, i) => {
                const quote = quotes[i];
                const price = quote.price > 0 ? quote.price : index.price;
                const pct = quote.pct !== 0 ? quote.pct : 0; 
                return { ...index, price: price, pct: pct, positive: pct >= 0 };
            });
            setIndices(newIndices);
        } catch(e) {}
    }, []); 

    const fetchGlobalNews = useCallback(async () => {
        try {
            const general = await FinnhubService.getGeneralNews('general');
            if(general.length > 0) setGlobalNews(general); 
        } catch (e) { console.error("News Error", e); }
    }, []); 

    const fetchMajorMarketSnapshot = useCallback(async () => {
        try {
            const majorAssets = ASSET_LISTS.MAJOR_MARKET;
            
            const promises = majorAssets.map(async (item) => {
                let quote = null;
                let symbolTicker = item.symbol;

                if (item.source === 'crypto') {
                    // Coba ambil dari Binance API (Format USDT)
                    // Jika ini gagal dan masuk ke fallback Finnhub/Yahoo,
                    // logika baru di api.js tadi akan otomatis mengubah USDT jadi -USD.
                    quote = await FinnhubService.getQuote(item.symbol + 'USDT'); 
                    
                    // Jika gagal, coba format standar
                    if (!quote || quote.price === 0) quote = await FinnhubService.getQuote(item.symbol);
                } else {
                    // Stocks/Indices/Forex
                    quote = await FinnhubService.getQuote(item.symbol);
                }
                
                if (!quote || quote.price === 0) return null;

                return {
                    symbol: symbolTicker.replace('=X', '').replace('^', ''),
                    name: item.name,
                    price: quote.price,
                    pct: quote.pct,
                    vol: quote.vol || 0,
                };
            });

            const results = await Promise.all(promises);
            const snapshot = results.filter(r => r !== null);
            setCombinedAssets(snapshot); 

        } catch (e) {
            console.error("Fetch Major Market Snapshot Error:", e);
        }
    }, []);

    // --- 2. FETCH WATCHLIST ---
    const fetchWatchlist = useCallback(async (isInitial = false) => {
        if (loading && !isInitial) return;
        
        try {
            if(isInitial) setLoading(true);
            let fetchedAssets = []; 
            
            if (isCrypto) {
                const tickers = await BinanceService.getAllTickers();
                const cryptoSymbols = [
                    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'LTC', 'BCH',
                    'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 'ETC', 'FIL', 'ICP',
                    'MATIC', 'NEAR', 'APT', 'SUI', 'INJ', 'AAVE', 'PEPE', 'SHIB'
                ]; 

                if (tickers.length) {
                    fetchedAssets = tickers
                        .filter(t => cryptoSymbols.some(c => t.symbol === c + 'USDT'))
                        .map(t => ({
                            symbol: t.symbol.replace('USDT',''),
                            price: parseFloat(t.lastPrice),
                            change: parseFloat(t.priceChange),
                            pct: parseFloat(t.priceChangePercent),
                            vol: parseFloat(t.quoteVolume),
                            high: parseFloat(t.highPrice),
                            low: parseFloat(t.lowPrice),
                            basePrice: parseFloat(t.openPrice), 
                            category: MARKET_CATEGORIES.CRYPTO
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

                const quotes = await Promise.all(targetList.map(item => FinnhubService.getQuote(item.symbol)));

                fetchedAssets = targetList.map((item, i) => {
                    const quote = quotes[i];
                    if (!quote || quote.price === 0) return null;
                    return {
                        symbol: item.symbol, name: item.name, price: quote.price, change: quote.change,
                        pct: quote.pct, vol: quote.vol || 0, high: quote.high, low: quote.low,
                        basePrice: quote.prevClose || quote.open,
                        category: activeCategory
                    };
                }).filter(r => r !== null);
                
                setVolume24h(100000000000);   
                setMarketCap(2500000000000); 
                setBtcDom(0); 
            }
            
            assetMapRef.current = new Map(fetchedAssets.map(a => [a.symbol, a])); 
            setAssets(fetchedAssets);
            if(isInitial) setLoading(false);

        } catch (e) { 
            console.error("fetchWatchlist Error:", e); 
            setLoading(false);
        }
    }, [activeCategory, isCrypto]);

    

    // --- 3. WS UPDATE ---
    const updateAssetFromWS = useCallback((ticker) => {
        const symbol = ticker.s.replace('USDT', '');
        const currentAssetsMap = assetMapRef.current;
        const oldAsset = currentAssetsMap.get(symbol);
        
        if (oldAsset) {
            const currentPrice = parseFloat(ticker.c);
            const openPrice = parseFloat(ticker.o);
            const calculatedPct = openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0;

            const updatedAsset = {
                ...oldAsset,
                price: currentPrice,
                pct: calculatedPct, 
                high: parseFloat(ticker.h),
                low: parseFloat(ticker.l),
                vol: parseFloat(ticker.q),
                basePrice: openPrice 
            };
            
            currentAssetsMap.set(symbol, updatedAsset);
            setAssets(Array.from(currentAssetsMap.values()));
        }
    }, []);

    // --- 4. MASTER EFFECT ---
    useEffect(() => {
        if (watchlistWsRef.current) watchlistWsRef.current.close();
        let stockInterval = null;
        let newsInterval = null;

        const init = async () => {
            await fetchIndices();
            await fetchGlobalNews();
            await fetchWatchlist(true);
            await fetchMajorMarketSnapshot();

            if (!isCrypto) {
                stockInterval = setInterval(() => fetchWatchlist(false), STOCK_POLLING_MS);
            }
            newsInterval = setInterval(() => {
                fetchGlobalNews();
                fetchIndices();
            }, NEWS_POLLING_MS);
        };
        init();

        if (isCrypto) {
            const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'TRX', 'LTC', 'MATIC', 'NEAR', 'APT', 'SUI', 'INJ', 'AAVE', 'PEPE', 'SHIB'];
            const streams = cryptoSymbols.map(c => `${c.toLowerCase()}usdt@miniTicker`).join('/');
            const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;

            try {
                const ws = new WebSocket(wsUrl);
                watchlistWsRef.current = ws;
                ws.onmessage = (e) => {
                    const msg = JSON.parse(e.data);
                    const ticker = msg.data;
                    if (!ticker || !ticker.s) return; 
                    updateAssetFromWS(ticker); 
                };
            } catch(e) { console.error("WS Error", e); }
        }
        
        return () => { 
            if (stockInterval) clearInterval(stockInterval);
            if (newsInterval) clearInterval(newsInterval);
            if (watchlistWsRef.current) watchlistWsRef.current.close();
        };
    }, [isCrypto, fetchWatchlist, fetchIndices, fetchGlobalNews, updateAssetFromWS]);

    // --- 5. DETAIL ASSET & RSI ---
    useEffect(() => {
        const currentAssetData = assets.find(a => a.symbol === selectedAsset);
        
        let rsiValue = 50;
        if (candleData.length > 0) {
            const allCandles = [...candleData];
            if (lastCandle) {
                const lastIdx = allCandles.length - 1;
                if (allCandles[lastIdx].time === lastCandle.time) {
                    allCandles[lastIdx] = lastCandle;
                } else {
                    allCandles.push(lastCandle);
                }
            }
            rsiValue = calculateRSI(allCandles, 14);
        }

        if (currentAssetData) {
            setRealtimePriceStats({
                price: currentAssetData.price,
                pct: currentAssetData.pct, 
                high: currentAssetData.high,
                low: currentAssetData.low,
                open: currentAssetData.basePrice || currentAssetData.open, 
                changePct: currentAssetData.pct ? currentAssetData.pct.toFixed(2) : "0.00",
                positive: (currentAssetData.pct || 0) >= 0,
                rsi: rsiValue 
            });
        }
    }, [selectedAsset, assets, candleData, lastCandle]); 

    useEffect(() => {
        setFundamentalData(null); 
        setAssetProfile(null);
        setNews([]);
        
        const loadHybrid = async () => {
             if (isCrypto) {
                const stats = await CryptoCompareService.getAssetStats(selectedAsset);
                setFundamentalData(stats);
            }
            const profile = await FinnhubService.getProfile(selectedAsset, isCrypto);
            setAssetProfile(profile);
            const newsData = await FinnhubService.getNews(selectedAsset, isCrypto);
            setNews(newsData);
        };
        loadHybrid();
    }, [selectedAsset, isCrypto]);

    // --- 6. CANDLE EFFECT ---
    useEffect(() => {
        let isMounted = true;
        const loadCandles = async () => {
            setCandleData([]); 
            setLastCandle(null); 
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
                        setLastCandle(data[data.length - 1]);
                    }
                }
            } catch (e) {}
        };
        loadCandles();
        return () => { isMounted = false; };
    }, [selectedAsset, timeframe, isCrypto]);

    // --- 7. CHART WEBSOCKET ---
    useEffect(() => {
        if (!isCrypto) { if (wsRef.current) wsRef.current.close(); return; }

        const targetSymbol = selectedAsset.toLowerCase() + 'usdt';
        const tfMap = { '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', '1H': '1h', '2H': '2h', '4H': '4h', '1D': '1d', '1W': '1w', '1M': '1M' };
        const interval = tfMap[timeframe] || '1h';
        const url = `wss://stream.binance.com:9443/stream?streams=${targetSymbol}@kline_${interval}/${targetSymbol}@depth20@100ms`;

        if (wsRef.current) wsRef.current.close();

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;
            
            ws.onmessage = (e) => {
                if (activeAssetRef.current !== selectedAsset) return;
                const msg = JSON.parse(e.data);
                
                if (msg.stream.includes('kline')) {
                    const k = msg.data.k;
                    const candle = { 
                        time: k.t / 1000, open: parseFloat(k.o), high: parseFloat(k.h),
                        low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v)
                    };
                    setLastCandle(candle);
                }
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

    // --- SCREENER LOGIC ---
    useEffect(() => {
        if (assets.length > 0 && screenerResults.length === 0 && !scanning) {
             const results = assets.map(a => ({
                symbol: a.symbol, price: a.price, pct: a.pct, volume: a.vol,
                signal: (a.pct || 0) > 3 ? 'BUY' : (a.pct || 0) < -3 ? 'SELL' : 'NEUTRAL'
            })).filter(r => r.signal !== 'NEUTRAL'); 
            setScreenerResults(results);
        }
    }, [assets]);

    // ----------------------------------------------------
    // 🔥 FIX: FUNGSI RESIZER YANG DITAMBAHKAN KEMBALI 🔥
    // ----------------------------------------------------
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = bottomPanelHeight;

        const handleMouseMove = (moveEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newHeight = startHeight + deltaY;

            if (newHeight >= minBottomHeight && newHeight <= maxBottomHeight) {
                setBottomPanelHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [bottomPanelHeight, minBottomHeight, maxBottomHeight]);


    // --- RENDER ---
    return (
        <div className="flex flex-col h-screen w-full bg-black text-gray-400 font-sans overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_3px] opacity-20"></div>
            
            <Header indices={indices} marketCap={marketCap} volume24h={volume24h} btcDom={btcDom} marketStatus={marketStatus} />
            <TickerTape combinedAssets={combinedAssets} /> 
            
            <div className="flex flex-1 overflow-hidden">
                <Watchlist 
                    assets={assets} selectedAsset={selectedAsset}
                    onSelect={(asset) => { setSelectedAsset(asset); setViewMode('chart'); }}
                    searchQuery={searchQuery} setSearchQuery={setSearchQuery} loading={loading}
                    activeCategory={activeCategory}
                    setActiveCategory={(cat) => {
                        setActiveCategory(cat);
                        if (cat === MARKET_CATEGORIES.CRYPTO) setSelectedAsset('BTC');
                        else if (cat === MARKET_CATEGORIES.STOCKS) setSelectedAsset('AAPL');
                        else if (cat === MARKET_CATEGORIES.FOREX) setSelectedAsset('EURUSD=X');
                        else if (cat === MARKET_CATEGORIES.INDICES) setSelectedAsset('^GSPC');
                    }}
                />
                
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 flex min-h-0 relative" style={{ height: `calc(100% - ${bottomPanelHeight}px)` }}>
                        {viewMode === 'chart' ? (
                            <>
                                <ChartWidget 
                                    selectedAsset={selectedAsset} timeframe={timeframe} setTimeframe={setTimeframe}
                                    candleData={candleData} lastCandle={lastCandle} 
                                    priceData={realtimePriceStats}
                                />
                                {isCrypto && <OrderBook bids={orderBook.bids} asks={orderBook.asks} />}
                                <MarketStats 
                                    selectedAsset={selectedAsset} 
                                    priceStats={realtimePriceStats}
                                    hybridStats={fundamentalData} profile={assetProfile} 
                                    isCrypto={isCrypto} news={news}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                                <div className="p-10 border border-gray-700 bg-black">
                                    <h2 className="text-2xl font-bold mb-2">{selectedArticle?.headline}</h2>
                                    <p className="mb-4">{selectedArticle?.summary}</p>
                                    <button onClick={() => setViewMode('chart')} className="text-amber-500 underline">Back to Chart</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🔥 FIX: ATTACH HANDLER KE DIV RESIZER 
                      onMouseDown={handleMouseDown} ditambahkan di sini
                    */}
                    <div 
                        onMouseDown={handleMouseDown}
                        className={`w-full h-2 ${BG_DARK} ${BORDER_COLOR} hover:bg-amber-500 cursor-ns-resize z-40 transition-colors`} 
                    />
                    
                    <div className={`border-t ${BORDER_COLOR} flex flex-col`} style={{ height: `${bottomPanelHeight}px`, flexShrink: 0 }}>
                        <div className={`flex border-b ${BORDER_COLOR} ${BG_DARK}`}>
                            {['screener', 'news'].map(tab => (
                                <button key={tab} onClick={() => setActivePanel(tab)} 
                                    className={`px-4 py-2 text-[10px] font-bold border-r ${BORDER_COLOR} ${activePanel===tab ? `${ACCENT_TEXT} bg-[#1E1E1E]` : ''}`}>
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className='flex-1 overflow-y-auto custom-scrollbar'>
                            {activePanel === 'screener' && <ScreenerPanel results={screenerResults} onScan={()=>{}} scanning={scanning} />}
                            {activePanel === 'news' && <NewsFeed news={globalNews} onNewsClick={(a) => { setSelectedArticle(a); setViewMode('news'); }} />}
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFB800; }
            `}} />
        </div>
    );
};

export default App;