// src/utils/indicators.js

export const calculateRSI = (candles, period = 14) => {
    if (!candles || candles.length < period + 1) return 50;

    // Ambil array closing price
    const closes = candles.map(c => c.close);
    let gains = 0;
    let losses = 0;

    // Hitung rata-rata awal
    for (let i = 1; i <= period; i++) {
        const change = closes[i] - closes[i - 1];
        if (change >= 0) gains += change;
        else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothing Wilder
    for (let i = period + 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        let gain = change >= 0 ? change : 0;
        let loss = change < 0 ? Math.abs(change) : 0;

        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};