import React, { useState, useMemo } from 'react';
import { Filter, RefreshCw, Target } from 'lucide-react';
import { formatNumber, formatCompact } from '../utils/constants'; 

// --- HARDCODED COLORS FOR STABILITY ---
const ACCENT_COLOR = 'text-amber-500'; 
const BORDER_COLOR = 'border-[#333333]'; 
const BG_PANEL = 'bg-[#1E1E1E]'; // Background utama panel
const BG_DARK = 'bg-[#0D0D0D]'; // Background header/hover gelap

const ScreenerPanel = ({ results = [], onScan, scanning }) => { 
    // 1. STATE MANAGEMENT
    const [sortBy, setSortBy] = useState('volume');
    const [filterType, setFilterType] = useState('all');

    // 2. LOGIC: FILTER & SORT
    const sortedResults = useMemo(() => {
        // Menggunakan useMemo untuk mengoptimalkan sorting/filtering
        if (!results || results.length === 0) return [];
        
        let filtered = results;
        if (filterType !== 'all') {
            // Filter berdasarkan Gainers (>0) atau Losers (<0)
            filtered = results.filter(r => filterType === 'gainers' ? r.pct > 0 : r.pct < 0);
        }
        
        // Sorting
        return [...filtered].sort((a, b) => {
            if (sortBy === 'volume') return b.volume - a.volume;
            if (sortBy === 'change') return Math.abs(b.pct) - Math.abs(a.pct);
            return 0;
        });
    }, [results, sortBy, filterType]);

    // 3. HELPER: DYNAMIC CLASS (Hardcoded)
    
    // Warna Teks (Hijau/Merah)
    const getPriceClass = (positive) => positive ? 'text-green-400' : 'text-red-400';

    // Warna Teks RSI (Overbought/Oversold)
    const getRsiColor = (rsi) => {
        if (rsi > 70) return 'text-red-400';
        if (rsi < 30) return 'text-green-400';
        return 'text-gray-400';
    };

    // Teks Signal (BULLISH/BEARISH/NEUTRAL)
    const renderSignalText = (signal) => {
        if (signal === 'BUY') return <span className="text-green-400 font-bold">BULLISH</span>;
        if (signal === 'SELL') return <span className="text-red-400 font-bold">BEARISH</span>;
        return <span className="text-gray-500 font-medium">NEUTRAL</span>;
    };
    
    // Background Transparan untuk CHG%
    const getSignalBg = (positive) => positive ? 'bg-green-900/20' : 'bg-red-900/20';

    // 4. RENDER COMPONENT
    return (
        // Main Container
        <div className={`flex-1 flex flex-col ${BG_PANEL} border-t ${BORDER_COLOR}`}>
            
            {/* HEADER CONTROLS */}
            <div className={`flex items-center justify-between p-2 border-b ${BORDER_COLOR} ${BG_DARK}`}>
                <div className="flex items-center gap-2">
                    <Filter size={12} className={ACCENT_COLOR} /> 
                    <span className="text-[10px] font-bold text-gray-400">MARKET SCREENER</span> {/* Font dinaikkan ke 10px */}
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Filter Dropdown */}
                    <select 
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className={`${BG_PANEL} border ${BORDER_COLOR} text-[10px] text-white px-2 py-1 outline-none cursor-pointer hover:border-amber-500`}
                    >
                        <option className={BG_PANEL} value="all">ALL</option>
                        <option className={BG_PANEL} value="gainers">GAINERS</option>
                        <option className={BG_PANEL} value="losers">LOSERS</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`${BG_PANEL} border ${BORDER_COLOR} text-[10px] text-white px-2 py-1 outline-none cursor-pointer hover:border-amber-500`}
                    >
                        <option className={BG_PANEL} value="volume">VOLUME</option>
                        <option className={BG_PANEL} value="change">CHANGE %</option>
                    </select>

                    {/* Scan Button */}
                    <button 
                        onClick={onScan}
                        disabled={scanning}
                        className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1 text-[10px] font-bold flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                        {scanning ? <RefreshCw size={10} className="animate-spin" /> : <Target size={10} />}
                        {scanning ? 'SCANNING...' : 'SCAN'}
                    </button>
                </div>
            </div>

            {/* TABLE CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-[9px] font-mono">
                    {/* Table Header (Sticky) */}
                    <thead className={`${BG_DARK} sticky top-0 z-10 shadow-sm`}>
                        <tr className="text-gray-500 border-b border-[#333333]">
                            {/* Font Header dinaikkan ke 10px */}
                            <th className="text-left p-2 font-normal text-[10px]">RANK</th>
                            <th className="text-left p-2 font-normal text-[10px]">SYMBOL</th>
                            <th className="text-right p-2 font-normal text-[10px]">PRICE</th>
                            <th className="text-right p-2 font-normal text-[10px]">CHANGE</th>
                            <th className="text-right p-2 font-normal text-[10px]">VOLUME</th>
                            <th className="text-right p-2 font-normal text-[10px]">RSI</th>
                            <th className="text-center p-2 font-normal text-[10px]">SIGNAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedResults.length > 0 ? (
                            sortedResults.map((item, i) => {
                                const pct = item.pct || 0; 
                                const rsi = item.rsi || '50'; 
                                const isPositive = pct >= 0;
                                const priceClass = getPriceClass(isPositive);

                                return (
                                <tr 
                                    key={i} 
                                    className={`border-b border-[#333333] hover:${BG_DARK} cursor-pointer group transition-colors`}
                                >
                                    {/* Kolom data menggunakan font 9px untuk kepadatan */}
                                    <td className="p-2 text-gray-600 group-hover:text-gray-400 text-[9px]">#{i + 1}</td>
                                    {/* Symbol (Hover Accent) */}
                                    <td className={`p-2 font-bold text-white group-hover:${ACCENT_COLOR} text-[9px]`}>{item.symbol}</td>
                                    
                                    {/* PRICE - Warna dinamis */}
                                    <td className={`p-2 text-right ${priceClass} text-[9px]`}>{formatNumber(item.price)}</td>
                                    
                                    {/* CHANGE % - Warna dinamis + Background */}
                                    <td className="p-2 text-right">
                                        <span className={`px-1.5 py-0.5 ${getSignalBg(isPositive)} ${priceClass} text-[9px]`}>
                                            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                                        </span>
                                    </td>
                                    
                                    <td className="p-2 text-right text-gray-400 text-[9px]">{formatCompact(item.volume)}</td>
                                    
                                    {/* RSI */}
                                    <td className="p-2 text-right">
                                        <span className={`${getRsiColor(parseFloat(rsi))} text-[9px]`}>
                                            {typeof rsi === 'string' ? rsi : parseFloat(rsi).toFixed(2)}
                                        </span>
                                    </td>
                                    
                                    {/* SIGNAL - Teks Indikator */}
                                    <td className="p-2 text-center text-[9px] uppercase">
                                        {renderSignalText(item.signal || 'NEUTRAL')}
                                    </td>
                                </tr>
                            )})
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-10 text-gray-600 text-sm">
                                    {scanning ? 'Scanning Market Data...' : 'No Data Available. Click SCAN.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScreenerPanel;