import React, { useMemo } from 'react';
import { formatNumber, formatCompact } from '../utils/constants';

// --- HARDCODED COLORS FOR STABILITY & NEON SIGNAL ---
const BORDER_COLOR = 'border-[#333333]'; 
const BG_PANEL = 'bg-[#1E1E1E]'; // Background utama (panel)
const BG_DARK = 'bg-[#0D0D0D]'; // Background gelap (header/hover)

// Warna Sinyal (Sesuai tema Neon yang disepakati)
const ASK_TEXT_COLOR = 'text-red-500';      // Merah untuk Ask/Jual
const ASK_BG_ALPHA = 'bg-red-900/10';       // Background volume Ask

const BID_TEXT_COLOR = 'text-green-400';    // Hijau untuk Bid/Beli
const BID_BG_ALPHA = 'bg-green-900/10';     // Background volume Bid

const ACCENT_COLOR = 'text-amber-500';     // Spread Color
const ACCENT_BG = 'bg-amber-500';

const OrderBook = ({ bids, asks }) => {
    
    // 1. DATA PROCESSING
    // Mencari Qty maksimum untuk normalisasi bar volume
    const maxQty = useMemo(() => {
        return Math.max(...bids.map(b => b.qty), ...asks.map(a => a.qty), 1);
    }, [bids, asks]);
    
    // 2. HELPER: DYNAMIC CLASS UTILS (N/A)

    // 3. RENDER COMPONENT
    return (
        // Main Container
        <div className={`w-64 flex flex-col ${BG_PANEL} border-l ${BORDER_COLOR}`}>
            
            {/* HEADER: TITLE & STATUS */}
            <div className={`h-10 flex items-center justify-between px-3 border-b ${BORDER_COLOR} ${BG_DARK}`}>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ORDER BOOK</span>
                {/* Live Indicator (Bid Color) */}
                <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${BID_TEXT_COLOR.replace('text-', 'bg-')} animate-pulse`}></div>
                    <span className="text-[9px] text-gray-600">L2</span>
                </div>
            </div>

            {/* KOLOM HEADER */}
            <div className={`grid grid-cols-3 px-3 py-1 text-[9px] text-gray-500 font-bold ${BG_DARK} border-b ${BORDER_COLOR}`}>
                <div>PRICE</div>
                <div className="text-right">SIZE</div>
                <div className="text-right">TOTAL</div>
            </div>

            {/* ORDER LISTS */}
            <div className="flex-1 overflow-hidden flex flex-col font-mono text-[10px]">
                
                {/* A. ASKS (SELL ORDERS - Red/Danger) */}
                <div className="flex-1 overflow-hidden flex flex-col-reverse justify-end">
                    {asks.slice(0, 15).map((ask, i) => (
                        <div 
                            key={i} 
                            className={`grid grid-cols-3 px-3 py-[2px] relative hover:${BG_DARK} cursor-pointer group`}
                        >
                            {/* Volume Background Bar */}
                            <div 
                                className={`absolute right-0 top-0 bottom-0 ${ASK_BG_ALPHA} z-0`} 
                                style={{ width: `${(ask.qty/maxQty)*100}%` }} 
                            />
                            {/* Price (Ask Color) */}
                            <span className={`${ASK_TEXT_COLOR} relative z-10 font-bold`}>{formatNumber(ask.price)}</span>
                            {/* Size (White for contrast) */}
                            <span className="text-white text-right relative z-10">{ask.qty.toFixed(3)}</span>
                            {/* Total (Gray for secondary info) */}
                            <span className="text-gray-500 text-right relative z-10 text-[9px]">{formatCompact(ask.total)}</span>
                        </div>
                    ))}
                </div>

                {/* SPREAD INDICATOR */}
                <div className={`py-1 border-y ${BORDER_COLOR} ${BG_DARK} flex justify-between px-3 text-[10px]`}>
                    <span className="text-gray-500">SPREAD</span>
                    {/* Spread Value (Accent Color) */}
                    <span className={`${ACCENT_COLOR} font-bold`}>
                        {asks[0] && bids[0] ? (asks[0].price - bids[0].price).toFixed(2) : '—'}
                    </span>
                </div>

                {/* B. BIDS (BUY ORDERS - Green/Success) */}
                <div className="flex-1 overflow-hidden">
                    {bids.slice(0, 15).map((bid, i) => (
                        <div 
                            key={i} 
                            className={`grid grid-cols-3 px-3 py-[2px] relative hover:${BG_DARK} cursor-pointer group`}
                        >
                            {/* Volume Background Bar */}
                            <div 
                                className={`absolute right-0 top-0 bottom-0 ${BID_BG_ALPHA} z-0`} 
                                style={{ width: `${(bid.qty/maxQty)*100}%` }} 
                            />
                            {/* Price (Bid Color) */}
                            <span className={`${BID_TEXT_COLOR} relative z-10 font-bold`}>{formatNumber(bid.price)}</span>
                            {/* Size (White for contrast) */}
                            <span className="text-white text-right relative z-10">{bid.qty.toFixed(3)}</span>
                            {/* Total (Gray for secondary info) */}
                            <span className="text-gray-500 text-right relative z-10 text-[9px]">{formatCompact(bid.total)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderBook;