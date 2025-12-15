import React, { useRef, useEffect, useState } from 'react';
import { 
    createChart, 
    ColorType, 
    CandlestickSeries, 
    AreaSeries, 
    LineSeries, 
    BarSeries, 
    BaselineSeries, 
    LineStyle, 
    LineType,
    CrosshairMode 
} from 'lightweight-charts';
import { formatNumber } from '../utils/constants'; 
import { Settings, Clock } from 'lucide-react';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '2H', '4H', '1D', '1W', '1M'];

// --- HARDCODED COLORS FOR STABILITY ---
const ACCENT_COLOR = '#F59E0B'; // Amber-500
const TEXT_ACCENT = 'text-amber-500';
const BORDER_COLOR = 'border-[#333333]'; 
const BG_PANEL = '#1E1E1E'; 
const BG_DARK = '#0D0D0D'; 
const TEXT_SUCCESS = '#34D399'; // Green-400
const TEXT_DANGER = '#EF4444';  // Red-500

// --- KOMPONEN INPUT WARNA (Dipertahankan) ---
const ColorInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between gap-2 mb-2 p-1 hover:bg-[#111] transition-colors">
        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tight">{label}</span>
        <div className="relative w-8 h-5 border border-[#333] overflow-hidden shadow-sm cursor-pointer group">
            <div className="absolute inset-0 z-0" style={{ backgroundColor: value }} />
            <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        </div>
    </div>
);

