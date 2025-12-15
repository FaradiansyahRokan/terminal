import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../utils/constants';

// --- HARDCODED COLORS FOR STABILITY & NEON SIGNAL ---
// Warna Sinyal
const TEXT_SUCCESS = 'text-green-400'; // Neon Green
const TEXT_DANGER = 'text-red-500';    // Neon Red
const BG_SUCCESS_ALPHA = 'bg-green-900/10'; // Dark Green Transparent Background
const BG_DANGER_ALPHA = 'bg-red-900/10';   // Dark Red Transparent Background

// Warna Layout
const BORDER_COLOR = 'border-[#333333]'; // Lebih tebal dari #1A1A1A
const BG_DARK = 'bg-[#0D0D0D]'; // Background header/tape

const TickerTape = ({ combinedAssets }) => {
    
    // 1. LOADING CHECK
    if (!combinedAssets || combinedAssets.length === 0) {
        return (
            <div className={`py-2 ${BG_DARK} border-y ${BORDER_COLOR} text-gray-600 text-[10px] text-center h-8 flex items-center justify-center`}>
                Loading Global Market Data...
            </div>
        );
    }

    // 2. DATA PREPARATION FOR MARQUEE
    // Duplikasi aset 3x untuk memastikan animasi berjalan mulus tanpa jeda
    const marqueeAssets = [...combinedAssets, ...combinedAssets, ...combinedAssets];

    // 3. HELPER: DYNAMIC CLASS
    const getSignalClasses = (isPositive) => ({
        color: isPositive ? TEXT_SUCCESS : TEXT_DANGER,
        bgColor: isPositive ? BG_SUCCESS_ALPHA : BG_DANGER_ALPHA,
    });

    // 4. RENDER COMPONENT
    return (
        // Container Ticker Tape
        <div className={`overflow-hidden ${BG_DARK} border-y ${BORDER_COLOR} relative h-8`}>
            {/* Animasi Marquee Container */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center whitespace-nowrap animate-marquee">
                {marqueeAssets.map((asset, index) => {
                    
                    // Data cleaning/safety check
                    const price = asset.price || 0;
                    const pct = asset.pct || 0;
                    const isPositive = pct >= 0;
                    
                    const classes = getSignalClasses(isPositive);

                    return (
                        <div 
                            key={asset.symbol + index} 
                            // Menggunakan classes Hardcode untuk warna sinyal dan border
                            className={`inline-flex items-center gap-4 px-3 py-1 mx-2 ${classes.bgColor} border ${BORDER_COLOR}`}
                        >
                            
                            {/* SYMBOL (text-white) */}
                            <span className="text-white font-bold text-[10px] tracking-wide uppercase">
                                {asset.symbol.replace('=X', '').replace('USDT', '')}
                            </span>

                            {/* PRICE (Dynamic Color) */}
                            <span className={`font-mono text-[11px] font-semibold ${classes.color}`}>
                                {formatNumber(price, 2)}
                            </span>

                            {/* PERCENT CHANGE (Dynamic Color) */}
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${classes.color}`}>
                                {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {pct.toFixed(2)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TickerTape;