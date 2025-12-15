import React from 'react';
import { Clock, Image as ImageIcon, ExternalLink, Globe } from 'lucide-react';
// NOTE: Tidak ada import THEME karena semua warna sudah hardcoded

// --- HARDCODED COLORS FOR STABILITY ---
const ACCENT_COLOR = 'text-amber-500';
const BG_PANEL = 'bg-[#1E1E1E]'; 
const BG_DARK = 'bg-[#0D0D0D]'; 
const BORDER_COLOR = 'border-[#333333]'; 
const BG_ACCENT_ALPHA = 'bg-amber-900/10';


// Asumsi: prop 'news' diubah namanya menjadi 'globalNews' di App.jsx
// Namun, kita tetap menggunakan 'news' di prop destructuring agar tidak merusak App.jsx saat ini.
// Di App.jsx, pastikan Anda mengganti <NewsFeed news={news} ... /> menjadi <NewsFeed news={globalNews} ... />
const NewsFeed = ({ news, onNewsClick }) => {
    
    // 1. HELPER: FORMAT WAKTU BERITA
    // Menggunakan helper dari MarketStats agar konsisten (time ago)
    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '—';
        const diff = Math.floor(Date.now() / 1000) - timestamp;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    // 2. RENDER COMPONENT
    return (
        // Main Container
        <div className={`flex-1 ${BG_PANEL} border-t ${BORDER_COLOR} overflow-y-auto p-3 custom-scrollbar pr-1`}>
            
            {news.length === 0 ? (
                // Placeholder No Data
                <div className={`flex flex-col items-center justify-center h-full text-gray-500 gap-3`}>
                    <Globe size={30} className="text-gray-700" />
                    <span className="text-xs font-bold">Fetching Global Financial Headlines...</span>
                    <span className="text-[9px] text-gray-600">Ensure data sources are active.</span>
                </div>
            ) : (
                // News Grid
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {news.map((item, i) => (
                        <a 
                            key={i} 
                            // Menggunakan <a> tag langsung untuk link eksternal jika onNewsClick tidak diperlukan (asumsi ini adalah news global)
                            href={item.url || '#'}
                            target={item.url ? "_blank" : "_self"}
                            rel="noreferrer"
                            onClick={(e) => { if (!item.url && onNewsClick) { e.preventDefault(); onNewsClick(item); } }}
                            // Item Background & Border
                            className={`flex gap-3 ${BG_DARK} border ${BORDER_COLOR} p-2 hover:${BG_PANEL} hover:border-amber-500 cursor-pointer group transition-all duration-150`}
                        >
                            {/* Thumbnail Kecil (Kiri) */}
                            <div className={`w-16 h-16 flex-shrink-0 ${BG_DARK} border ${BORDER_COLOR} overflow-hidden relative`}>
                                {item.image && !item.image.includes('placeholder') ? (
                                    <img src={item.image} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                                        <ImageIcon size={20} />
                                    </div>
                                )}
                            </div>

                            {/* Konten Text (Kanan) */}
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        {/* Source/Publisher (Menggunakan ACCENT_COLOR) */}
                                        <span className={`${ACCENT_COLOR} text-[8px] font-bold uppercase tracking-wider`}>{item.source || 'GLOBAL NEWS'}</span>
                                        
                                        {/* Timestamp */}
                                        <span className="text-gray-600 text-[8px] flex items-center gap-1 font-mono">
                                            <Clock size={8} /> 
                                            {getTimeAgo(item.datetime)}
                                        </span>
                                    </div>
                                    
                                    {/* Headline (FONT: 10px) */}
                                    <h4 className="text-[10px] text-gray-300 font-bold leading-tight group-hover:text-white line-clamp-2">
                                        {item.headline}
                                    </h4>
                                </div>
                                
                                {/* Summary (FONT: 9px) */}
                                <p className="text-[9px] text-gray-500 line-clamp-1 mt-1 font-mono">
                                    {item.summary || 'Click to read full story...'}
                                </p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
            
            {/* Scrollbar Styling (Hardcoded) */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FFB800; }
            `}</style>
        </div>
    );
};

export default NewsFeed;