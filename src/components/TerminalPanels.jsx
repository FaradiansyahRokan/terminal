// import React from 'react';
// import { Activity, Target, Brain, Newspaper, Filter } from 'lucide-react';
// import { THEME } from '../utils/constants';

// const TerminalPanels = ({ activePanel, setActivePanel, signal, analysis, news, screenerResults, onAnalyze, onScreen }) => {
//   const tabs = [
//     { id: 'OVERVIEW', icon: Activity },
//     { id: 'SIGNALS', icon: Target },
//     { id: 'AI ANALYST', icon: Brain },
//     { id: 'NEWS WIRE', icon: Newspaper },
//     { id: 'SCREENER', icon: Filter },
//   ];

//   return (
//     <div className={`h-64 border-t ${THEME.border} flex flex-col bg-[#050505]`}>
//       <div className="flex border-b border-[#1A1A1A] bg-black">
//         {tabs.map(tab => (
//           <button
//             key={tab.id}
//             onClick={() => setActivePanel(tab.id)}
//             className={`flex items-center gap-1.5 px-4 py-1.5 text-[9px] font-bold border-r border-[#111] transition-all ${
//               activePanel === tab.id 
//                 ? 'bg-[#0A0A0A] text-[#ff9500] border-t-2 border-t-[#ff9500]' 
//                 : 'text-gray-600 hover:text-gray-300 hover:bg-[#080808]'
//             }`}
//           >
//             <tab.icon size={10} />
//             {tab.id}
//           </button>
//         ))}
//       </div>

//       <div className="flex-1 overflow-y-auto p-3 font-mono text-xs custom-scrollbar">
//         {/* OVERVIEW */}
//         {activePanel === 'OVERVIEW' && (
//            <div className="grid grid-cols-4 gap-3 h-full">
//              <div className="bg-[#080808] border border-[#1A1A1A] p-3 flex flex-col justify-between">
//                 <div className="text-[9px] text-gray-500 uppercase">Sentiment</div>
//                 <div className="text-2xl font-bold text-[#00ff41]">BULLISH</div>
//              </div>
//              <div className="bg-[#080808] border border-[#1A1A1A] p-3 flex flex-col justify-between">
//                 <div className="text-[9px] text-gray-500 uppercase">24h Vol</div>
//                 <div className="text-2xl font-bold text-white">HIGH</div>
//              </div>
//            </div>
//         )}

//         {/* SIGNALS */}
//         {activePanel === 'SIGNALS' && signal && (
//           <div className="flex gap-4 h-full">
//              <div className={`w-48 p-3 border ${signal.signal.includes('BUY') ? 'border-green-900/30 bg-green-950/5' : 'border-red-900/30 bg-red-950/5'} flex flex-col justify-center items-center text-center`}>
//                 <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">ALGO SIGNAL</div>
//                 <div className={`text-2xl font-bold mb-1 ${signal.signal.includes('BUY') ? THEME.success : THEME.danger}`}>{signal.signal}</div>
//                 <div className="text-[9px] px-2 py-0.5 bg-black/50 border border-[#222] rounded text-gray-400">CONFIDENCE: {(signal.strength * 20).toFixed(0)}%</div>
//              </div>
//              <div className="flex-1 grid grid-cols-3 gap-2">
//                  <div className="bg-[#080808] border border-[#1A1A1A] p-2">
//                     <div className="text-[8px] text-gray-500">RSI (14)</div>
//                     <div className="text-xl font-bold text-gray-200">{signal.rsi}</div>
//                  </div>
//                  <div className="bg-[#080808] border border-[#1A1A1A] p-2">
//                     <div className="text-[8px] text-gray-500">MACD</div>
//                     <div className="text-xl font-bold text-gray-200">{signal.macd}</div>
//                  </div>
//              </div>
//           </div>
//         )}

//         {/* AI ANALYST */}
//         {activePanel === 'AI ANALYST' && (
//             <div className="flex h-full gap-4">
//                 <div className="flex-1 bg-[#080808] border border-[#1A1A1A] p-3 font-mono text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap overflow-y-auto">
//                     {analysis || <span className="opacity-30">Press INITIATE to generate analysis...</span>}
//                 </div>
//                 <button onClick={onAnalyze} className="w-32 bg-[#ff9500] hover:bg-[#e08400] text-black font-bold text-[10px] flex items-center justify-center gap-2">
//                    <Brain size={12} /> INITIATE
//                 </button>
//             </div>
//         )}

//         {/* NEWS */}
//         {activePanel === 'NEWS WIRE' && (
//              <div className="grid grid-cols-2 gap-2 h-full overflow-hidden">
//                 {news.length > 0 ? news.map((n, i) => (
//                     <div key={i} className="flex gap-3 p-2 bg-[#080808] border border-[#1A1A1A] hover:border-[#333] group cursor-pointer">
//                         <div className="flex-1">
//                             <div className="flex justify-between items-center mb-0.5">
//                                 <span className="text-[#ff9500] text-[8px] font-bold uppercase">{n.source}</span>
//                                 <span className="text-gray-700 text-[8px]">{n.time}</span>
//                             </div>
//                             <h4 className="text-[10px] font-bold text-gray-200 leading-tight group-hover:text-white truncate">{n.headline}</h4>
//                         </div>
//                     </div>
//                 )) : <div className="text-gray-500 p-4">Loading Real News from Finnhub...</div>}
//              </div>
//         )}

//         {/* SCREENER */}
//         {activePanel === 'SCREENER' && (
//             <div className="h-full flex flex-col">
//                 <button onClick={onScreen} className="mb-2 px-3 py-0.5 bg-[#111] border border-[#333] text-[9px] text-[#ff9500] self-end">RUN SCAN</button>
//                 <div className="flex-1 overflow-auto bg-[#080808] border border-[#1A1A1A]">
//                     <table className="w-full text-left border-collapse">
//                         <thead className="bg-black sticky top-0 z-10">
//                             <tr className="text-[8px] text-gray-500 uppercase">
//                                 <th className="p-1.5 border-b border-[#222]">Symbol</th>
//                                 <th className="p-1.5 border-b border-[#222] text-right">Price</th>
//                                 <th className="p-1.5 border-b border-[#222] text-right">%</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {screenerResults.map((r, i) => (
//                                 <tr key={i} className="hover:bg-[#111] text-[9px] border-b border-[#111]">
//                                     <td className="p-1.5 font-bold text-gray-300">{r.symbol}</td>
//                                     <td className="p-1.5 text-right text-gray-400">{r.price}</td>
//                                     <td className={`p-1.5 text-right ${r.positive ? 'text-green-500' : 'text-red-500'}`}>{r.pct}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TerminalPanels;