/* ============================================================
   CORE MODULE — API, CACHING, UTILITIES
   ============================================================ */

/* ===============================
   CONFIG
   =============================== */
export const ALPHA_KEY = "INSERISCI_ALPHA_VANTAGE_KEY";
export const FINNHUB_KEY = "INSERISCI_FINNHUB_KEY";

/* ===============================
   CACHING
   =============================== */
export function cacheSet(key, data) {
    localStorage.setItem(key, JSON.stringify({ data, time: Date.now() }));
}

export function cacheGet(key, maxAge = 60000) {
    const item = JSON.parse(localStorage.getItem(key) || "null");
    if (!item) return null;
    if (Date.now() - item.time > maxAge) return null;
    return item.data;
}

/* ===============================
   API: REAL-TIME PRICE (FINNHUB)
   =============================== */
export async function getRealTimePrice(symbol) {
    const cached = cacheGet("price_" + symbol, 15000);
    if (cached) return cached;

    try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data || !data.c) return null;

        const result = {
            price: data.c,
            volume: data.v,
            change: ((data.c - data.pc) / data.pc * 100).toFixed(2) + "%"
        };

        cacheSet("price_" + symbol, result);
        return result;
    } catch (e) {
        console.error("Errore getRealTimePrice:", e);
        return null;
    }
}

/* ===============================
   API: HISTORICAL SERIES (ALPHA)
   =============================== */
export async function getHistoricalSeries(symbol) {
    const cached = cacheGet("hist_" + symbol, 600000);
    if (cached) return cached;

    try {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data["Time Series (Daily)"]) return null;

        const series = data["Time Series (Daily)"];
        const arr = Object.keys(series).map(date => ({
            time: date,
            value: parseFloat(series[date]["4. close"])
        })).reverse();

        cacheSet("hist_" + symbol, arr);
        return arr;
    } catch (e) {
        console.error("Errore getHistoricalSeries:", e);
        return null;
    }
}

/* ===============================
   API: NEWS SENTIMENT (ALPHA)
   =============================== */
export async function getNewsForSymbol(symbol) {
    try {
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${ALPHA_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.feed) return [];

        return data.feed.slice(0, 5).map(n => ({
            title: n.title,
            source: n.source,
            sentiment: n.overall_sentiment_score
        }));
    } catch (e) {
        console.error("Errore getNewsForSymbol:", e);
        return [];
    }
}

/* ===============================
   API: ORDER BOOK (SIMULATO)
   =============================== */
export async function getOrderBook(symbol) {
    try {
        const q = await getRealTimePrice(symbol);
        const price = q ? q.price : 100;

        const book = { bids: [], asks: [] };

        for (let i = 1; i <= 10; i++) {
            book.bids.push({
                price: (price - i * 0.1).toFixed(2),
                volume: Math.floor(Math.random() * 500 + 100)
            });
            book.asks.push({
                price: (price + i * 0.1).toFixed(2),
                volume: Math.floor(Math.random() * 500 + 100)
            });
        }

        return book;
    } catch (e) {
        console.error("Errore order book:", e);
        return null;
    }
}

/* ===============================
   MATH UTILITIES
   =============================== */
export function pearsonCorrelation(a, b) {
    const n = Math.min(a.length, b.length);
    const A = a.slice(-n);
    const B = b.slice(-n);
    const avgA = A.reduce((x,y)=>x+y,0)/n;
    const avgB = B.reduce((x,y)=>x+y,0)/n;
    let num = 0, denA = 0, denB = 0;
    for (let i = 0; i < n; i++) {
        num += (A[i] - avgA) * (B[i] - avgB);
        denA += (A[i] - avgA)**2;
        denB += (B[i] - avgB)**2;
    }
    return num / Math.sqrt(denA * denB);
}

export function computeMomentum(series) {
    return (series[series.length - 1] - series[0]) / series[0];
}

export function computeVolatility(series) {
    let sum = 0;
    for (let i = 1; i < series.length; i++) {
        const r = (series[i] - series[i-1]) / series[i-1];
        sum += r * r;
    }
    return Math.sqrt(sum / series.length);
}

export function computeRSI(series) {
    let gains = 0, losses = 0;
    for (let i = 1; i < series.length; i++) {
        const diff = series[i] - series[i-1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
}

/* ===============================
   DATE UTILITY
   =============================== */
export function addDays(dateString, days) {
    const d = new Date(dateString);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}
