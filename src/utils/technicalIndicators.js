// src/utils/technicalIndicators.js

// --- HELPER: AMBIL VALUE ---
const getSource = (bar, source = 'close') => {
    if (source === 'hl2') return (bar.high + bar.low) / 2;
    if (source === 'hlc3') return (bar.high + bar.low + bar.close) / 3;
    if (source === 'ohlc4') return (bar.open + bar.high + bar.low + bar.close) / 4;
    return bar.close || bar.value;
};

// 1. SIMPLE MOVING AVERAGE (SMA)
export const calculateSMA = (data, period = 20) => {
    if (data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + getSource(curr), 0);
        result.push({ time: data[i].time, value: sum / period });
    }
    return result;
};

// 2. EXPONENTIAL MOVING AVERAGE (EMA) - Lebih responsif dari SMA
export const calculateEMA = (data, period = 20) => {
    if (data.length < period) return [];
    const result = [];
    const k = 2 / (period + 1);
    
    // EMA awal biasanya dimulai dengan SMA
    let firstSMA = 0;
    for (let i = 0; i < period; i++) firstSMA += getSource(data[i]);
    firstSMA /= period;
    
    result.push({ time: data[period - 1].time, value: firstSMA });

    for (let i = period; i < data.length; i++) {
        const price = getSource(data[i]);
        const prevEMA = result[result.length - 1].value;
        const ema = (price - prevEMA) * k + prevEMA;
        result.push({ time: data[i].time, value: ema });
    }
    return result;
};

// 3. WEIGHTED MOVING AVERAGE (WMA)
export const calculateWMA = (data, period = 20) => {
    if (data.length < period) return [];
    const result = [];
    let weightSum = 0;
    for (let i = 1; i <= period; i++) weightSum += i;

    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
            // Data paling baru bobotnya paling besar
            sum += getSource(data[i - period + 1 + j]) * (j + 1);
        }
        result.push({ time: data[i].time, value: sum / weightSum });
    }
    return result;
};

// 4. WEIGHTED CLOSE PRICE (HLC / 4) - Salah satu varian Weighted Price
export const calculateWeightedClose = (data) => {
    return data.map(d => ({
        time: d.time,
        // Formula: (High + Low + 2 * Close) / 4
        value: (d.high + d.low + 2 * d.close) / 4 
    }));
};

// 5. MEDIAN PRICE (HL / 2)
export const calculateMedianPrice = (data) => {
    return data.map(d => ({
        time: d.time,
        value: (d.high + d.low) / 2
    }));
};

// 6. TYPICAL PRICE (HLC / 3) - Sering dipakai untuk Pivot Points
export const calculateTypicalPrice = (data) => {
    return data.map(d => ({
        time: d.time,
        value: (d.high + d.low + d.close) / 3
    }));
};

// 7. MOMENTUM (ROC - Rate of Change Sederhana)
// Note: Momentum biasanya osilator (beda skala), tapi bisa digambar.
export const calculateMomentum = (data, period = 10) => {
    if (data.length < period) return [];
    const result = [];
    for (let i = period; i < data.length; i++) {
        // Momentum = PriceNow - PriceNPeriodsAgo
        const val = getSource(data[i]) - getSource(data[i - period]);
        result.push({ time: data[i].time, value: val });
    }
    return result;
};