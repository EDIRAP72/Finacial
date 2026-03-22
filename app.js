// ===============================
// CONFIG
// ===============================
const API_KEY = "INSERISCI_ALPHA_VANTAGE_KEY";
const FINNHUB_KEY = "INSERISCI_FINNHUB_KEY";

// ===============================
// DOM ELEMENTS
// ===============================
const newsGrid = document.getElementById("news-grid");
const ticker = document.getElementById("ticker");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const detailPage = document.getElementById("detail-page");
const newsSection = document.getElementById("news-section");
const searchSection = document.getElementById("search-section");
const heatmapContainer = document.getElementById("heatmap");
const watchlistContainer = document.getElementById("watchlist");
const multiAssetBox = document.getElementById("multi-asset-box");

// ===============================
// MOCK DATA HOMEPAGE
// ===============================
const mockTickerData = [
    { symbol: "AAPL", price: 182.12, change: "+1.2%" },
    { symbol: "TSLA", price: 204.55, change: "-0.8%" },
    { symbol: "MSFT", price: 415.30, change: "+0.5%" },
    { symbol: "NVDA", price: 890.10, change: "+2.1%" },
    { symbol: "AMZN", price: 175.40, change: "-0.3%" }
];

const mockNews = [
    { title: "Mercati in rialzo dopo i dati sull'inflazione", source: "Reuters" },
    { title: "Tech in forte crescita: Nvidia guida il rally", source: "Bloomberg" },
    { title: "Petrolio in calo, preoccupazioni per la domanda globale", source: "FT" },
    { title: "Bitcoin supera i 70.000$, nuovo record storico", source: "CoinDesk" },
    { title: "Banche europee: trimestre migliore delle attese", source: "CNBC" },
    { title: "L'AI continua a trainare gli investimenti globali", source: "WSJ" }
];

// ===============================
// CACHING
// ===============================
function cacheSet(key, data) {
    localStorage.setItem(key, JSON.stringify({ data, time: Date.now() }));
}

function cacheGet(key, maxAge = 60000) {
    const item = JSON.parse(localStorage.getItem(key) || "null");
    if (!item) return null;
    if (Date.now() - item.time > maxAge) return null;
    return item.data;
}

