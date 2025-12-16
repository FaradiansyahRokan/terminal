// src/components/ChartWidget.jsx

import React, { useRef, useEffect, useState } from 'react';
import { 
    createChart, 
    ColorType, 
    CandlestickSeries, 
    AreaSeries, 
    LineSeries, 
    BarSeries, 
    BaselineSeries, 
    HistogramSeries, 
    LineStyle, 
    CrosshairMode 
} from 'lightweight-charts';
import { formatNumber, formatCompact } from '../utils/constants'; 
import { 
    calculateSMA, calculateEMA, calculateWMA, 
    calculateWeightedClose, calculateMedianPrice, calculateTypicalPrice 
} from '../utils/technicalIndicators';
import { Settings, Clock, X, ToggleLeft, ToggleRight } from 'lucide-react'; 

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '2H', '4H', '1D', '1W', '1M'];

// --- COLORS CONSTANTS ---
const ACCENT_COLOR = '#F59E0B'; 
const TEXT_ACCENT = 'text-amber-500';
const BORDER_COLOR = 'border-[#333333]'; 
const BG_PANEL = '#1E1E1E'; 
const BG_DARK = '#0D0D0D'; 
const TEXT_SUCCESS = '#34D399'; 
const TEXT_DANGER = '#EF4444'; 

// --- UI COMPONENTS ---
const ColorInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between gap-2 mb-2 p-1.5 hover:bg-[#252525] rounded transition-colors group">
        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tight group-hover:text-gray-200 transition-colors">{label}</span>
        <div className="relative w-6 h-6 rounded-full border border-[#444] overflow-hidden shadow-sm cursor-pointer hover:scale-110 transition-transform">
            <div className="absolute inset-0 z-0" style={{ backgroundColor: value }} />
            <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        </div>
    </div>
);

const ToggleInput = ({ label, active, onToggle }) => (
    <div className="flex items-center justify-between gap-2 mb-2 p-1.5 hover:bg-[#252525] rounded transition-colors cursor-pointer group" onClick={onToggle}>
        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tight group-hover:text-gray-200 transition-colors">{label}</span>
        {active ? <ToggleRight size={20} className={TEXT_ACCENT} /> : <ToggleLeft size={20} className="text-gray-600" />}
    </div>
);

// Slider untuk Volume Height
const RangeInput = ({ label, value, onChange, min, max, step }) => (
    <div className="mb-3 px-1.5">
        <div className="flex justify-between mb-1">
            <span className="text-[9px] text-gray-400 uppercase tracking-tight">{label}</span>
            <span className="text-[9px] text-amber-500 font-mono">{Math.round(value * 100)}%</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
    </div>
);

