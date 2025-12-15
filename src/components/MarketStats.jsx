import React from 'react';
import { Activity, Layers, Tag, Zap, Newspaper, ExternalLink, Clock, DollarSign, TrendingUp, Database } from 'lucide-react';
import { formatNumber, formatCompact } from '../utils/constants'; // THEME tidak diimpor lagi

// --- HARDCODED COLORS FOR STABILITY ---
const ACCENT_COLOR = 'text-amber-500';
const SUCCESS_COLOR = 'text-green-400';
const DANGER_COLOR = 'text-red-500';
const WARNING_COLOR = 'text-orange-500';
const BG_PANEL = 'bg-[#1E1E1E]'; 
const BG_DARK = 'bg-[#0D0D0D]'; 
const BORDER_COLOR = 'border-[#333333]'; 
const BORDER_DARK = 'border-[#1A1A1A]';

const MarketStats = ({ selectedAsset, priceStats, hybridStats, profile, isCrypto, news }) => {
    
    // 1. DATA PROCESSING & DESTRUCTURING
    const mCap = hybridStats?.marketCap;
    const supply = hybridStats?.supply;
    const high24 = priceStats?.high || 0;
    const low24 = priceStats?.low || 0;
    // Pastikan RSI di parse ke float untuk logika perbandingan
    const currentRSI = parseFloat(priceStats?.rsi || 50);

    // 2. SYMBOL CLEANING
    const cleanSymbol = selectedAsset.replace('=X', '').replace('^', '');
    
    // 3. FULL NAME LOGIC
    let fullName = profile?.name || cleanSymbol;
    if (!isCrypto && cleanSymbol.length === 6 && /^[A-Z]+$/.test(cleanSymbol)) {
        fullName = cleanSymbol.substring(0, 3) + '/' + cleanSymbol.substring(3);
    }
    const isForex = cleanSymbol.includes('/');

    // 4. HELPER: FORMAT TIME AGO
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const diff = Math.floor(Date.now() / 1000) - timestamp;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    // 5. HELPER: MARKET CAP RENDER
    const renderMarketCap = () => {
        if (isForex) return <span className="text-gray-500">N/A</span>;
        if (!mCap && mCap !== 0) return <span className="text-gray-600 text-[9px] animate-pulse">Fetching...</span>;
        if (mCap === 'N/A' || mCap === 0) return <span className="text-gray-500">-</span>;
        return `$${formatCompact(mCap)}`;
    };

    // 6. HELPER: SUPPLY RENDER
    const renderSupply = () => {
        // Menggunakan ACCENT_COLOR
        if (!isCrypto) return <span className={ACCENT_COLOR}>N/A (Liquid)</span>;
        if (!supply) return <span className="text-gray-600 text-[9px]">-</span>;
        return formatCompact(supply);
    };
    
    // 7. HELPER: RSI INTERPRETATION
    const rsiSentiment = (rsi) => {
        if (rsi > 70) return { label: 'Overbought', color: DANGER_COLOR };
        if (rsi < 30) return { label: 'Oversold', color: SUCCESS_COLOR };
        return { label: 'Neutral', color: 'text-white' };
    };

    const rsiResult = rsiSentiment(currentRSI);
    const isBullishSentiment = priceStats?.positive;
    
    // 8. HELPER: DYNAMIC CLASS UTILS
    const getRsiGaugeClass = () => {
        if (currentRSI > 60) return `bg-green-400 ${SUCCESS_COLOR}`;
        if (currentRSI < 40) return `bg-red-500 ${DANGER_COLOR}`;
        return `bg-gray-500 text-gray-500`; // Neutral color for the gauge
    };

    const getNewsBgClass = (isHover = false) => {
        if (isHover) return `hover:${BG_DARK} border-gray-600`;
        return `${BG_PANEL} ${BORDER_COLOR}`;
    };


    // 9. RENDER COMPONENT
    return (
        // Main Container (Menggunakan BG_DARK dan BORDER_COLOR)
        <div className={`w-80 ${BG_DARK} border-l ${BORDER_COLOR} flex flex-col overflow-y-auto custom-scrollbar h-full`}>
            
            {/* --- HEADER: LOGO & NAMA --- */}
            <div className={`p-4 border-b ${BORDER_COLOR} ${BG_PANEL}`}>
                <div className="flex items-start gap-3">
                    {/* LOGO */}
                    <div className="relative">
                        {profile?.logo && !profile.logo.includes('ui-avatars') ? (
                            <img src={profile.logo} alt="logo" className="w-10 h-10 bg-white p-0.5 object-contain" />
                        ) : (
                            // Fallback logo menggunakan ACCENT_COLOR
                            <div className={`w-10 h-10 ${BG_PANEL} flex items-center justify-center ${ACCENT_COLOR} font-bold border ${BORDER_COLOR} text-lg`}>
                                {cleanSymbol[0]}
                            </div>
                        )}
                        {/* Live Indicator (Menggunakan SUCCESS_COLOR) */}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-transparent flex items-center justify-center">
                            <div className={`w-2 h-2 bg-green-400 rounded-full animate-pulse`}></div>
                        </div>
                    </div>

                    {/* INFO */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-white font-extrabold text-xl tracking-tight leading-none uppercase truncate">
                            {fullName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            {/* Symbol Ticker */}
                            <div className={`flex items-center gap-1.5 ${BG_DARK} px-1.5 py-0.5 border ${BORDER_COLOR}`}>
                                <span className={`${ACCENT_COLOR} font-mono font-bold text-xs`}>{cleanSymbol}</span>
                                {isCrypto && <span className="text-gray-600 text-[9px] font-bold">/</span>}
                                {isCrypto && <span className="text-gray-400 font-mono text-[9px] font-semibold">USDT</span>}
                            </div>
                            {/* Rank */}
                            {hybridStats?.rank && (
                                <div className={`flex items-center gap-1 px-1 py-0.5 ${BG_PANEL} border ${BORDER_COLOR} text-[8px] text-gray-400`}>
                                    <Tag size={8} /> #{hybridStats.rank}
                                </div>
                            )}
                            {/* External Link (Menggunakan ACCENT_COLOR hover) */}
                            {profile?.weburl && (
                                <a href={profile.weburl} target="_blank" rel="noreferrer" className={`text-[8px] text-gray-500 hover:${ACCENT_COLOR} transition-colors`}>
                                    <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STATS GRID (ZERO GAP) --- */}
            <div className={`p-0 grid grid-cols-2 border-b ${BORDER_COLOR}`}>
                {/* Market Cap */}
                <div className={`p-3 border-r ${BORDER_COLOR}`}>
                    <div className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                        <DollarSign size={10} className={SUCCESS_COLOR} /> M. Cap
                    </div>
                    <div className="text-sm text-white font-mono font-medium tracking-wide">
                        {renderMarketCap()}
                    </div>
                </div>
                {/* Supply */}
                <div className="p-3">
                    <div className="text-[9px] text-gray-500 font-bold uppercase mb-1 flex items-center gap-1">
                        <Layers size={10} className={ACCENT_COLOR} /> Supply
                    </div>
                    <div className={`text-sm ${ACCENT_COLOR} font-mono font-medium tracking-wide`}>
                        {renderSupply()}
                    </div>
                </div>
                {/* 24H High */}
                <div className={`p-3 border-t ${BORDER_COLOR} border-r`}>
                    <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">24H High</div>
                    <div className="text-sm text-white font-mono font-medium">
                        {high24 > 0 ? formatNumber(high24) : <span className="text-gray-600">-</span>}
                    </div>
                </div>
                {/* 24H Low */}
                <div className={`p-3 border-t ${BORDER_COLOR}`}>
                    <div className="text-[9px] text-gray-500 font-bold uppercase mb-1">24H Low</div>
                    <div className="text-sm text-white font-mono font-medium">
                        {low24 > 0 ? formatNumber(low24) : <span className="text-gray-600">-</span>}
                    </div>
                </div>
            </div>

            {/* --- TECHNICAL INDICATORS --- */}
            <div className={`p-4 space-y-3 border-b ${BORDER_COLOR}`}>
                <div className={`flex items-center justify-between border-b ${BORDER_DARK} pb-2`}>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Technical Analysis</span>
                    {/* Live indicator menggunakan ACCENT_COLOR */}
                    <span className={`text-[8px] ${ACCENT_COLOR} bg-amber-900/10 px-1 py-0.5 font-bold`}>LIVE</span>
                </div>
                
                <div className={`grid grid-cols-2 border ${BORDER_COLOR}`}>
                    {/* RSI */}
                    <div className={`p-3 ${BG_DARK} border-r ${BORDER_COLOR} group`}>
                        <div className={`text-[8px] text-gray-500 mb-0.5 font-bold group-hover:${ACCENT_COLOR}`}>RSI (14)</div>
                        {/* Warna RSI berdasarkan RSI result */}
                        <div className={`font-mono text-xl font-bold ${rsiResult.color}`}>
                            {currentRSI > 0 ? currentRSI.toFixed(2) : '-'}
                        </div>
                        <div className="text-[8px] text-gray-600 mt-0.5 uppercase font-bold tracking-wide">
                            {rsiResult.label}
                        </div>
                    </div>
                    {/* Sentiment */}
                    <div className={`p-3 ${BG_DARK} group`}>
                        <div className={`text-[8px] text-gray-500 mb-0.5 font-bold group-hover:${ACCENT_COLOR}`}>Sentiment (24H)</div>
                        {/* Warna Sentiment berdasarkan priceStats?.positive */}
                        <div className={`font-mono text-xl font-bold ${isBullishSentiment ? SUCCESS_COLOR : DANGER_COLOR}`}>
                            {priceStats?.changePct}%
                        </div>
                        <div className="text-[8px] text-gray-600 mt-0.5 uppercase font-bold tracking-wide">
                            {isBullishSentiment ? 'Bullish' : 'Bearish'}
                        </div>
                    </div>
                </div>
                
                {/* RSI BAR (Gauge) */}
                <div>
                    <div className={`h-1 w-full ${BG_PANEL} overflow-hidden flex border ${BORDER_COLOR}`}>
                       <div 
                         className={`h-full transition-all duration-700 ease-out shadow-[0_0_10px_currentColor] ${getRsiGaugeClass()}`} 
                         style={{ width: `${currentRSI || 50}%` }}
                       />
                    </div>
                    <div className="flex justify-between text-[7px] text-gray-500 mt-0.5">
                        <span>Oversold (30)</span>
                        <span>Overbought (70)</span>
                    </div>
                </div>
            </div>

            {/* --- RELEVANT NEWS --- */}
            <div className={`flex-1 flex flex-col p-4 ${BG_DARK}`}>
                <div className={`flex items-center gap-2 mb-3 border-b ${BORDER_COLOR} pb-2`}>
                    <Newspaper size={12} className={ACCENT_COLOR} />
                    <h3 className="text-[10px] text-gray-300 font-bold uppercase tracking-wide">
                        Latest Headlines
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                    {news && news.length > 0 ? (
                        news.slice(0, 7).map((item, idx) => (
                            <a 
                                key={idx} 
                                href={item.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`block group ${BG_PANEL} hover:${BG_DARK} border ${BORDER_COLOR} p-2 transition-all duration-200`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    {/* Source menggunakan ACCENT_COLOR */}
                                    <span className={`text-[8px] font-bold ${ACCENT_COLOR} bg-amber-900/10 px-1 py-0.5 uppercase`}>
                                        {item.source || 'News'}
                                    </span>
                                    <span className="flex items-center gap-1 text-[8px] text-gray-500">
                                        <Clock size={8} />
                                        {getTimeAgo(item.datetime)}
                                    </span>
                                </div>
                                <h4 className="text-[9px] text-gray-300 font-semibold leading-snug group-hover:text-white line-clamp-2">
                                    {item.headline}
                                </h4>
                                {/* Link menggunakan ACCENT_COLOR hover */}
                                <div className={`mt-1 flex items-center gap-1 text-[7px] text-gray-600 hover:${ACCENT_COLOR} transition-colors`}>
                                    Read full story <ExternalLink size={7} />
                                </div>
                            </a>
                        ))
                    ) : (
                        // Placeholder News
                        <div className={`flex flex-col items-center justify-center h-24 text-gray-600 gap-2 border border-dashed ${BORDER_COLOR} ${BG_PANEL} p-4`}>
                            <Activity size={14} />
                            <span className="text-[9px] font-bold">No recent news found</span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- FOOTER: DATA SOURCE --- */}
            <div className={`mt-auto p-3 border-t ${BORDER_COLOR} ${BG_DARK}`}>
                <div className="flex items-center justify-between text-[8px] text-gray-600 font-mono font-bold">
                    {isCrypto ? (
                        <>
                            <span className="flex items-center gap-1"><Zap size={8} className={WARNING_COLOR}/> BINANCE</span>
                            <span className="flex items-center gap-1"><TrendingUp size={8} className="text-gray-400"/> CRYPTOCOMPARE</span>
                        </>
                    ) : (
                        <>
                            <span className="flex items-center gap-1"><Activity size={8} className={ACCENT_COLOR}/> YAHOO</span>
                            <span className="flex items-center gap-1"><Database size={8} className={SUCCESS_COLOR}/> FINNHUB</span>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

export default MarketStats;