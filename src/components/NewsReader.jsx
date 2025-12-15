// import React, { useState, useEffect } from 'react';
// import { X, ExternalLink, Calendar, Globe, BookOpen, MonitorPlay, AlertTriangle, ShieldAlert } from 'lucide-react';
// import { THEME } from '../utils/constants'; // Import THEME

// const NewsReader = ({ news, onClose }) => {
//     const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'web'
//     const [iframeError, setIframeError] = useState(false);

//     // Reset error saat ganti berita
//     useEffect(() => {
//         setIframeError(false);
//         setActiveTab('summary'); // Reset ke summary view tiap berita baru
//     }, [news]);

//     const openExternal = () => {
//         if(news?.url) window.open(news.url, '_blank', 'noopener,noreferrer');
//     };

//     if (!news) return null;

//     const dateStr = new Date(news.datetime * 1000).toLocaleString('id-ID', {
//         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
//         hour: '2-digit', minute: '2-digit'
//     });

//     // Helper untuk styling
//     const getBgClass = (color) => `bg-[${color}]`;
//     const getBorderClass = (color) => `border-[${color}]`;
//     const getTextColor = (color) => `text-[${color}]`;

//     return (
//         // Menggunakan THEME.bg sebagai background utama
//         <div className={`flex-1 flex flex-col ${getBgClass(THEME.bg)} relative animate-in fade-in zoom-in-95 duration-300 h-full`}>
            
//             {/* --- READER HEADER --- */}
//             <div className={`h-12 border-b ${getBorderClass(THEME.border)} flex items-center justify-between px-4 ${getBgClass(THEME.panel)} shrink-0`}>
                
//                 {/* Tab Buttons */}
//                 <div className={`flex items-center gap-1 ${getBgClass(THEME.bg)} p-1 border ${getBorderClass(THEME.border)}`}>
//                     <button 
//                         onClick={() => setActiveTab('summary')}
//                         className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold transition-all ${activeTab === 'summary' 
//                             ? `${getBgClass(THEME.accent)} text-black shadow-[0_0_10px_${THEME.accent}40]` 
//                             : 'text-gray-500 hover:text-white'}`}
//                     >
//                         <BookOpen size={12} /> BRIEFING
//                     </button>
//                     <button 
//                         onClick={() => setActiveTab('web')}
//                         className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold transition-all ${activeTab === 'web' 
//                             ? `${getBgClass(THEME.success)} text-black shadow-[0_0_10px_${THEME.success}40]` 
//                             : 'text-gray-500 hover:text-white'}`}
//                     >
//                         <Globe size={12} /> LIVE SOURCE
//                     </button>
//                 </div>

//                 {/* Close Button */}
//                 <button onClick={onClose} className={`flex items-center gap-2 px-3 py-1.5 ${getBgClass(THEME.panel)} hover:${getBgClass(THEME.danger)} text-gray-300 hover:text-white text-[10px] font-bold transition-all border ${getBorderClass(THEME.border)}`}>
//                     <X size={12} /> CLOSE
//                 </button>
//             </div>

//             {/* --- CONTENT AREA --- */}
//             <div className={`flex-1 overflow-hidden relative ${getBgClass(THEME.bg)}`}>
                
//                 {/* MODE 1: SUMMARY VIEW */}
//                 {activeTab === 'summary' && (
//                     <div className="h-full overflow-y-auto p-8 custom-scrollbar">
//                         <div className="max-w-3xl mx-auto">
//                             <div className={`flex items-center gap-4 text-xs text-gray-500 mb-6 font-mono border-b ${getBorderClass(THEME.border)} pb-4`}>
//                                 <span className={`${getBgClass(THEME.panel)} px-2 py-1 ${getTextColor(THEME.accent)} border ${getBorderClass(THEME.border)} font-bold tracking-wider`}>{news.source.toUpperCase()}</span>
//                                 <span className="flex items-center gap-1"><Calendar size={12}/> {dateStr}</span>
//                             </div>

//                             <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight font-sans tracking-tight">
//                                 {news.headline}
//                             </h1>

//                             {news.image && (
//                                 <div className={`w-full h-64 md:h-[400px] mb-8 overflow-hidden border ${getBorderClass(THEME.border)} relative group shadow-2xl`}>
//                                     <img src={news.image} alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
//                                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
//                                 </div>
//                             )}

