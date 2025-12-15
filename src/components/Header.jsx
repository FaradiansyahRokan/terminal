import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Globe, Clock } from 'lucide-react';
import { formatCompact, formatNumber } from '../utils/constants'; 

// --- HARDCODED COLORS FOR STABILITY ---
const ACCENT_COLOR = 'text-amber-500'; 
const BORDER_COLOR = 'border-[#333333]'; 
const BG_DARK = 'bg-[#0D0D0D]';
const TEXT_SUCCESS = 'text-green-400';
const BG_SUCCESS_ALPHA = 'bg-green-900/20';
const TEXT_DANGER = 'text-red-500';
const BG_DANGER_ALPHA = 'bg-red-900/20';

const Header = ({ indices, marketCap, volume24h, btcDom , marketStatus}) => {
    // 1. STATE MANAGEMENT
    const [localTime, setLocalTime] = useState(new Date());
    const [nycTime, setNycTime] = useState('');
    const [isMarketOpen, setIsMarketOpen] = useState(false); 

    // 2. HELPER: DYNAMIC CLASS
    const getPriceClass = (positive) => positive ? TEXT_SUCCESS : TEXT_DANGER;

    // 3. LOGIC: TIME & MARKET STATUS
    useEffect(() => {
        const updateTimeAndStatus = () => {
            const now = new Date();
            setLocalTime(now);

            // a. Waktu New York
            const options = { 
                timeZone: 'America/New_York', 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hourCycle: 'h23' 
            };
            const nycTimeStr = now.toLocaleTimeString('en-US', options);
            setNycTime(nycTimeStr);

            // b. Logika Market Open (NYSE: 9:30 AM - 4:00 PM EST/EDT)
            const nycHour = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hourCycle: 'h23' }));
            const nycMinute = parseInt(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', minute: '2-digit' }));
            const dayOfWeek = now.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long' });

            const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
            let open = false;

            if (!isWeekend) {
                if (nycHour >= 9 && nycHour < 16) {
                    if (nycHour === 9) {
                        if (nycMinute >= 30) open = true;
                    } else {
                        open = true;
                    }
                }
            }
            setIsMarketOpen(open);
        };

        updateTimeAndStatus();
        const timer = setInterval(updateTimeAndStatus, 1000);
        
        return () => clearInterval(timer);
    }, []);


    // 4. RENDER COMPONENT
    return (
        <div className={`h-10 ${BG_DARK} border-b ${BORDER_COLOR} flex items-center px-4 font-sans text-gray-400 z-10`}>
            
            {/* KIRI: LOGO & STATUS */}
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${ACCENT_COLOR} font-extrabold tracking-widest text-base cursor-default`}>
                    <Activity size={16} /> TERMINAL
                </div>
                
                {/* MARKET STATUS INDICATOR (Hardcoded Colors) */}
                <div className={`flex items-center gap-1.5 px-2 py-0.5 border ${isMarketOpen ? `${BG_SUCCESS_ALPHA} border-green-700 ${TEXT_SUCCESS}` : `${BG_DANGER_ALPHA} border-red-700 ${TEXT_DANGER}`}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-[9px] font-bold tracking-wider">{isMarketOpen ? 'NYSE OPEN' : 'NYSE CLOSED'}</span>
                </div>
            </div>

            {/* TENGAH: INDICES & GLOBAL STATS */}
            <div className="flex-1 mx-6 flex items-center gap-8 overflow-hidden">
                
                {/* Indeks Pasar Utama */}
                <div className="flex items-center gap-4">
                    {indices.map((idx, i) => {
                        const priceDisplay = typeof idx.price === 'number' ? formatNumber(idx.price, 2) : idx.price;
                        const pctDisplay = typeof idx.pct === 'number' ? idx.pct.toFixed(2) : idx.pct;
                        
                        const isDataMissing = priceDisplay === '-' && pctDisplay === '0%';
                        
                        // Menentukan kelas warna dinamis atau Accent jika data hilang
                        const dynamicPriceClass = isDataMissing ? ACCENT_COLOR : getPriceClass(idx.positive);
                        
                        return (
                            <div key={i} className="flex items-center text-[10px] font-mono">
                                <span className="font-bold text-gray-300 mr-2">{idx.symbol}</span>
                                
                                {/* Price (Menggunakan ACCENT_COLOR jika missing) */}
                                <span className={`${dynamicPriceClass} font-medium`}>
                                    {priceDisplay}
                                </span>
                                
                                {/* Change PCT (Menggunakan ACCENT_COLOR jika missing) */}
                                <span className={`${dynamicPriceClass} ml-1 opacity-70`}>
                                    ({pctDisplay}%)
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Separator */}
                <div className={`h-4 w-px ${BORDER_COLOR}`}></div>

                {/* Global Market Stats */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                    <span title="Total Crypto Market Cap">MCAP: <span className="text-white font-semibold">{formatCompact(marketCap)}</span></span>
                    <span title="24 Hour Trading Volume">VOL: <span className="text-white font-semibold">{formatCompact(volume24h)}</span></span>
                    {/* BTC Dominance menggunakan Accent Color */}
                    <span title="Bitcoin Dominance">BTC.D: <span className={`${ACCENT_COLOR} font-semibold`}>{btcDom}%</span></span>
                </div>
            </div>

            {/* KANAN: WAKTU */}
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                {/* Waktu NYC (NYSE) */}
                <div className="flex items-center gap-1.5">
                    <Globe size={11} className="text-blue-400" /> 
                    <span>NYC</span>
                    <span className="text-white font-semibold">{nycTime}</span>
                </div>
                
                {/* Waktu Lokal (WIB) */}
                <div className={`flex items-center gap-1.5 border-l ${BORDER_COLOR} pl-4`}>
                    <Clock size={11} className={ACCENT_COLOR} /> 
                    <span>LOCAL</span>
                    <span className="text-white font-semibold">{localTime.toLocaleTimeString('en-US', { hour12: false })}</span>
                </div>
            </div>
        </div>
    );
};

export default Header;