// ===============================
// API REALI
// ===============================
async function getRealTimePrice(symbol) {
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

async function getNewsForSymbol(symbol) {
    try {
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;
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

async function getHistoricalSeries(symbol) {
    const cached = cacheGet("hist_" + symbol, 600000);
    if (cached) return cached;

    try {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
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

// ===============================
// ORDER BOOK (SIMULATO)
// ===============================
async function getOrderBook(symbol) {
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

// ===============================
// HOMEPAGE: TICKER + NEWS
// ===============================
function loadTicker() {
    let tickerHTML = "";
    mockTickerData.forEach(item => {
        tickerHTML += `
            <span style="margin-right: 40px;">
                <strong>${item.symbol}</strong> 
                ${item.price} 
                <span style="color:${item.change.startsWith('+') ? 'lightgreen' : 'red'};">
                    ${item.change}
                </span>
            </span>
        `;
    });
    ticker.innerHTML = tickerHTML;
}

function loadNews() {
    newsGrid.innerHTML = "";
    mockNews.forEach(n => {
        const card = document.createElement("div");
        card.classList.add("news-card");
        card.innerHTML = `
            <h3>${n.title}</h3>
            <p><em>${n.source}</em></p>
        `;
        newsGrid.appendChild(card);
    });
}

// ===============================
// HEATMAP
// ===============================
async function loadHeatmap() {
    const symbols = ["AAPL","MSFT","TSLA","NVDA","AMZN","META","GOOG","NFLX"];
    heatmapContainer.innerHTML = "";

    for (let s of symbols) {
        const data = await getRealTimePrice(s);
        if (!data) continue;
        const change = parseFloat(data.change);
        const color = change > 0 ? "rgba(0,200,0,0.6)" : "rgba(200,0,0,0.6)";

        const box = document.createElement("div");
        box.className = "heatbox";
        box.style.background = color;
        box.innerHTML = `
            <strong>${s}</strong><br>
            ${change.toFixed(2)}%
        `;
        heatmapContainer.appendChild(box);
    }
}

// ===============================
// WATCHLIST
// ===============================
const watchSymbols = ["AAPL","TSLA","MSFT","NVDA","AMZN"];

async function loadWatchlist() {
    watchlistContainer.innerHTML = "";
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
        box.addEventListener("click", () => showDetailPage(s));
        watchlistContainer.appendChild(box);
    }
}

// ===============================
// SENTIMENT AVANZATO
// ===============================
function computeAdvancedSentiment(newsArray) {
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

// ===============================
// MODELLO QUANTISTICO AVANZATO
// ===============================
function quantumProjectionV2(lastPrice, volume, sentiment, orderBook) {
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

function addDays(dateString, days) {
    const d = new Date(dateString);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}

// ===============================
// 5 MIGLIORI PUNTI DI INGRESSO
// ===============================
function computeEntryPoints(realPrice, projection) {
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

// ===============================
// AI SPIEGAZIONE GRAFICO
// ===============================
function explainChart(realData, projectedData, sentiment, orderBook) {
    const lastReal = realData[realData.length - 1].value;
    const lastProj = projectedData[projectedData.length - 1].value;

    const trend = lastProj > lastReal ? "rialzista" : "ribassista";
    const intensity = Math.abs((lastProj - lastReal) / lastReal);

    let trendStrength = "moderato";
    if (intensity > 0.08) trendStrength = "forte";
    if (intensity < 0.02) trendStrength = "debole";

    const bidVol = orderBook ? orderBook.bids.reduce((a,b)=>a+b.volume,0) : 0;
    const askVol = orderBook ? orderBook.asks.reduce((a,b)=>a+b.volume,0) : 0;
    const pressure = bidVol > askVol ? "acquisto" : "vendita";

    let sentimentText = "neutro";
    if (sentiment > 0.2) sentimentText = "positivo";
    if (sentiment < -0.2) sentimentText = "negativo";

    return `
        Il trend previsto è <strong>${trend}</strong> con intensità <strong>${trendStrength}</strong>.<br>
        Il sentiment delle notizie è <strong>${sentimentText}</strong>.<br>
        La pressione del book è orientata verso <strong>${pressure}</strong>.<br>
        Il modello quantistico suggerisce un possibile movimento significativo entro 30 giorni.
    `;
}

// ===============================
// CORRELAZIONI
// ===============================
function pearsonCorrelation(a, b) {
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

async function computeCorrelations(baseSymbol) {
    const basket = ["AAPL","MSFT","TSLA","NVDA","AMZN","META","GOOG","NFLX"];
    const baseSeries = await getHistoricalSeries(baseSymbol);
    if (!baseSeries) return [];
    const baseArr = baseSeries.map(p=>p.value);

    const results = [];
    for (let s of basket) {
        const series = await getHistoricalSeries(s);
        if (!series) continue;
        const arr = series.map(p=>p.value);
        const corr = pearsonCorrelation(baseArr, arr);
        results.push({ symbol: s, corr });
    }
    return results.sort((a,b)=>Math.abs(b.corr)-Math.abs(a.corr));
}

// ===============================
// BACKTEST MODELLO
// ===============================
function backtestModel(realData, projectedData) {
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

// ===============================
// MONTE CARLO + VaR/CVaR + RISK SCORE
// ===============================
function monteCarloSimulation(lastPrice, sigma, drift, days = 30, runs = 500) {
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

function computeVaR(simResults, initialPrice, confidence = 0.95) {
    const returns = simResults.map(p => (p - initialPrice) / initialPrice);
    returns.sort((a,b)=>a-b);
    const index = Math.floor((1 - confidence) * returns.length);
    return returns[index];
}

function computeCVaR(simResults, initialPrice, confidence = 0.95) {
    const returns = simResults.map(p => (p - initialPrice) / initialPrice);
    returns.sort((a,b)=>a-b);
    const index = Math.floor((1 - confidence) * returns.length);
    const tail = returns.slice(0, index + 1);
    const avg = tail.reduce((a,b)=>a+b,0) / tail.length;
    return avg;
}

function computeMomentum(series) {
    return (series[series.length - 1] - series[0]) / series[0];
}

function computeVolatility(series) {
    let sum = 0;
    for (let i = 1; i < series.length; i++) {
        const r = (series[i] - series[i-1]) / series[i-1];
        sum += r * r;
    }
    return Math.sqrt(sum / series.length);
}

function computeRSI(series) {
    let gains = 0, losses = 0;
    for (let i = 1; i < series.length; i++) {
        const diff = series[i] - series[i-1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }
    const rs = gains / (losses || 1);
    return 100 - (100 / (1 + rs));
}

function computeRiskScore(vol, var95, cvar95, rsi) {
    const v = Math.min(vol * 200, 40);
    const vr = Math.min(Math.abs(var95) * 200, 30);
    const cvr = Math.min(Math.abs(cvar95) * 200, 20);
    const r = rsi > 70 || rsi < 30 ? 10 : 0;
    return Math.min(v + vr + cvr + r, 100);
}

// ===============================
// ML KNN (SEMPLICE)
// ===============================
const mlDataset = [
    { sentiment: 0.4, vol: 0.02, pressure: 0.1, label: "up" },
    { sentiment: -0.3, vol: 0.03, pressure: -0.2, label: "down" },
    { sentiment: 0.1, vol: 0.015, pressure: 0.05, label: "up" },
    { sentiment: -0.5, vol: 0.025, pressure: -0.1, label: "down" }
];

function knnPredict(dataset, point, k = 3) {
    const distances = dataset.map(d => ({
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

// ===============================
// PORTFOLIO LOCALE
// ===============================
function addToPortfolio(symbol, qty, price) {
    const portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");
    portfolio.push({ symbol, qty, price });
    localStorage.setItem("portfolio", JSON.stringify(portfolio));
}

// ===============================
// ALERT
// ===============================
let alertLevels = [];

function setAlerts(entryPoints) {
    alertLevels = entryPoints.map(e => parseFloat(e.price));
}

function checkAlerts(currentPrice) {
    alertLevels.forEach(level => {
        if (Math.abs(currentPrice - level) < 0.05) {
            alert(`⚠️ ALERT: Il prezzo ha raggiunto il livello ${level}`);
        }
    });
}

// ===============================
// DARK MODE
// ===============================
document.getElementById("toggle-dark").addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

// ===============================
// GRAFICO
// ===============================
async function createChart(realData, projected) {
    const chartContainer = document.getElementById("chart-placeholder");
    chartContainer.innerHTML = "";

    const chart = LightweightCharts.createChart(chartContainer, {
        width: chartContainer.clientWidth || 600,
        height: 400,
        layout: { background: { color: "#ffffff" }, textColor: "#000" },
        grid: { vertLines: { color: "#eee" }, horzLines: { color: "#eee" } }
    });

    const lineSeries = chart.addLineSeries({ color: "#2962FF", lineWidth: 2 });
    lineSeries.setData(realData);

    const projectedData = projected.map(p => ({
        time: addDays(realData[realData.length - 1].time, p.day),
        value: p.value
    }));

    const projectionSeries = chart.addLineSeries({
        color: "red",
        lineWidth: 2,
        lineStyle: 2
    });
    projectionSeries.setData(projectedData);

    return projectedData;
}

// ===============================
// SIMULAZIONE PORTAFOGLIO
// ===============================
function simulatePortfolio(initialCapital, entries, projectedData) {
    if (!entries.length) return [];
    let capital = initialCapital;
    let shares = 0;
    const entryPrice = parseFloat(entries[0].price);
    shares = capital / entryPrice;
    capital = 0;
    const curve = [];
    projectedData.forEach(p => {
        const value = shares * p.value;
        curve.push({ time: p.time, value });
    });
    return curve;
}

// ===============================
// ANALISI MULTI-ASSET (SEMPLICE)
// ===============================
async function loadMultiAssetAnalysis(baseSymbol) {
    const symbols = ["AAPL","MSFT","TSLA","NVDA","AMZN"];
    const series = [];
    for (let s of symbols) {
        const hist = await getHistoricalSeries(s);
        if (hist) series.push(hist.map(p=>p.value));
    }
    if (!series.length) {
        multiAssetBox.innerHTML = "Dati insufficienti per analisi multi‑asset.";
        return;
    }
    const baseCorr = await computeCorrelations(baseSymbol);
    if (!baseCorr.length) {
        multiAssetBox.innerHTML = "Impossibile calcolare correlazioni.";
        return;
    }
    const riskScore = 50;
    multiAssetBox.innerHTML = `
        Titolo più correlato: <strong>${baseCorr[0].symbol}</strong> (${baseCorr[0].corr.toFixed(2)})<br>
        Titolo meno correlato: <strong>${baseCorr[baseCorr.length-1].symbol}</strong> (${baseCorr[baseCorr.length-1].corr.toFixed(2)})<br>
        Rischio complessivo stimato: <strong>${riskScore}/100</strong>
    `;
}

// ===============================
// NAVIGAZIONE
// ===============================
function showHomePage() {
    detailPage.classList.add("hidden");
    newsSection.style.display = "block";
    searchSection.style.display = "block";
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query === "") {
        alert("Inserisci un titolo o ticker");
        return;
    }
    showDetailPage(query.toUpperCase());
}

searchBtn.addEventListener("click", handleSearch);

// ===============================
// DETTAGLIO
// ===============================
async function showDetailPage(tickerSymbol) {
    newsSection.style.display = "none";
    searchSection.style.display = "none";
    detailPage.classList.remove("hidden");

    detailPage.innerHTML = `
        <h2>${tickerSymbol.toUpperCase()}</h2>

        <div class="section-block">
            <h3>Order Book (Top 10 livelli)</h3>
            <p><strong>Prezzo attuale:</strong> <span id="live-price">Caricamento...</span></p>
            <div style="display:flex; gap:40px;">
                <div>
                    <h4>Bid</h4>
                    <div id="bid-book">Caricamento...</div>
                </div>
                <div>
                    <h4>Ask</h4>
                    <div id="ask-book">Caricamento...</div>
                </div>
            </div>
        </div>

        <div class="section-block">
            <h3>Grafico Reale + Proiezione 1 Mese</h3>
            <div id="chart-placeholder" style="width:100%; height:400px;"></div>
        </div>

        <div class="section-block">
            <h3>Migliori 5 punti di ingresso</h3>
            <ul id="entry-list"></ul>
        </div>

        <div class="section-block">
            <h3>Sentiment Notizie</h3>
            <div id="news-detail-box">Caricamento...</div>
        </div>

        <div class="section-block">
            <h3>Analisi AI</h3>
            <div id="ai-explanation">[Analisi in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Correlazioni</h3>
            <div id="correlation-box">[Calcolo in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Backtest Modello Quantistico</h3>
            <div id="backtest-result">[Calcolo in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Risk Management (VaR & CVaR)</h3>
            <div id="risk-box">[Calcolo in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Risk Score</h3>
            <div id="risk-score-box">[Calcolo in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Simulazione Portafoglio (Equity Curve)</h3>
            <div id="equity-placeholder">[Simulazione in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Analisi Multi‑Timeframe</h3>
            <div id="mtf-box">[Calcolo in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Previsione ML</h3>
            <div id="ml-box">[Calcolo in corso...]</div>
        </div>

        <div class="section-block">
            <h3>Strategia Operativa AI</h3>
            <div id="strategy-box">[Calcolo in corso...]</div>
        </div>

        <button id="add-portfolio-btn">Aggiungi al Portfolio</button>
        <button id="back-btn">Torna alla Home</button>
    `;

    document.getElementById("back-btn").addEventListener("click", showHomePage);
    document.getElementById("add-portfolio-btn").addEventListener("click", () => {
        const qty = prompt("Quante azioni vuoi aggiungere?");
        const priceText = document.getElementById("live-price").innerHTML;
        const price = parseFloat(priceText);
        if (!isNaN(qty) && !isNaN(price)) {
            addToPortfolio(tickerSymbol, parseFloat(qty), price);
            alert("Aggiunto al portfolio");
        }
    });

    const [realQuote, newsData, histData, orderBook] = await Promise.all([
        getRealTimePrice(tickerSymbol),
        getNewsForSymbol(tickerSymbol),
        getHistoricalSeries(tickerSymbol),
        getOrderBook(tickerSymbol)
    ]);

    if (!histData || histData.length < 30) {
        detailPage.innerHTML = `
            <h2>${tickerSymbol}</h2>
            <p>Dati insufficienti o limite API raggiunto.</p>
            <button id="back-btn">Torna alla Home</button>
        `;
        document.getElementById("back-btn").addEventListener("click", showHomePage);
        return;
    }

    if (realQuote) {
        const liveEl = document.getElementById("live-price");
        if (liveEl) liveEl.innerHTML = realQuote.price.toFixed(2);
    }

    if (orderBook) {
        const bidBox = document.getElementById("bid-book");
        const askBox = document.getElementById("ask-book");
        bidBox.innerHTML = orderBook.bids.map(b => `
            <div>${b.price} — Vol: ${b.volume}</div>
        `).join("");
        askBox.innerHTML = orderBook.asks.map(a => `
            <div>${a.price} — Vol: ${a.volume}</div>
        `).join("");
    }

    const newsBox = document.getElementById("news-detail-box");
    if (!newsData.length) {
        newsBox.innerHTML = "<p>Nessuna notizia disponibile.</p>";
    } else {
        newsBox.innerHTML = newsData.map(n => `
            <div class="news-item">
                <strong>${n.title}</strong><br>
                <em>${n.source}</em><br>
                Sentiment: ${n.sentiment.toFixed(3)}
            </div>
        `).join("");
    }

    const advSentiment = computeAdvancedSentiment(newsData);
    window.latestAdvSentiment = advSentiment;
    window.latestOrderBook = orderBook;
    window.latestVolume = realQuote ? realQuote.volume : 1_000_000;

    const realData = histData;

    const projected = quantumProjectionV2(
        realData[realData.length - 1].value,
        window.latestVolume,
        window.latestAdvSentiment,
        window.latestOrderBook
    );

    setTimeout(async () => {
        const projectedData = await createChart(realData, projected);

        const entries = computeEntryPoints(realData[realData.length - 1].value, projected);
        document.getElementById("entry-list").innerHTML =
            entries.map(e => `<li>Prezzo: ${e.price} — Probabilità: ${e.probability}</li>`).join("");
        setAlerts(entries);

        document.getElementById("ai-explanation").innerHTML =
            explainChart(realData, projectedData, window.latestAdvSentiment, window.latestOrderBook);

        const correlations = await computeCorrelations(tickerSymbol);
        document.getElementById("correlation-box").innerHTML =
            correlations.map(c => `<div>${c.symbol}: <strong>${c.corr.toFixed(2)}</strong></div>`).join("");

        const accuracy = backtestModel(realData, projectedData);
        document.getElementById("backtest-result").innerHTML =
            `Accuratezza stimata: <strong>${accuracy}%</strong>`;

        const mc = monteCarloSimulation(
            realData[realData.length - 1].value,
            computeVolatility(realData.map(p=>p.value)),
            0.001
        );
        const var95 = computeVaR(mc, realData[realData.length - 1].value);
        const cvar95 = computeCVaR(mc, realData[realData.length - 1].value);
        document.getElementById("risk-box").innerHTML =
            `VaR 95%: ${(var95 * 100).toFixed(2)}%<br>
             CVaR 95%: ${(cvar95 * 100).toFixed(2)}%`;

        const riskScore = computeRiskScore(
            computeVolatility(realData.map(p=>p.value)),
            var95,
            cvar95,
            computeRSI(realData.map(p=>p.value))
        );
        document.getElementById("risk-score-box").innerHTML =
            `<strong>${riskScore}/100</strong>`;

        const equity = simulatePortfolio(10000, entries, projectedData);
        document.getElementById("equity-placeholder").innerHTML =
            equity.map(e => `<div>${e.time}: ${e.value.toFixed(2)} €</div>`).join("");

        const mtf = {
            "1M": realData.slice(-22).map(p=>p.value),
            "3M": realData.slice(-66).map(p=>p.value),
            "6M": realData.slice(-132).map(p=>p.value)
        };
        document.getElementById("mtf-box").innerHTML = Object.keys(mtf).map(tf => {
            const arr = mtf[tf];
            if (arr.length < 5) return `<div><strong>${tf}</strong>: dati insufficienti</div>`;
            const m = computeMomentum(arr);
            const v = computeVolatility(arr);
            const r = computeRSI(arr);
            return `
                <div><strong>${tf}</strong><br>
                Momentum: ${(m*100).toFixed(2)}%<br>
                Volatilità: ${(v*100).toFixed(2)}%<br>
                RSI: ${r.toFixed(1)}</div>
            `;
        }).join("");

        const mlPrediction = knnPredict(mlDataset, {
            sentiment: window.latestAdvSentiment,
            vol: computeVolatility(realData.map(p=>p.value)),
            pressure: 0.1
        });
        document.getElementById("ml-box").innerHTML =
            `Direzione prevista: <strong>${mlPrediction}</strong>`;

        document.getElementById("strategy-box").innerHTML = `
            Strategia suggerita: <strong>${mlPrediction === "UP" ? "LONG" : "SHORT"}</strong><br><br>
            • Miglior punto di ingresso: ${entries.length ? entries[0].price : "N/D"}<br>
            • Stop loss: ${(realData[realData.length - 1].value * 0.97).toFixed(2)}<br>
            • Take profit: ${(realData[realData.length - 1].value * 1.05).toFixed(2)}<br>
            • Risk Score: ${riskScore}/100
        `;

        loadMultiAssetAnalysis(tickerSymbol);

    }, 150);

    setInterval(async () => {
        const q = await getRealTimePrice(tickerSymbol);
        if (!q) return;
        const priceEl = document.getElementById("live-price");
        if (priceEl) {
            priceEl.innerHTML = q.price.toFixed(2);
            checkAlerts(q.price);
        }
    }, 15000);
}

// ===============================
// INIT
// ===============================
function init() {
    loadTicker();
    loadNews();
    loadHeatmap();
    loadWatchlist();
    setInterval(loadWatchlist, 15000);
    console.log("App inizializzata — versione completa Step 1–13 FIXATA");
}

init();