//                             {/* Summary Box (Padded with Accent Border) */}
//                             <div className={`text-gray-300 text-lg leading-relaxed font-serif space-y-6 border-l-4 ${getBorderClass(THEME.accent)} pl-6 py-4 ${getBgClass(THEME.panel)}`}>
//                                 <p>{news.summary || "Summary not available. Please try the Live Source tab."}</p>
//                             </div>

//                             {/* Call to Action Button */}
//                             <div className={`mt-12 p-6 ${getBgClass(THEME.panel)} border ${getBorderClass(THEME.border)} text-center`}>
//                                 <p className="text-gray-400 text-sm mb-4">Want to read the full detailed article?</p>
//                                 <button onClick={() => setActiveTab('web')} className={`inline-flex items-center gap-2 ${getBgClass(THEME.success)} hover:${getBgClass(THEME.success)}/80 text-black px-8 py-3 font-bold text-sm transition-all shadow-[0_0_20px_${THEME.success}30]`}>
//                                     <MonitorPlay size={16} /> ATTEMPT TO LOAD LIVE SITE
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}

//                 {/* MODE 2: WEB VIEW (COBA SEMUA + FALLBACK) */}
//                 {activeTab === 'web' && (
//                     <div className={`w-full h-full flex flex-col ${getBgClass(THEME.panel)} p-1 relative`}>
                        
//                         {/* JIKA ERROR TERDETEKSI OLEH BROWSER */}
//                         {iframeError ? (
//                             <div className={`flex-1 flex flex-col items-center justify-center ${getBgClass(THEME.bg)} text-center p-10 border ${getBorderClass(THEME.border)} m-2 shadow-inner`}>
//                                 <div className={`p-6 mb-6 border ${getBorderClass(THEME.border)} ${getBgClass(THEME.panel)}`}>
//                                     <ShieldAlert size={48} className={getTextColor(THEME.danger)} />
//                                 </div>
//                                 <h3 className="text-2xl text-white font-bold mb-2 tracking-tight">Access Denied (X-Frame Policy)</h3>
//                                 <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
//                                     The source website prevents embedding inside other applications. Please open the article directly.
//                                 </p>
//                                 <button onClick={openExternal} className={`flex items-center gap-3 ${getBgClass(THEME.accent)} hover:${getBgClass(THEME.warning)} text-black px-8 py-4 font-bold transition-all transform hover:scale-105 shadow-[0_0_20px_${THEME.accent}30]`}>
//                                     OPEN IN EXTERNAL BROWSER <ExternalLink size={18}/>
//                                 </button>
//                             </div>
//                         ) : (
//                             // JIKA TIDAK ERROR, COBA TAMPILKAN
//                             <div className={`w-full h-full overflow-hidden border ${getBorderClass(THEME.border)} shadow-inner bg-white relative`}>
                                
//                                 {/* Loading Text di belakang iframe */}
//                                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs flex flex-col items-center gap-2">
//                                     <div className={`animate-spin h-4 w-4 border-b-2 ${getBorderClass(THEME.accent)}`}></div>
//                                     <span>NEGOTIATING CONNECTION...</span>
//                                 </div>

//                                 <iframe 
//                                     src={news.url}
//                                     title="News Source"
//                                     className="w-full h-full border-none relative z-10 bg-white" 
//                                     sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
//                                     onError={() => setIframeError(true)}
//                                 />
//                             </div>
//                         )}
                        
//                         {/* TOMBOL CADANGAN: Selalu muncul di pojok kanan bawah */}
//                         {!iframeError && (
//                             <div className="absolute bottom-6 right-6 z-50">
//                                 <button 
//                                     onClick={openExternal}
//                                     className={`flex items-center gap-2 ${getBgClass(THEME.bg + '/80')} hover:${getBgClass(THEME.accent)} text-gray-300 hover:text-black text-[9px] font-bold px-3 py-1.5 border ${getBorderClass(THEME.border)} backdrop-blur transition-all shadow-lg`}
//                                 >
//                                     PAGE BLANK? CLICK TO OPEN EXTERNAL <ExternalLink size={10}/>
//                                 </button>
//                             </div>
//                         )}

//                     </div>
//                 )}

//             </div>
//         </div>
//     );
// };

// export default NewsReader;