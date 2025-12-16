// src/components/TickerTape.jsx

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber } from '../utils/constants';

// --- COLORS CONSTANTS ---
const TEXT_SUCCESS = 'text-[#00F0FF]'; // Cyber Cyan untuk profit (Lebih premium dari hijau biasa)
const TEXT_DANGER = 'text-[#FF2E50]';  // Neon Red untuk loss
const TEXT_NEUTRAL = 'text-gray-500';

const BG_DARK = 'bg-[#050505]'; // Hitam Pekat (Premium)
const BORDER_COLOR = 'border-[#222222]'; // Garis pemisah halus

const TickerTape = ({ combinedAssets }) => {
    
    // 1. LOADING STATE
    if (!combinedAssets || combinedAssets.length === 0) {
        return (
            <div className={`w-full h-10 ${BG_DARK} border-y ${BORDER_COLOR} flex items-center justify-center`}>
                <span className="text-[10px] text-gray-600 font-mono tracking-widest animate-pulse">
                    INITIALIZING MARKET DATA STREAM...
                </span>
            </div>
        );
    }

    // 2. DATA DUPLICATION (Looping Seamless)
    // Kita duplikasi data secukupnya agar tidak ada jeda saat animasi reset
    const marqueeAssets = [...combinedAssets, ...combinedAssets, ...combinedAssets];

    // 3. HELPER CLASS
    const getSignalStyle = (pct) => {
        if (pct > 0) return { color: TEXT_SUCCESS, Icon: TrendingUp };
        if (pct < 0) return { color: TEXT_DANGER, Icon: TrendingDown };
        return { color: TEXT_NEUTRAL, Icon: Minus };
    };

    return (
        // MAIN CONTAINER
        <div className={`w-full h-10 ${BG_DARK} border-y ${BORDER_COLOR} overflow-hidden relative select-none group z-40`}>
            
            {/* CSS ANIMASI (Internal) */}
            <style>{`
                @keyframes marquee-linear {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); } /* Geser 1/3 karena data diduplikasi 3x */
                }
                .animate-marquee-premium {
                    display: flex;
                    width: max-content;
                    animation: marquee-linear 60s linear infinite; /* Lambat & Elegan */
                    will-change: transform;
                }
                /* Pause saat hover */
                .group:hover .animate-marquee-premium {
                    animation-play-state: paused;
                }
            `}</style>

            {/* TRACK */}
            <div className="h-full animate-marquee-premium flex items-center">
                {marqueeAssets.map((asset, index) => {
                    const price = asset.price || 0;
                    const pct = asset.pct || 0;
                    const { color, Icon } = getSignalStyle(pct);

                    return (
                        <div 
                            key={`${asset.symbol}-${index}`} 
                            // ZERO GAP STYLE:
                            // - border-r: Garis pemisah vertikal
                            // - h-full: Tinggi penuh
                            // - px-6: Padding lebar biar lega
                            // - min-w-max: Mencegah text terpotong
                            className={`flex items-center gap-4 px-6 h-full border-r ${BORDER_COLOR} min-w-max hover:bg-[#111] transition-colors cursor-pointer`}
                        >
                            {/* SYMBOL */}
                            <div className="flex flex-col justify-center">
                                <span className="text-gray-200 font-bold text-[11px] leading-tight tracking-wide font-sans">
                                    {asset.symbol.replace('=X', '').replace('USDT', '')}
                                </span>
                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-wider">
                                    {asset.name ? asset.name.substring(0, 8) : 'ASSET'}
                                </span>
                            </div>

                            {/* PRICE & CHANGE */}
                            <div className="flex flex-col items-end justify-center">
                                <span className={`font-mono text-[11px] font-medium tracking-tight ${color}`}>
                                    {formatNumber(price, 2)}
                                </span>
                                <div className={`flex items-center gap-1 ${color}`}>
                                    <Icon size={8} strokeWidth={3} />
                                    <span className="text-[9px] font-bold font-mono">
                                        {Math.abs(pct).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* FADE GRADIENT (KIRI & KANAN) */}
            {/* Memberikan efek 'muncul' dan 'hilang' yang halus */}
            <div className="absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-[#050505] to-transparent pointer-events-none z-10"></div>
            <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-[#050505] to-transparent pointer-events-none z-10"></div>

        </div>
    );
};

export default TickerTape;