const ChartWidget = ({ selectedAsset, timeframe, setTimeframe, candleData, lastCandle, priceData }) => {
    const chartContainerRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const seriesInstanceRef = useRef(null); 
    const volumeSeriesRef = useRef(null);   
    const indicatorSeriesMap = useRef(new Map()); 
    const tooltipRef = useRef(null);
    
    // 🔥 FIX: KEMBALI MENGGUNAKAN NAMA priceLinesRef AGAR KONSISTEN
    const priceLinesRef = useRef({ high: null, low: null, avg: null });

    // --- STATE UI ---
    const [chartType, setChartType] = useState('Candlestick'); 
    const [showTooltip, setShowTooltip] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [countdown, setCountdown] = useState('--:--');

    // --- STATE FITUR ---
    const [showVolume, setShowVolume] = useState(true);
    const [volumeHeight, setVolumeHeight] = useState(0.15); 
    
    const [showHighLine, setShowHighLine] = useState(true);
    const [showLowLine, setShowLowLine] = useState(true);
    const [showAvgLine, setShowAvgLine] = useState(false);

    // --- STATE INDICATORS ---
    const [indicators, setIndicators] = useState({
        SMA: { active: false, period: 20, color: '#3B82F6', name: 'Simple MA' },
        EMA: { active: false, period: 20, color: '#F59E0B', name: 'Exponential MA' },
        WMA: { active: false, period: 20, color: '#8B5CF6', name: 'Weighted MA' },
        W_CLOSE: { active: false, period: 0, color: '#EC4899', name: 'Weighted Close' }, 
        MEDIAN: { active: false, period: 0, color: '#10B981', name: 'Median Price' },
        TYPICAL: { active: false, period: 0, color: '#6366F1', name: 'Typical Price' },
    });

    // --- STYLES ---
    const [chartConfig, setChartConfig] = useState({
        topColor: BG_DARK, bottomColor: BG_PANEL, gridColor: BORDER_COLOR, textColor: '#8A8A8A', 
    });

    const [chartStyles, setChartStyles] = useState({
        Candlestick: { upColor: TEXT_SUCCESS, downColor: TEXT_DANGER, wickUpColor: TEXT_SUCCESS, wickDownColor: TEXT_DANGER, borderVisible: false },
        HollowCandle: { upColor: BG_DARK, downColor: BG_DARK, wickUpColor: TEXT_SUCCESS, wickDownColor: TEXT_DANGER, borderUpColor: TEXT_SUCCESS, borderDownColor: TEXT_DANGER, borderVisible: true },
        Line: { color: ACCENT_COLOR, lineWidth: 2 },
        Area: { topColor: `${ACCENT_COLOR}44`, bottomColor: `${BG_DARK}00`, lineColor: ACCENT_COLOR, lineWidth: 2 },
        Baseline: { topLineColor: TEXT_SUCCESS, topFillColor1: `${TEXT_SUCCESS}48`, topFillColor2: `${TEXT_SUCCESS}0A`, bottomLineColor: TEXT_DANGER, bottomFillColor1: `${TEXT_DANGER}0A`, bottomFillColor2: `${TEXT_DANGER}48`, lineWidth: 2 },
        Bar: { upColor: TEXT_SUCCESS, downColor: TEXT_DANGER },
        Volume: { upColor: `${TEXT_SUCCESS}80`, downColor: `${TEXT_DANGER}80` }
    });

    // Helpers
    const updateIndicator = (key, field, value) => setIndicators(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
    const updateStyle = (type, key, value) => {
        setChartStyles(prev => {
            const style = { ...prev[type] };
            style[key] = value;
            if(type === 'Candlestick' || type === 'HollowCandle') {
                if (key === 'upColor') { if(style.wickUpColor) style.wickUpColor = value; if(style.borderUpColor) style.borderUpColor = value; }
                if (key === 'downColor') { if(style.wickDownColor) style.wickDownColor = value; if(style.borderDownColor) style.borderDownColor = value; }
            }
            return { ...prev, [type]: style };
        });
    };
    const updateConfig = (key, value) => setChartConfig(prev => ({ ...prev, [key]: value }));

    // --- 1. COUNTDOWN TIMER ---
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            let dur = 3600; 
            if (timeframe.endsWith('m')) dur = parseInt(timeframe) * 60;
            else if (timeframe.endsWith('H')) dur = parseInt(timeframe) * 3600;
            else if (timeframe.endsWith('D')) dur = parseInt(timeframe) * 86400;
            else if (timeframe.endsWith('W')) dur = parseInt(timeframe) * 604800;
            const diff = (Math.ceil(now / dur) * dur) - now;
            if (diff <= 0) { setCountdown('00:00'); return; }
            const h = Math.floor(diff / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;
            setCountdown(`${h > 0 ? h+':' : ''}${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeframe]);

    // --- 2. INITIALIZE CHART ---
    useEffect(() => {
        if (!chartContainerRef.current) return;
        
        // Setup Chart Instance
        const chart = createChart(chartContainerRef.current, {
            layout: { background: { type: ColorType.VerticalGradient, topColor: chartConfig.topColor, bottomColor: chartConfig.bottomColor }, textColor: chartConfig.textColor, fontFamily: "'Roboto Mono', monospace", attributionLogo: false },
            grid: { vertLines: { color: chartConfig.gridColor, style: LineStyle.Dotted }, horzLines: { color: chartConfig.gridColor, style: LineStyle.Dotted } },
            width: chartContainerRef.current.clientWidth, 
            height: chartContainerRef.current.clientHeight,
            localization: { locale: 'id-ID', dateFormat: 'dd MMM', priceFormatter: (p) => formatNumber(p, p < 0.1 ? 5 : 2) },
            timeScale: { timeVisible: true, secondsVisible: false, borderColor: BORDER_COLOR, rightOffset: 12, minBarSpacing: 5 },
            crosshair: { mode: CrosshairMode.Normal, vertLine: { width: 1, color: ACCENT_COLOR, style: LineStyle.Dashed, labelBackgroundColor: BG_PANEL }, horzLine: { width: 1, color: ACCENT_COLOR, style: LineStyle.Dashed, labelBackgroundColor: BG_PANEL } },
        });
        chartInstanceRef.current = chart;

        // 🔥 FIX: GUNAKAN RESIZE OBSERVER AGAR CHART RESPONSIF TERHADAP PANEL DRAG 🔥
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
            const newRect = entries[0].contentRect;
            chart.applyOptions({ width: newRect.width, height: newRect.height });
        });

        resizeObserver.observe(chartContainerRef.current);
        
        return () => {
            resizeObserver.disconnect(); // Cleanup observer
            chart.remove();
            chartInstanceRef.current = null;
            seriesInstanceRef.current = null;
            volumeSeriesRef.current = null;
            indicatorSeriesMap.current.clear();
        };
    }, [selectedAsset]);

    // --- 3. DYNAMIC CONFIG UPDATES ---
    useEffect(() => {
        if(!chartInstanceRef.current) return;
        
        chartInstanceRef.current.applyOptions({
            layout: { background: { type: ColorType.VerticalGradient, topColor: chartConfig.topColor, bottomColor: chartConfig.bottomColor }, textColor: chartConfig.textColor },
            grid: { vertLines: { color: chartConfig.gridColor }, horzLines: { color: chartConfig.gridColor } }
        });

        if(volumeSeriesRef.current) {
            chartInstanceRef.current.priceScale('vol_scale').applyOptions({
                scaleMargins: { top: 1 - volumeHeight, bottom: 0 },
            });
        }

        if (seriesInstanceRef.current) seriesInstanceRef.current.applyOptions(chartStyles[chartType]);
        if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions(chartStyles.Volume);

    }, [chartConfig, chartStyles, chartType, volumeHeight]);

    // --- 4. HEAVY DATA LOADING (HISTORY) ---
    useEffect(() => {
        if (!chartInstanceRef.current || !candleData || candleData.length === 0) return;
        const chart = chartInstanceRef.current;

        // A. Setup Main Series
        if (seriesInstanceRef.current) { try { chart.removeSeries(seriesInstanceRef.current); } catch(e){} }
        
        let newSeries;
        const style = chartStyles[chartType] || {};
        switch (chartType) {
            case 'Candlestick': case 'HollowCandle': newSeries = chart.addSeries(CandlestickSeries, style); break;
            case 'Bar': newSeries = chart.addSeries(BarSeries, style); break;
            case 'Line': case 'StepLine': newSeries = chart.addSeries(LineSeries, style); break;
            case 'Area': newSeries = chart.addSeries(AreaSeries, style); break;
            case 'Baseline': newSeries = chart.addSeries(BaselineSeries, { ...style, baseValue: { type: 'price', price: candleData[0]?.close || 0 } }); break;
            default: newSeries = chart.addSeries(CandlestickSeries, {});
        }
        seriesInstanceRef.current = newSeries;

        // B. Set Main Data
        let dataToSet = [];
        const isOHLC = ['Candlestick', 'HollowCandle', 'Bar'].includes(chartType);
        if (isOHLC) {
            dataToSet = candleData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
        } else {
            dataToSet = candleData.map(d => ({ time: d.time, value: d.close }));
        }
        dataToSet.sort((a, b) => a.time - b.time);
        newSeries.setData(dataToSet);

        // C. Setup Volume
        if (volumeSeriesRef.current) { try { chart.removeSeries(volumeSeriesRef.current); } catch(e){} volumeSeriesRef.current = null; }
        if (showVolume) {
            volumeSeriesRef.current = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: 'vol_scale' });
            chart.priceScale('vol_scale').applyOptions({ scaleMargins: { top: 1 - volumeHeight, bottom: 0 }, visible: false });
            
            const volData = candleData.map(d => ({
                time: d.time, value: d.volume,
                color: d.close >= d.open ? chartStyles.Volume.upColor : chartStyles.Volume.downColor
            })).sort((a,b) => a.time - b.time);
            volumeSeriesRef.current.setData(volData);
        }

        // D. Setup Indicators
        indicatorSeriesMap.current.forEach(s => chart.removeSeries(s));
        indicatorSeriesMap.current.clear();

        Object.keys(indicators).forEach(key => {
            if (indicators[key].active) {
                let indData = [];
                switch(key) {
                    case 'SMA': indData = calculateSMA(dataToSet, indicators[key].period); break;
                    case 'EMA': indData = calculateEMA(dataToSet, indicators[key].period); break;
                    case 'WMA': indData = calculateWMA(dataToSet, indicators[key].period); break;
                    case 'W_CLOSE': indData = calculateWeightedClose(dataToSet); break;
                    case 'MEDIAN': indData = calculateMedianPrice(dataToSet); break;
                    case 'TYPICAL': indData = calculateTypicalPrice(dataToSet); break;
                }
                if (indData.length > 0) {
                    const s = chart.addSeries(LineSeries, { 
                        color: indicators[key].color, lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false 
                    });
                    s.setData(indData);
                    indicatorSeriesMap.current.set(key, s);
                }
            }
        });

        // 🔥 LOGIC BARU: DYNAMIC HIGH/LOW LINES (Menggunakan priceLinesRef yang sudah diperbaiki)
        const updateDynamicLines = () => {
            const logicalRange = chart.timeScale().getVisibleLogicalRange();
            if (!logicalRange || !seriesInstanceRef.current) return;

            const fromIndex = Math.max(0, Math.ceil(logicalRange.from));
            const toIndex = Math.min(dataToSet.length - 1, Math.floor(logicalRange.to));

            if (fromIndex > toIndex) return;

            const visibleSlice = dataToSet.slice(fromIndex, toIndex + 1);
            if (visibleSlice.length === 0) return;

            let maxP = -Infinity;
            let minP = Infinity;

            visibleSlice.forEach(d => {
                const h = isOHLC ? d.high : d.value;
                const l = isOHLC ? d.low : d.value;
                if (h > maxP) maxP = h;
                if (l < minP) minP = l;
            });
            const avgP = (maxP + minP) / 2;

            // Remove Old
            if (priceLinesRef.current.high) {
                seriesInstanceRef.current.removePriceLine(priceLinesRef.current.high);
                priceLinesRef.current.high = null;
            }
            if (priceLinesRef.current.low) {
                seriesInstanceRef.current.removePriceLine(priceLinesRef.current.low);
                priceLinesRef.current.low = null;
            }
            if (priceLinesRef.current.avg) {
                seriesInstanceRef.current.removePriceLine(priceLinesRef.current.avg);
                priceLinesRef.current.avg = null;
            }

            // Add New
            const addL = (p, c, t, s) => seriesInstanceRef.current.createPriceLine({ price: p, color: c, lineWidth: 1, lineStyle: s, axisLabelVisible: true, title: t });
            
            if (showHighLine && maxP > -Infinity) priceLinesRef.current.high = addL(maxP, '#34D399', 'H', LineStyle.Dashed);
            if (showLowLine && minP < Infinity) priceLinesRef.current.low = addL(minP, '#EF4444', 'L', LineStyle.Dashed);
            if (showAvgLine) priceLinesRef.current.avg = addL(avgP, '#F59E0B', 'Avg', LineStyle.Dotted);
        };

        chart.timeScale().subscribeVisibleLogicalRangeChange(updateDynamicLines);
        updateDynamicLines();
        chart.timeScale().fitContent();

        return () => {
            chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateDynamicLines);
        };

    }, [candleData, chartType, showVolume, showHighLine, showLowLine, showAvgLine]); 

    // --- 5. INDICATORS UPDATE (SEPARATED) ---
    useEffect(() => {
        if (!chartInstanceRef.current || !candleData || candleData.length === 0) return;
        const chart = chartInstanceRef.current;

        let dataToSet = [];
        const isOHLC = ['Candlestick', 'HollowCandle', 'Bar'].includes(chartType);
        if (isOHLC) dataToSet = candleData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
        else dataToSet = candleData.map(d => ({ time: d.time, value: d.close }));
        
        Object.keys(indicators).forEach(key => {
            const config = indicators[key];
            let series = indicatorSeriesMap.current.get(key);

            if (config.active) {
                let indData = [];
                switch(key) {
                    case 'SMA': indData = calculateSMA(dataToSet, config.period); break;
                    case 'EMA': indData = calculateEMA(dataToSet, config.period); break;
                    case 'WMA': indData = calculateWMA(dataToSet, config.period); break;
                    case 'W_CLOSE': indData = calculateWeightedClose(dataToSet); break;
                    case 'MEDIAN': indData = calculateMedianPrice(dataToSet); break;
                    case 'TYPICAL': indData = calculateTypicalPrice(dataToSet); break;
                }

                if (!series) {
                    series = chart.addSeries(LineSeries, { 
                        color: config.color, lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false 
                    });
                    indicatorSeriesMap.current.set(key, series);
                } else {
                    series.applyOptions({ color: config.color });
                }
                if(indData.length > 0) series.setData(indData);
            } else {
                if (series) {
                    chart.removeSeries(series);
                    indicatorSeriesMap.current.delete(key);
                }
            }
        });
    }, [indicators, candleData, chartType]);


    // --- 6. LIGHTWEIGHT REALTIME UPDATE ---
    useEffect(() => {
        if (!seriesInstanceRef.current || !lastCandle) return;
        try {
            if (['Candlestick', 'HollowCandle', 'Bar'].includes(chartType)) { 
                seriesInstanceRef.current.update(lastCandle); 
            } else { 
                seriesInstanceRef.current.update({ time: lastCandle.time, value: lastCandle.close }); 
            }

            if (showVolume && volumeSeriesRef.current) {
                volumeSeriesRef.current.update({
                    time: lastCandle.time, value: lastCandle.volume,
                    color: lastCandle.close >= lastCandle.open ? chartStyles.Volume.upColor : chartStyles.Volume.downColor
                });
            }

            if (candleData.length > 0) {
                const historySlice = candleData.slice(-200); 
                const liveData = [...historySlice, lastCandle];
                
                Object.keys(indicators).forEach(key => {
                    const conf = indicators[key];
                    if (conf.active) {
                        const s = indicatorSeriesMap.current.get(key);
                        if (s) {
                            let val = null;
                            switch(key) {
                                case 'SMA': val = calculateSMA(liveData, conf.period).pop(); break;
                                case 'EMA': val = calculateEMA(liveData, conf.period).pop(); break;
                                case 'WMA': val = calculateWMA(liveData, conf.period).pop(); break;
                                case 'W_CLOSE': val = calculateWeightedClose([lastCandle])[0]; break;
                                case 'MEDIAN': val = calculateMedianPrice([lastCandle])[0]; break;
                                case 'TYPICAL': val = calculateTypicalPrice([lastCandle])[0]; break;
                            }
                            if(val) s.update(val);
                        }
                    }
                });
            }
        } catch (e) {}
    }, [lastCandle, chartType, showVolume, indicators]); 

    // Tooltip
    useEffect(() => {
        if(!chartInstanceRef.current || !showTooltip) return;
        const chart = chartInstanceRef.current;
        
        chart.subscribeCrosshairMove(param => {
            if (!tooltipRef.current) return;
            if (!param.point || !param.time) { tooltipRef.current.style.display = 'none'; return; }
            
            tooltipRef.current.style.display = 'block';
            const dateStr = new Date(param.time * 1000).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            const formatP = (p) => formatNumber(p, p < 0.1 ? 5 : 2);
            
            let html = `<div class="font-mono text-[10px] text-gray-400 mb-1 border-b ${BORDER_COLOR} pb-1">${dateStr}</div>`;
            
            const mainData = param.seriesData.get(seriesInstanceRef.current);
            if (mainData) {
                if (['Candlestick', 'HollowCandle', 'Bar'].includes(chartType)) {
                    html += `
                    <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                        <div class="flex justify-between gap-2"><span class="text-gray-500">O</span> <span class="text-white font-mono">${formatP(mainData.open)}</span></div>
                        <div class="flex justify-between gap-2"><span class="text-gray-500">H</span> <span class="text-white font-mono">${formatP(mainData.high)}</span></div>
                        <div class="flex justify-between gap-2"><span class="text-gray-500">L</span> <span class="text-white font-mono">${formatP(mainData.low)}</span></div>
                        <div class="flex justify-between gap-2"><span class="text-gray-500">C</span> <span class="text-white font-mono">${formatP(mainData.close)}</span></div>
                    </div>`;
                } else {
                    html += `<div class="${TEXT_ACCENT} font-bold text-sm">${formatP(mainData.value)}</div>`;
                }
            }

            let hasInd = false;
            indicatorSeriesMap.current.forEach((ser, key) => {
                const val = param.seriesData.get(ser);
                if (val) {
                    if (!hasInd) { html += `<div class="mt-1 pt-1 border-t ${BORDER_COLOR} space-y-0.5">`; hasInd = true; }
                    html += `<div class="flex justify-between gap-2 text-[9px]">
                        <span style="color:${indicators[key].color}" class="font-bold">${indicators[key].name}</span>
                        <span class="text-white font-mono">${formatP(val.value)}</span>
                    </div>`;
                }
            });
            if (hasInd) html += `</div>`;

            if (showVolume && volumeSeriesRef.current) {
                const volVal = param.seriesData.get(volumeSeriesRef.current);
                if (volVal) {
                    html += `<div class="mt-1 pt-1 border-t ${BORDER_COLOR} flex justify-between gap-2 text-[9px]">
                        <span class="text-gray-500 font-bold">VOL</span>
                        <span class="${volVal.value >= 0 ? TEXT_SUCCESS : TEXT_DANGER} font-mono">${formatCompact(volVal.value)}</span>
                    </div>`;
                }
            }

            tooltipRef.current.innerHTML = html;
            const x = Math.max(0, Math.min(chartContainerRef.current.clientWidth - 130, param.point.x - 65));
            const y = Math.max(0, Math.min(chartContainerRef.current.clientHeight - 100, param.point.y - 80));
            tooltipRef.current.style.left = `${x}px`;
            tooltipRef.current.style.top = `${y}px`;
        });
        return () => chart.unsubscribeCrosshairMove();
    }, [chartType, indicators, showVolume, showTooltip]);

    const currentOhlc = lastCandle || (candleData.length > 0 ? candleData[candleData.length - 1] : null);
    const formatPrice = (p) => formatNumber(p, priceData.price < 0.1 ? 5 : 2);

    return (
        <div className={`flex-1 flex flex-col bg-[#0D0D0D] relative group overflow-hidden chart-wrapper`}>
            {/* HEADER CONTROLS */}
            <div className={`h-12 border-b ${BORDER_COLOR} flex items-center justify-between px-3 bg-[#1E1E1E] z-30 relative`}>
                <div className="flex items-center gap-4">
                    <h1 className={`text-xl font-bold ${TEXT_ACCENT} tracking-widest`}>{selectedAsset}</h1>
                    {priceData && (
                        <div className="flex items-center gap-3">
                            <span className={`font-bold text-lg ${priceData.positive ? TEXT_SUCCESS : TEXT_DANGER}`}> 
                                {formatNumber(priceData.price, priceData.price < 0.1 ? 5 : 2)}
                            </span>
                            {currentOhlc && (
                                <div className="hidden md:flex items-center gap-3 text-white text-[10px] font-mono">
                                    <span className="text-gray-500">O:<span className="ml-1 text-white">{formatPrice(currentOhlc.open)}</span></span>
                                    <span className="text-gray-500">H:<span className="ml-1 text-green-400">{formatPrice(currentOhlc.high)}</span></span>
                                    <span className="text-gray-500">L:<span className="ml-1 text-red-500">{formatPrice(currentOhlc.low)}</span></span>
                                    <span className="text-gray-500">C:<span className="ml-1 text-white">{formatPrice(currentOhlc.close)}</span></span>
                                </div>
                            )}
                            <div className={`flex items-center gap-1.5 bg-[#0D0D0D] px-2 py-0.5 border ${BORDER_COLOR}`}>
                                <Clock size={10} className="text-gray-500" />
                                <span className={`text-[10px] font-mono ${TEXT_ACCENT} font-bold tracking-widest`}>{countdown}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
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
                    <div className={`flex bg-[#0D0D0D] border ${BORDER_COLOR} p-0.5 max-w-[150px] md:max-w-[250px] overflow-x-auto no-scrollbar`}>
                        {TIMEFRAMES.map(tf => (
                            <button key={tf} onClick={() => setTimeframe(tf)} 
                            className={`px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition-colors ${timeframe === tf ? `bg-amber-500 text-black shadow-[0_0_8px_#F59E0B]` : 'text-gray-500 hover:text-white'}`}>
                                {tf}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 border ${BORDER_COLOR} ${showSettings ? `${TEXT_ACCENT} bg-[#0D0D0D]` : 'text-gray-600'}`}>
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            {/* SETTINGS PANEL */}
            {showSettings && (
                <div onMouseDown={(e) => e.stopPropagation()} className={`absolute top-14 right-3 w-64 bg-[#1E1E1E]/95 backdrop-blur border ${BORDER_COLOR} z-50 shadow-2xl p-3`}>
                    <div className="flex justify-between items-center mb-3 border-b border-[#222] pb-2">
                        <span className={`text-[10px] font-bold ${TEXT_ACCENT} uppercase flex items-center gap-2`}><Settings size={10} /> Chart Config</span>
                        <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white"><X size={12}/></button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-1 pb-2">
                        
                        <div className="text-[9px] text-gray-500 font-bold mb-2 border-b border-[#222] pb-1 uppercase tracking-wider">General</div>
                        <ToggleInput label="Show Volume" active={showVolume} onToggle={() => setShowVolume(!showVolume)} />
                        {showVolume && <RangeInput label="Volume Height" value={volumeHeight} onChange={setVolumeHeight} min={0.05} max={0.5} step={0.05} />}
                        
                        <div className="text-[9px] text-gray-500 font-bold mb-2 mt-3 border-b border-[#222] pb-1 uppercase tracking-wider">Technical Indicators</div>
                        {Object.keys(indicators).map(key => (
                            <div key={key} className="mb-2 bg-[#0D0D0D] p-2 rounded border border-[#333]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-bold ${indicators[key].active ? 'text-white' : 'text-gray-500'}`}>{indicators[key].name}</span>
                                    <div onClick={() => updateIndicator(key, 'active', !indicators[key].active)} className="cursor-pointer">
                                        {indicators[key].active ? <ToggleRight size={18} className={TEXT_ACCENT} /> : <ToggleLeft size={18} className="text-gray-600" />}
                                    </div>
                                </div>
                                {indicators[key].active && (
                                    <div className="flex gap-2">
                                        {indicators[key].period > 0 && (
                                            <input type="number" min="1" max="200" value={indicators[key].period} 
                                                onChange={(e) => updateIndicator(key, 'period', Number(e.target.value))} 
                                                className={`w-12 bg-[#222] border ${BORDER_COLOR} text-white text-[9px] p-1 rounded outline-none text-center`} 
                                            />
                                        )}
                                        <div className="flex-1">
                                            <div className="relative w-full h-full rounded border border-[#444] overflow-hidden">
                                                <div className="absolute inset-0" style={{backgroundColor: indicators[key].color}}/>
                                                <input type="color" value={indicators[key].color} onChange={(e) => updateIndicator(key, 'color', e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="text-[9px] text-gray-500 font-bold mb-2 mt-3 border-b border-[#222] pb-1 uppercase tracking-wider">Styles & Lines</div>
                        {(chartType === 'Line' || chartType === 'Area' || chartType === 'Baseline') && (
                            <>
                                <ColorInput label="Line Color" value={chartStyles[chartType].color || chartStyles.Baseline.topLineColor} 
                                    onChange={(v) => { if(chartType === 'Baseline') updateStyle('Baseline', 'topLineColor', v); else updateStyle(chartType, 'color', v); }} />
                                {chartType === 'Area' && <ColorInput label="Area Fill" value={chartStyles.Area.topColor} onChange={(v) => updateStyle('Area', 'topColor', v)} />}
                            </>
                        )}
                        {(chartType === 'Candlestick' || chartType === 'HollowCandle' || chartType === 'Bar') && (
                            <>
                                <ColorInput label="Bullish (Up)" value={chartStyles[chartType].upColor} onChange={(v) => updateStyle(chartType, 'upColor', v)} />
                                <ColorInput label="Bearish (Down)" value={chartStyles[chartType].downColor} onChange={(v) => updateStyle(chartType, 'downColor', v)} />
                            </>
                        )}
                        <ToggleInput label="High (Res)" active={showHighLine} onToggle={() => setShowHighLine(!showHighLine)} />
                        <ToggleInput label="Low (Sup)" active={showLowLine} onToggle={() => setShowLowLine(!showLowLine)} />
                        <ToggleInput label="Average" active={showAvgLine} onToggle={() => setShowAvgLine(!showAvgLine)} />
                    </div>
                </div>
            )}

            {/* CHART VIEWPORT */}
            <div className="flex-1 relative overflow-hidden">
                <div ref={tooltipRef} className={`absolute z-40 pointer-events-none bg-[#1E1E1E90] backdrop-blur border ${BORDER_COLOR} p-2 shadow-lg rounded`} style={{ display: 'none' }} />
                <div ref={chartContainerRef} className="absolute inset-0 z-10 cursor-crosshair" />
                {(!candleData || candleData.length === 0) && (
                    <div className={`absolute inset-0 flex items-center justify-center z-20 bg-[#0D0D0D] backdrop-blur`}>
                        <span className={`${TEXT_ACCENT} text-base font-mono animate-pulse`}>LOADING CHART...</span>
                    </div>
                )}
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; } 
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1E1E1E; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333333; }
                .chart-wrapper a, [id^="tradingview"] { display: none !important; }
            `}</style>
        </div>
    );
};

export default ChartWidget;