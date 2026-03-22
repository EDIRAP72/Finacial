/* ============================================================
   UI MODULE — HOMEPAGE + DETTAGLIO + DOM HANDLING
   ============================================================ */

import {
    getRealTimePrice,
    getHistoricalSeries,
    getNewsForSymbol,
    getOrderBook,
    pearsonCorrelation
} from "./core.js";

import {
    computeAdvancedSentiment,
    quantumProjectionV2,
    computeEntryPoints,
    backtestModel,
    fullRiskAnalysis,
    knnPredict
} from "./quant.js";

import {
    prepareProjectedData,
    createChart,
    enableChartResize
} from "./chart.js";

/* ============================================================
   HOMEPAGE
   ============================================================ */

/* -------------------------------
   TICKER MOCK
   ------------------------------- */
const mockTickerData = [
    { symbol: "AAPL", price: 182.12, change: "+1.2%" },
    { symbol: "TSLA", price: 204.55, change: "-0.8%" },
    { symbol: "MSFT", price: 415.30, change: "+0.5%" },
    { symbol: "NVDA", price: 890.10, change: "+2.1%" },
    { symbol: "AMZN", price: 175.40, change: "-0.3%" }
];

export function renderTicker() {
    const ticker = document.getElementById("ticker");
    ticker.innerHTML = mockTickerData
        .map(item => `
            <span style="margin-right: 40px;">
                <strong>${item.symbol}</strong> 
                ${item.price} 
                <span style="color:${item.change.startsWith('+') ? 'lightgreen' : 'red'};">
                    ${item.change}
                </span>
            </span>
        `)
        .join("");
}

/* -------------------------------
   NEWS MOCK
   ------------------------------- */
const mockNews = [
    { title: "Mercati in rialzo dopo i dati sull'inflazione", source: "Reuters" },
    { title: "Tech in forte crescita: Nvidia guida il rally", source: "Bloomberg" },
    { title: "Petrolio in calo, preoccupazioni per la domanda globale", source: "FT" },
    { title: "Bitcoin supera i 70.000$, nuovo record storico", source: "CoinDesk" },
    { title: "Banche europee: trimestre migliore delle attese", source: "CNBC" },
    { title: "L'AI continua a trainare gli investimenti globali", source: "WSJ" }
];

export function renderNews() {
    const grid = document.getElementById("news-grid");
    grid.innerHTML = mockNews
        .map(n => `
            <div class="news-card">
                <h3>${n.title}</h3>
                <p><em>${n.source}</em></p>
            </div>
        `)
        .join("");
}

/* -------------------------------
   HEATMAP
   ------------------------------- */
export async function renderHeatmap() {
    const container = document.getElementById("heatmap");
    container.innerHTML = "";

    const symbols = ["AAPL","MSFT","TSLA","NVDA","AMZN","META","GOOG","NFLX"];

    for (let s of symbols) {
        const data = await getRealTimePrice(s);
        if (!data) continue;

        const change = parseFloat(data.change);
        const color = change > 0 ? "rgba(0,200,0,0.6)" : "rgba(200,0,0,0.6)";

        container.innerHTML += `
            <div class="heatbox" style="background:${color}">
                <strong>${s}</strong><br>
                ${change.toFixed(2)}%
            </div>
        `;
    }
}

/* -------------------------------
   WATCHLIST
   ------------------------------- */
const watchSymbols = ["AAPL","TSLA","MSFT","NVDA","AMZN"];

export async function renderWatchlist(onSelect) {
    const container = document.getElementById("watchlist");
    container.innerHTML = "";

    for (let s of watchSymbols) {
        const data = await getRealTimePrice(s);
        if (!data) continue;

        const box = document.createElement("div");
        box.className = "watchbox";
        box.innerHTML = `
            <strong>${s}</strong><br>
            ${data.price.toFixed(2)}<br>
            <span style="color:${data.change.startsWith('+')?'green':'red'}">${data.change}</span>
        `;
        box.addEventListener("click", () => onSelect(s));
        container.appendChild(box);
    }
}

/* ============================================================
   DETTAGLIO — RENDER
   ============================================================ */

