/* ============================================================
   QUANT MODULE — MODELLO, RISK, ML
   ============================================================ */

import {
    computeVolatility,
    computeRSI
} from "./core.js";

/* ===============================
   SENTIMENT AVANZATO
   =============================== */
export function computeAdvancedSentiment(newsArray) {
    if (!newsArray || newsArray.length === 0) return 0;
    let weighted = 0;
    let totalWeight = 0;
    newsArray.forEach(n => {
        const score = n.sentiment;
        const weight = Math.abs(score) + 0.5;
        weighted += score * weight;
        totalWeight += weight;
    });
    return weighted / totalWeight;
}

/* ===============================
   MODELLO QUANTISTICO V2
   =============================== */
export function quantumProjectionV2(lastPrice, volume, sentiment, orderBook) {
    const baseVol = 0.012;
    const volFactor = Math.min(volume / 4_000_000, 2);
    const sigma = baseVol * volFactor;
    const drift = sentiment * 0.003;

    let bidPressure = 0;
    let askPressure = 0;
    if (orderBook) {
        bidPressure = orderBook.bids.reduce((a,b)=>a+b.volume,0);
        askPressure = orderBook.asks.reduce((a,b)=>a+b.volume,0);
    }
    const pressure = (bidPressure - askPressure) / (bidPressure + askPressure + 1);
    const pressureFactor = pressure * 0.002;

    const projected = [];
    let price = lastPrice;

    for (let i = 1; i <= 30; i++) {
        const gaussian = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        const shock = sigma * gaussian;
        price = price * (1 + drift + shock + pressureFactor);
        projected.push({ day: i, value: price });
    }
    return projected;
}

/* ===============================
   ENTRY POINTS (5 MIGLIORI)
   =============================== */
export function computeEntryPoints(realPrice, projection) {
    const minima = [];
    for (let i = 1; i < projection.length - 1; i++) {
        if (projection[i].value < projection[i-1].value &&
            projection[i].value < projection[i+1].value) {
            minima.push(projection[i]);
        }
    }
    minima.sort((a,b) => a.value - b.value);
    const top5 = minima.slice(0, 5);
    return top5.map((m, idx) => ({
        price: m.value.toFixed(2),
        probability: (80 - idx * 10) + "%"
    }));
}

/* ===============================
   MONTE CARLO
   =============================== */
export function monteCarloSimulation(lastPrice, sigma, drift, days = 30, runs = 500) {
    const results = [];
    for (let r = 0; r < runs; r++) {
        let price = lastPrice;
        for (let d = 0; d < days; d++) {
            const shock = sigma * (Math.random() - 0.5);
            price = price * (1 + drift + shock);
        }
        results.push(price);
    }
    return results;
}

/* ===============================
   VaR / CVaR
   =============================== */
export function computeVaR(simResults, initialPrice, confidence = 0.95) {
    const returns = simResults.map(p => (p - initialPrice) / initialPrice);
    returns.sort((a,b)=>a-b);
    const index = Math.floor((1 - confidence) * returns.length);
    return returns[index];
}

export function computeCVaR(simResults, initialPrice, confidence = 0.95) {
    const returns = simResults.map(p => (p - initialPrice) / initialPrice);
    returns.sort((a,b)=>a-b);
    const index = Math.floor((1 - confidence) * returns.length);
    const tail = returns.slice(0, index + 1);
    const avg = tail.reduce((a,b)=>a+b,0) / tail.length;
    return avg;
}

/* ===============================
   RISK SCORE
   =============================== */
export function computeRiskScore(vol, var95, cvar95, rsi) {
    const v = Math.min(vol * 200, 40);
    const vr = Math.min(Math.abs(var95) * 200, 30);
    const cvr = Math.min(Math.abs(cvar95) * 200, 20);
    const r = rsi > 70 || rsi < 30 ? 10 : 0;
    return Math.min(v + vr + cvr + r, 100);
}

/* ===============================
   BACKTEST SEMPLICE
   =============================== */
export function backtestModel(realData, projectedData) {
    const last30Real = realData.slice(-30).map(p => p.value);
    const last30Proj = projectedData.slice(0, 30).map(p => p.value);
    if (!last30Real.length || !last30Proj.length) return "N/D";
    let error = 0;
    for (let i = 0; i < last30Real.length; i++) {
        error += Math.abs(last30Real[i] - last30Proj[i]);
    }
    const mae = error / last30Real.length;
    const accuracy = Math.max(0, 100 - mae * 2);
    return accuracy.toFixed(1);
}

/* ===============================
   ML KNN
   =============================== */
const mlDataset = [
    { sentiment: 0.4, vol: 0.02, pressure: 0.1, label: "up" },
    { sentiment: -0.3, vol: 0.03, pressure: -0.2, label: "down" },
    { sentiment: 0.1, vol: 0.015, pressure: 0.05, label: "up" },
    { sentiment: -0.5, vol: 0.025, pressure: -0.1, label: "down" }
];

export function knnPredict(point, k = 3) {
    const distances = mlDataset.map(d => ({
        label: d.label,
        dist: Math.sqrt(
            (d.sentiment - point.sentiment)**2 +
            (d.vol - point.vol)**2 +
            (d.pressure - point.pressure)**2
        )
    }));
    distances.sort((a,b)=>a.dist-b.dist);
    const topK = distances.slice(0, k);
    const votes = topK.reduce((acc, cur) => {
        acc[cur.label] = (acc[cur.label] || 0) + 1;
        return acc;
    }, {});
    return (votes.up || 0) > (votes.down || 0) ? "UP" : "DOWN";
}

/* ===============================
   WRAPPER RISK COMPLETO
   =============================== */
export function fullRiskAnalysis(realData, lastPrice) {
    const series = realData.map(p=>p.value);
    const vol = computeVolatility(series);
    const rsi = computeRSI(series);
    const mc = monteCarloSimulation(lastPrice, vol, 0.001);
    const var95 = computeVaR(mc, lastPrice);
    const cvar95 = computeCVaR(mc, lastPrice);
    const riskScore = computeRiskScore(vol, var95, cvar95, rsi);

    return {
        vol,
        rsi,
        var95,
        cvar95,
        riskScore
    };
}