const ChartWidget = ({ selectedAsset, timeframe, setTimeframe, candleData, lastCandle, priceData }) => {
    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const seriesInstanceRef = useRef(null);
    const tooltipRef = useRef(null);
    
    // --- STATE UI ---
    const [chartType, setChartType] = useState('Candlestick'); 
    const [showTooltip, setShowTooltip] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [countdown, setCountdown] = useState('--:--');

    // --- CHART CONFIG (HARDCODE THEME) ---
    const [chartConfig, setChartConfig] = useState({
        backgroundType: 'Gradient',
        topColor: BG_DARK, 
        bottomColor: BG_PANEL, 
        gridColor: BORDER_COLOR, 
        textColor: '#8A8A8A', 
    });

    // --- SERIES STYLES (HARDCODE THEME) ---
    const [chartStyles, setChartStyles] = useState({
        Candlestick: { upColor: TEXT_SUCCESS, downColor: TEXT_DANGER, wickUpColor: TEXT_SUCCESS, wickDownColor: TEXT_DANGER, borderVisible: false },
        HollowCandle: { 
            upColor: BG_DARK, 
            downColor: BG_DARK, 
            wickUpColor: TEXT_SUCCESS, 
            wickDownColor: TEXT_DANGER, 
            borderUpColor: TEXT_SUCCESS, 
            borderDownColor: TEXT_DANGER, 
            borderVisible: true 
        },
        Line: { color: ACCENT_COLOR, lineWidth: 2, lineType: LineType.Simple },
        StepLine: { color: '#FFD700', lineWidth: 2, lineType: LineType.Step }, // Warning color (Yellow/Gold)
        Area: { topColor: `${ACCENT_COLOR}44`, bottomColor: `${BG_DARK}00`, lineColor: ACCENT_COLOR, lineWidth: 2 },
        Baseline: { 
            topLineColor: TEXT_SUCCESS, 
            topFillColor1: `${TEXT_SUCCESS}48`, 
            topFillColor2: `${TEXT_SUCCESS}0A`, 
            bottomLineColor: TEXT_DANGER, 
            bottomFillColor1: `${TEXT_DANGER}0A`, 
            bottomFillColor2: `${TEXT_DANGER}48`, 
            lineWidth: 2 
        },
        Bar: { upColor: TEXT_SUCCESS, downColor: TEXT_DANGER }
    });

    // --- 1. LOGIC: COUNTDOWN TIMER ---
    useEffect(() => {
        const calculateCountdown = () => {
            const now = Math.floor(Date.now() / 1000);
            let duration = 3600; 
            if (timeframe.endsWith('m')) duration = parseInt(timeframe) * 60;
            else if (timeframe.endsWith('H')) duration = parseInt(timeframe) * 3600;
            else if (timeframe.endsWith('D')) duration = parseInt(timeframe) * 86400;
            else if (timeframe.endsWith('W')) duration = parseInt(timeframe) * 604800;
            else if (timeframe.endsWith('M')) duration = 2592000; // 30 hari sebagai perkiraan

            const nextCandleTime = Math.ceil(now / duration) * duration;
            const diff = nextCandleTime - now;
            
            // Handle timer habis
            if (diff <= 0) {
                 // Langsung trigger fetch data baru (mock logic)
                 setCountdown('00:00');
                 // Anda mungkin ingin me-trigger re-fetch data di sini
                 return;
            }

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            let timerStr = hours > 0 
                ? `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`
                : `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
            setCountdown(timerStr);
        };

        calculateCountdown();
        const interval = setInterval(calculateCountdown, 1000);
        return () => clearInterval(interval);
    }, [timeframe]);


    // --- 2. HELPER: STYLE UPDATE (untuk Settings Panel) ---
    const updateStyle = (type, key, value) => {
        setChartStyles(prev => {
            const currentStyle = { ...prev[type] };
            currentStyle[key] = value;
            if (key === 'upColor') { if (currentStyle.wickUpColor) currentStyle.wickUpColor = value; if (currentStyle.borderUpColor) currentStyle.borderUpColor = value; }
            if (key === 'downColor') { if (currentStyle.wickDownColor) currentStyle.wickDownColor = value; if (currentStyle.borderDownColor) currentStyle.borderDownColor = value; }
            return { ...prev, [type]: currentStyle };
        });
    };
    const updateConfig = (key, value) => setChartConfig(prev => ({ ...prev, [key]: value }));


    // --- 3. EFFECT: CHART INITIALIZATION (perubahan aset) ---
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            // Layout menggunakan HARDCODE CONFIG
            layout: { 
                background: { type: ColorType.VerticalGradient, topColor: chartConfig.topColor, bottomColor: chartConfig.bottomColor }, 
                textColor: chartConfig.textColor,
                fontFamily: "'Roboto Mono', monospace",
                attributionLogo: false, 
            },
            grid: { 
                vertLines: { color: chartConfig.gridColor, style: LineStyle.Dotted }, 
                horzLines: { color: chartConfig.gridColor, style: LineStyle.Dotted } 
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            localization: {
                locale: 'id-ID', 
                dateFormat: 'dd MMM yyyy',
                priceFormatter: (price) => formatNumber(price, price < 0.1 ? 5 : 2) // Price Precision Dinamis
            },
            timeScale: { 
                timeVisible: true, secondsVisible: false, borderColor: BORDER_COLOR, rightOffset: 12, fixLeftEdge: true, minBarSpacing: 5,
            },
            rightPriceScale: { borderColor: BORDER_COLOR, scaleMargins: { top: 0.1, bottom: 0.1 } },
            crosshair: { 
                mode: CrosshairMode.Normal,
                vertLine: { width: 1, color: ACCENT_COLOR, style: LineStyle.Dashed, labelBackgroundColor: BG_PANEL }, 
                horzLine: { width: 1, color: ACCENT_COLOR, style: LineStyle.Dashed, labelBackgroundColor: BG_PANEL }, 
            },
        });

        chartInstanceRef.current = chart;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartInstanceRef.current) chart.remove();
            chartInstanceRef.current = null;
            seriesInstanceRef.current = null;
        };
    }, [selectedAsset]); 


    // --- 4. EFFECT: CONFIG & STYLE UPDATE (Internal) ---
    useEffect(() => {
        if(!chartInstanceRef.current) return;
        chartInstanceRef.current.applyOptions({
            layout: { background: { type: ColorType.VerticalGradient, topColor: chartConfig.topColor, bottomColor: chartConfig.bottomColor }, textColor: chartConfig.textColor },
            grid: { vertLines: { color: chartConfig.gridColor }, horzLines: { color: chartConfig.gridColor } }
        });
        
        // Apply new styles to existing series if available
        if (seriesInstanceRef.current) {
            seriesInstanceRef.current.applyOptions(chartStyles[chartType]);
        }
    }, [chartConfig, chartStyles, chartType]);

    
    // --- 5. EFFECT: SERIES MANAGEMENT (Data Change) & TOOLTIP ---
    useEffect(() => {
        if (!chartInstanceRef.current || !candleData) return;
        const chart = chartInstanceRef.current;

        // A. REMOVE OLD SERIES
        if (seriesInstanceRef.current) {
            try { chart.removeSeries(seriesInstanceRef.current); } catch(e) {}
            seriesInstanceRef.current = null;
        }

        let dataToSet = [];
        const isOHLC = ['Candlestick', 'HollowCandle', 'Bar'].includes(chartType);
        
        // B. PREPARE DATA
        if (isOHLC) {
            dataToSet = candleData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
        } else {
            dataToSet = candleData.map(d => ({ time: d.time, value: d.close }));
        }
        
        if (dataToSet.length === 0) return;
        dataToSet.sort((a, b) => a.time - b.time);

        // C. ADD NEW SERIES
        const style = chartStyles[chartType] || {};
        let newSeries;

        try {
            switch (chartType) {
                case 'Candlestick': case 'HollowCandle': newSeries = chart.addSeries(CandlestickSeries, style); break;
                case 'Bar': newSeries = chart.addSeries(BarSeries, style); break;
                case 'Line': case 'StepLine': newSeries = chart.addSeries(LineSeries, style); break;
                case 'Area': newSeries = chart.addSeries(AreaSeries, style); break;
                case 'Baseline':
                    const avg = dataToSet.length > 0 ? dataToSet[0].value : 0;
                    newSeries = chart.addSeries(BaselineSeries, { ...style, baseValue: { type: 'price', price: avg } });
                    break;
                default: newSeries = chart.addSeries(CandlestickSeries, {});
            }
            newSeries.setData(dataToSet);
            seriesInstanceRef.current = newSeries; 
            chart.timeScale().fitContent();
        } catch (err) { console.error("Error creating series:", err); }

        // D. TOOLTIP LOGIC (Hardcoded Style)
        if (showTooltip) {
            chart.subscribeCrosshairMove(param => {
                if (!tooltipRef.current) return;
                const activeSeries = seriesInstanceRef.current; 
                if (!activeSeries || !param.time || !param.point) {
                    tooltipRef.current.style.display = 'none';
                    return;
                }
                
                const data = param.seriesData.get(activeSeries);
                if (data) {
                    tooltipRef.current.style.display = 'block';
                    // Style Hardcoded
                    tooltipRef.current.className = `absolute z-40 pointer-events-none bg-[#1E1E1E90] backdrop-blur border ${BORDER_COLOR} p-2 shadow-lg`;

                    const dateStr = new Date(param.time * 1000).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    let html = `<div class="font-mono text-[10px] text-gray-400 mb-1 border-b ${BORDER_COLOR} pb-1">${dateStr}</div>`;
                    
                    const formatPrice = (p) => formatNumber(p, p < 0.1 ? 5 : 2);

                    if (isOHLC) {
                        html += `
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                            <div class="flex justify-between gap-2"><span class="text-gray-500">O</span> <span class="text-white font-mono">${formatPrice(data.open)}</span></div>
                            <div class="flex justify-between gap-2"><span class="text-gray-500">H</span> <span class="text-white font-mono">${formatPrice(data.high)}</span></div>
                            <div class="flex justify-between gap-2"><span class="text-gray-500">L</span> <span class="text-white font-mono">${formatPrice(data.low)}</span></div>
                            <div class="flex justify-between gap-2"><span class="text-gray-500">C</span> <span class="text-white font-mono">${formatPrice(data.close)}</span></div>
                        </div>`;
                    } else {
                        html += `<div class="${TEXT_ACCENT} font-bold text-sm">${formatPrice(data.value)}</div>`;
                    }
                    
                    tooltipRef.current.innerHTML = html;
                    
                    // Positioning logic
                    const value = isOHLC ? data.close : data.value;
                    const coordinate = activeSeries.priceToCoordinate(value);
                    if (coordinate !== null) {
                        const x = Math.max(0, Math.min(chartContainerRef.current.clientWidth - 110, param.point.x - 55));
                        const y = Math.max(0, Math.min(chartContainerRef.current.clientHeight - 80, coordinate - 80));
                        tooltipRef.current.style.left = `${x}px`;
                        tooltipRef.current.style.top = `${y}px`;
                    }
                }
            });
        } else { chart.unsubscribeCrosshairMove(); }

        // Cleanup function for series/chart update (already defined in initial effect, but useful here too)
        return () => { chart.unsubscribeCrosshairMove(); };
    }, [chartType, candleData, showTooltip, chartStyles]); 

    // --- 6. EFFECT: REALTIME UPDATE ---
    useEffect(() => {
        if (!seriesInstanceRef.current || !lastCandle) return;
        
        // A. Update Series Data
        try {
            if (['Candlestick', 'HollowCandle', 'Bar'].includes(chartType)) { 
                seriesInstanceRef.current.update(lastCandle); 
            } else { 
                seriesInstanceRef.current.update({ time: lastCandle.time, value: lastCandle.close }); 
            }
            
            // B. PERBAIKAN: MEMAKSA CHART SCROLL KE BAR TERAKHIR (Realtime Sync)
            // Ini akan menghilangkan jeda visual saat ada update harga
            chartInstanceRef.current.timeScale().scrollToRealTime();

        } catch (e) {}
    }, [lastCandle, chartType]);

    
    // --- 7. RENDER COMPONENT ---

    // Data OHL Realtime untuk Header
    const currentOhlc = lastCandle || (candleData.length > 0 ? candleData[candleData.length - 1] : null);
    const formatPrice = (p) => formatNumber(p, priceData.price < 0.1 ? 5 : 2);

    return (
        <div className={`flex-1 flex flex-col bg-[#0D0D0D] relative group overflow-hidden chart-wrapper`}>
            
            {/* HEADER CONTROLS (Hardcoded Styles) */}
            <div className={`h-12 border-b ${BORDER_COLOR} flex items-center justify-between px-3 bg-[#1E1E1E] z-30 relative`}>
                <div className="flex items-center gap-4">
                    
                    {/* SYMBOL & PRICE */}
                    <h1 className={`text-xl font-bold ${TEXT_ACCENT} tracking-widest`}>{selectedAsset}</h1>
                    {priceData && (
                        <div className="flex items-center gap-3">
                            <span className={`font-bold text-lg ${priceData.positive ? TEXT_SUCCESS : TEXT_DANGER}`}> 
                                {formatNumber(priceData.price, priceData.price < 0.1 ? 5 : 2)}
                            </span>
                            
                            {/* OHLC STATS */}
                            {currentOhlc && (
                                <div className="flex items-center gap-3 text-white text-[10px] font-mono">
                                    <span className="text-gray-500">O:<span className="ml-1 text-white">{formatPrice(currentOhlc.open)}</span></span>
                                    <span className="text-gray-500">H:<span className="ml-1 text-green-400">{formatPrice(currentOhlc.high)}</span></span>
                                    <span className="text-gray-500">L:<span className="ml-1 text-red-500">{formatPrice(currentOhlc.low)}</span></span>
                                    <span className="text-gray-500">C:<span className="ml-1 text-white">{formatPrice(currentOhlc.close)}</span></span>
                                </div>
                            )}

                            {/* TIMER */}
                            <div className={`flex items-center gap-1.5 bg-[#0D0D0D] px-2 py-0.5 border ${BORDER_COLOR}`}>
                                <Clock size={10} className="text-gray-500" />
                                <span className={`text-[10px] font-mono ${TEXT_ACCENT} font-bold tracking-widest`}>{countdown}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Chart Type Select */}
                    <div className={`flex bg-[#0D0D0D] border ${BORDER_COLOR} p-1`}>
                        <select value={chartType} onChange={(e) => setChartType(e.target.value)} className={`bg-transparent text-[10px] text-gray-300 outline-none font-bold uppercase cursor-pointer bg-[#0D0D0D]`}>
                            <option className={BG_DARK} value="Candlestick">Candle</option>
                            <option className={BG_DARK} value="HollowCandle">Hollow</option>
                            <option className={BG_DARK} value="Line">Line</option>
                            <option className={BG_DARK} value="Area">Area</option>
                            <option className={BG_DARK} value="Baseline">Baseline</option>
                            <option className={BG_DARK} value="Bar">Bar</option>
                        </select>
                    </div>

                    {/* Timeframes */}
                    <div className={`flex bg-[#0D0D0D] border ${BORDER_COLOR} p-0.5 max-w-[250px] overflow-x-auto no-scrollbar`}>
                        {TIMEFRAMES.map(tf => (
                            <button key={tf} onClick={() => setTimeframe(tf)} 
                            // Hardcode Accent Color
                            className={`px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition-colors ${timeframe === tf ? `bg-amber-500 text-black shadow-[0_0_8px_#F59E0B]` : 'text-gray-500 hover:text-white'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                    {/* Settings Button */}
                    <button onClick={() => setShowSettings(!showSettings)} 
                        className={`p-1.5 border ${BORDER_COLOR} ${showSettings ? `${TEXT_ACCENT} bg-[#0D0D0D]` : 'text-gray-600'}`}
                    >
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* SETTINGS PANEL (Hardcoded Styles) */}
            {showSettings && (
                <div onMouseDown={(e) => e.stopPropagation()} className={`absolute top-14 right-3 w-56 bg-[#1E1E1E]/95 backdrop-blur border ${BORDER_COLOR} z-50 shadow-2xl p-3`}>
                    <div className="flex justify-between items-center mb-3 border-b border-[#222] pb-2">
                        <span className={`text-[10px] font-bold ${TEXT_ACCENT} uppercase flex items-center gap-2`}><Settings size={10} /> Chart Config</span>
                        <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
                        <div className="text-[9px] text-gray-500 font-bold mb-1 mt-1 border-b border-[#222] pb-1">BACKGROUND & GRID</div>
                        {/* INPUTS MENGGUNAKAN HARDCODE */}
                        <ColorInput label="Bg Top" value={chartConfig.topColor} onChange={(v) => updateConfig('topColor', v)} />
                        <ColorInput label="Bg Bottom" value={chartConfig.bottomColor} onChange={(v) => updateConfig('bottomColor', v)} />
                        <ColorInput label="Grid Color" value={chartConfig.gridColor} onChange={(v) => updateConfig('gridColor', v)} />
                        <div className="text-[9px] text-gray-500 font-bold mb-1 mt-3 border-b border-[#222] pb-1">SERIES STYLE</div>
                        {(chartType === 'Candlestick' || chartType === 'HollowCandle') && (
                            <>
                                <ColorInput label="Up Color" value={chartStyles[chartType].upColor} onChange={(v) => updateStyle(chartType, 'upColor', v)} />
                                <ColorInput label="Down Color" value={chartStyles[chartType].downColor} onChange={(v) => updateStyle(chartType, 'downColor', v)} />
                            </>
                        )}
                        {/* Tambahkan input warna lain yang relevan di sini jika diperlukan */}
                    </div>
                </div>
            )}

            {/* CHART & TOOLTIP CONTAINER */}
            <div className="flex-1 relative overflow-hidden">
                {/* TOOLTIP (Hardcoded Style) */}
                <div ref={tooltipRef} className={`absolute z-40 pointer-events-none bg-[#1E1E1E90] backdrop-blur border ${BORDER_COLOR} p-2 shadow-lg`} style={{ display: 'none' }} />
                
                {/* CHART CONTAINER */}
                <div ref={chartContainerRef} className="absolute inset-0 z-10 cursor-none" />
                
                {/* LOADING SCREEN (Hardcoded Style) */}
                {(!candleData || candleData.length === 0) && (
                    <div className={`absolute inset-0 flex items-center justify-center z-20 bg-[#0D0D0D] backdrop-blur`}>
                        <span className={`${TEXT_ACCENT} text-base font-mono animate-pulse`}>FETCHING CHART DATA...</span>
                    </div>
                )}
            </div>

            {/* CSS KILL SWITCH & SCROLLBAR STYLE (DIBIARKAN) */}
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; } 
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #F59E0B; }

                /* PAKSA HIDE SEMUA LINK DI DALAM CHART WRAPPER */
                .chart-wrapper a, 
                .chart-wrapper a:visited, 
                .chart-wrapper a:hover,
                #tv-attr-logo,
                [id^="tradingview"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `}</style>
        </div>
    );
};

export default ChartWidget;