export async function renderDetailPage(symbol) {
    const detail = document.getElementById("detail-page");
    const newsSection = document.getElementById("news-section");
    const searchSection = document.getElementById("search-section");

    newsSection.style.display = "none";
    searchSection.style.display = "none";
    detail.classList.remove("hidden");

    /* -------------------------------
       STRUTTURA BASE DELLA PAGINA
       ------------------------------- */
    detail.innerHTML = `
        <h2>${symbol}</h2>

        <div class="section-block">
            <h3>Order Book</h3>
            <p><strong>Prezzo attuale:</strong> <span id="live-price">Caricamento...</span></p>
            <div style="display:flex; gap:40px;">
                <div><h4>Bid</h4><div id="bid-book">...</div></div>
                <div><h4>Ask</h4><div id="ask-book">...</div></div>
            </div>
        </div>

        <div class="section-block">
            <h3>Grafico + Proiezione</h3>
            <div id="chart-container" style="width:100%; height:400px;"></div>
        </div>

        <div class="section-block">
            <h3>Punti di ingresso</h3>
            <ul id="entry-list"></ul>
        </div>

        <div class="section-block">
            <h3>Sentiment Notizie</h3>
            <div id="news-detail-box">Caricamento...</div>
        </div>

        <div class="section-block">
            <h3>Analisi AI</h3>
            <div id="ai-box">Caricamento...</div>
        </div>

        <div class="section-block">
            <h3>Backtest</h3>
            <div id="backtest-box">Caricamento...</div>
        </div>

        <div class="section-block">
            <h3>Risk Management</h3>
            <div id="risk-box">Caricamento...</div>
        </div>

        <div class="section-block">
            <h3>Previsione ML</h3>
            <div id="ml-box">Caricamento...</div>
        </div>

        <button id="back-btn">Torna alla Home</button>
    `;

    document.getElementById("back-btn").addEventListener("click", () => {
        detail.classList.add("hidden");
        newsSection.style.display = "block";
        searchSection.style.display = "block";
    });

    /* -------------------------------
       CARICAMENTO DATI
       ------------------------------- */
    const [price, news, hist, book] = await Promise.all([
        getRealTimePrice(symbol),
        getNewsForSymbol(symbol),
        getHistoricalSeries(symbol),
        getOrderBook(symbol)
    ]);

    if (!hist) {
        detail.innerHTML = `<h2>${symbol}</h2><p>Dati insufficienti.</p>`;
        return;
    }

    /* -------------------------------
       ORDER BOOK
       ------------------------------- */
    if (price) {
        document.getElementById("live-price").innerHTML = price.price.toFixed(2);
    }

    if (book) {
        document.getElementById("bid-book").innerHTML =
            book.bids.map(b => `<div>${b.price} — Vol: ${b.volume}</div>`).join("");

        document.getElementById("ask-book").innerHTML =
            book.asks.map(a => `<div>${a.price} — Vol: ${a.volume}</div>`).join("");
    }

    /* -------------------------------
       SENTIMENT
       ------------------------------- */
    const sentiment = computeAdvancedSentiment(news);
    document.getElementById("news-detail-box").innerHTML =
        news.length
            ? news.map(n => `
                <div class="news-item">
                    <strong>${n.title}</strong><br>
                    <em>${n.source}</em><br>
                    Sentiment: ${n.sentiment.toFixed(3)}
                </div>
            `).join("")
            : "Nessuna notizia disponibile.";

    /* -------------------------------
       PROIEZIONE
       ------------------------------- */
    const lastPrice = hist[hist.length - 1].value;
    const projection = quantumProjectionV2(lastPrice, price.volume, sentiment, book);
    const projectedData = prepareProjectedData(hist, projection);

    /* -------------------------------
       GRAFICO
       ------------------------------- */
    const chart = createChart("chart-container", hist, projectedData);
    enableChartResize(chart, "chart-container");

    /* -------------------------------
       ENTRY POINTS
       ------------------------------- */
    const entries = computeEntryPoints(lastPrice, projection);
    document.getElementById("entry-list").innerHTML =
        entries.map(e => `<li>${e.price} — Prob: ${e.probability}</li>`).join("");

    /* -------------------------------
       BACKTEST
       ------------------------------- */
    const accuracy = backtestModel(hist, projectedData);
    document.getElementById("backtest-box").innerHTML =
        `Accuratezza stimata: <strong>${accuracy}%</strong>`;

    /* -------------------------------
       RISK
       ------------------------------- */
    const risk = fullRiskAnalysis(hist, lastPrice);
    document.getElementById("risk-box").innerHTML = `
        Volatilità: ${(risk.vol * 100).toFixed(2)}%<br>
        RSI: ${risk.rsi.toFixed(1)}<br>
        VaR 95%: ${(risk.var95 * 100).toFixed(2)}%<br>
        CVaR 95%: ${(risk.cvar95 * 100).toFixed(2)}%<br>
        <strong>Risk Score: ${risk.riskScore}/100</strong>
    `;

    /* -------------------------------
       ML
       ------------------------------- */
    const ml = knnPredict({
        sentiment,
        vol: risk.vol,
        pressure: 0.1
    });

    document.getElementById("ml-box").innerHTML =
        `Direzione prevista: <strong>${ml}</strong>`;
}
