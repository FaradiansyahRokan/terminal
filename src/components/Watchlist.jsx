import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react'; // Menghapus TrendingUp yang tidak digunakan
import { formatNumber, formatCompact, MARKET_CATEGORIES } from '../utils/constants'; 
// THEME diimpor di sini, tetapi kita tetap menggunakan hardcode di dalam function

const Watchlist = ({ 
    assets, selectedAsset, onSelect, 
    searchQuery, setSearchQuery, loading, 
    activeCategory, setActiveCategory 
}) => {
    
    // 1. STATE & REF UNTUK FLASH EFFECT
    const [flashSymbol, setFlashSymbol] = useState(null);
    const priceHistoryRef = useRef({}); // Menyimpan harga terakhir untuk deteksi perubahan
    
    // 2. DATA FILTERING
    const filteredAssets = useMemo(() => {
        if (!searchQuery) return assets;
        return assets.filter(a => a.symbol.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [assets, searchQuery]);

    // 3. EFFECT: MENDETEKSI PERUBAHAN HARGA DAN MEMICU FLASH
    useEffect(() => {
        const newHistory = { ...priceHistoryRef.current };
        
        assets.forEach(asset => {
            const currentPrice = asset.price;
            const symbol = asset.symbol;
            const oldPrice = newHistory[symbol];

            if (oldPrice !== undefined && oldPrice !== currentPrice) {
                // Harga berubah, picu flash!
                setFlashSymbol({ 
                    symbol: symbol, 
                    isUp: currentPrice > oldPrice 
                });
                
                // Hapus flash setelah 500ms
                setTimeout(() => setFlashSymbol(null), 500);
            }
            // Update history untuk iterasi berikutnya
            newHistory[symbol] = currentPrice;
        });

        priceHistoryRef.current = newHistory;
        
        // Catatan: Efek ini hanya merespons perubahan array 'assets' (yaitu polling), bukan websocket.
        // Untuk Watchlist non-selected asset, ini adalah solusi terbaik.

    }, [assets]);


    // --- HARDCODED COLORS UNTUK STABILITAS ---
    // Warna Sinyal
    const getPriceTextClass = (positive) => positive ? 'text-green-400' : 'text-red-500'; 
    const getChgBgClass = (positive) => positive ? 'bg-green-500/10' : 'bg-red-500/10';
    
    // Warna Flash
    const FLASH_UP_BG = 'bg-green-700/50';
    const FLASH_DOWN_BG = 'bg-red-700/50';

    // Layout Colors
    const ACCENT_COLOR = 'text-amber-500';
    const BG_PANEL = 'bg-[#1E1E1E]'; 
    const BG_DARK = 'bg-[#0D0D0D]'; 
    const BORDER_COLOR = 'border-[#333333]'; 


    return (
        <div className={`w-[320px] h-full flex flex-col ${BG_PANEL} border-r ${BORDER_COLOR}`}>
            
            {/* --- TAB KATEGORI (FONT: 10px) --- */}
            <div className={`flex overflow-x-auto no-scrollbar border-b ${BORDER_COLOR} ${BG_DARK}`}>
                {Object.values(MARKET_CATEGORIES).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-1 py-2.5 text-[10px] font-bold text-center border-b-2 transition-colors ${
                            activeCategory === cat 
                            ? `border-amber-500 text-amber-500 bg-amber-900/10`
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* SEARCH BAR */}
            <div className={`p-2 border-b ${BORDER_COLOR}`}>
                <div className="relative">
                    <Search className={`absolute left-2 top-2 w-3 h-3 text-gray-600`} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`SEARCH ${activeCategory}...`} 
                        className={`w-full ${BG_DARK} border ${BORDER_COLOR} text-[10px] py-1.5 pl-7 pr-2 focus:border-amber-500 outline-none font-mono`}
                    />
                    {/* Refresh Icon hanya muncul saat loading (dari prop) */}
                    {loading && <RefreshCw className={`absolute right-2 top-2 w-3 h-3 ${ACCENT_COLOR} animate-spin`} />}
                </div>
            </div>

            {/* KOLOM HEADER (FONT: 10px) */}
            <div className={`grid grid-cols-12 px-3 py-1 ${BG_DARK} text-[10px] font-bold text-gray-500 border-b ${BORDER_COLOR}`}>
                <div className="col-span-5">SYMBOL</div>
                <div className="col-span-3 text-right">PRICE</div>
                <div className="col-span-2 text-right">CHG%</div>
                <div className="col-span-2 text-right">VOL</div>
            </div>

            {/* LIST ASSET */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-600">
                        <span className="text-[10px]">No Data Available</span>
                    </div>
                ) : (
                    filteredAssets.map((asset, i) => {
                        const isPositive = asset.pct >= 0;
                        const priceTextColor = getPriceTextClass(isPositive);
                        const chgBg = getChgBgClass(isPositive);

                        // LOGIC FLASH EFFECT
                        const isFlashing = flashSymbol && flashSymbol.symbol === asset.symbol;
                        const flashClass = isFlashing ? (flashSymbol.isUp ? FLASH_UP_BG : FLASH_DOWN_BG) + ' transition-none' : '';

                        return (
                        <div
                            key={i}
                            onClick={() => onSelect(asset.symbol)}
                            className={`grid grid-cols-12 px-3 py-1.5 border-b ${BORDER_COLOR} cursor-pointer relative group transition-colors duration-500 ${ // Durasi transisi kembali ke normal
                            selectedAsset === asset.symbol 
                                ? `${BG_DARK} ${flashClass}` 
                                : `hover:${BG_DARK} ${flashClass}`
                            }`}
                        >
                            {/* Selected Indicator Bar */}
                            {selectedAsset === asset.symbol && (
                            <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-amber-500 shadow-[0_0_8px_#F59E0B]`}></div>
                            )}
                            
                            <div className="col-span-5 flex items-center gap-1.5">
                            {/* SYMBOL - text-[11px] */}
                            <span className={`text-[11px] font-bold ${selectedAsset === asset.symbol ? 'text-white' : ACCENT_COLOR} group-hover:text-white`}>
                                {asset.symbol.replace('=X', '').replace('USDT', '')}
                            </span>
                            </div>

                            {/* Harga (Price) - Flash Class Applied here */}
                            <div className={`col-span-3 text-right font-mono text-[11px] text-white ${isFlashing ? priceTextColor : ''}`}> 
                                {asset.price < 1 ? asset.price.toFixed(5) : formatNumber(asset.price, 2)}
                            </div>

                            {/* Change Percentage - text-[10px] */}
                            <div className="col-span-2 text-right font-mono text-[10px]">
                            <span className={`px-1 py-0.5 ${chgBg} ${priceTextColor}`}>
                                {isPositive ? '+' : ''}{asset.pct ? asset.pct.toFixed(2) : '0.00'}%
                            </span>
                            </div>

                            {/* Volume - text-white */}
                            <div className="col-span-2 text-right font-mono text-[10px] text-white">
                            {formatCompact(asset.vol)}
                            </div>
                        </div>
                        );
                    })
                )}
            </div>

            {/* FOOTER STATS */}
            <div className={`border-t ${BORDER_COLOR} ${BG_PANEL} p-2`}>
                <div className="grid grid-cols-3 gap-2 text-[8px]">
                    <div className={`${BG_DARK} p-1.5 border ${BORDER_COLOR}`}>
                        <div className="text-gray-600">ASSETS</div>
                        <div className={`text-[11px] font-bold text-white`}>{assets.length}</div>
                    </div>
                    <div className={`${BG_DARK} p-1.5 border ${BORDER_COLOR}`}>
                        <div className="text-gray-600">GAINERS</div>
                        <div className={`text-[11px] text-green-400 font-bold`}>{assets.filter(a => a.pct > 0).length}</div>
                    </div>
                    <div className={`${BG_DARK} p-1.5 border ${BORDER_COLOR}`}>
                        <div className="text-gray-600">LOSERS</div>
                        <div className={`text-[11px] text-red-500 font-bold`}>{assets.filter(a => a.pct < 0).length}</div>
                    </div>
                </div>
            </div>
            
            {/* SCROLLBAR STYLING (Hardcoded) */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFB800; }
            `}</style>
        </div>
    );
};

export default Watchlist;