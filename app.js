/* ============================================================
   FINANCIAL DASHBOARD – VERSIONE COMPLETA
   Tutto generato in JavaScript, HTML solo contenitori.
   ============================================================ */

/* ------------------------------------------------------------
   1. CONFIGURAZIONE GENERALE
   ------------------------------------------------------------ */

// Lista mercati globali (ticker Yahoo Finance)
const GLOBAL_MARKETS = [
    { name: "S&P 500", symbol: "^GSPC" },
    { name: "Nasdaq 100", symbol: "^NDX" },
    { name: "Dow Jones", symbol: "^DJI" },
    { name: "DAX", symbol: "^GDAXI" },
    { name: "FTSE MIB", symbol: "FTSEMIB.MI" },
    { name: "Nikkei 225", symbol: "^N225" },
    { name: "EUR/USD", symbol: "EURUSD=X" },
    { name: "BTC/USD", symbol: "BTC-USD" },
    { name: "Oro", symbol: "GC=F" },
    { name: "Petrolio WTI", symbol: "CL=F" }
];

// Liste per “Top 10” per categoria (esempio)
const TOP10_EQUITY = ["AAPL", "MSFT", "GOOG", "AMZN", "META", "TSLA", "NVDA", "JPM", "XOM", "UNH"];
const TOP10_ETF    = ["SPY", "QQQ", "IWM", "EEM", "HYG", "LQD", "GLD", "SLV", "XLK", "XLF"];
const TOP10_CRYPTO = ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "AVAX-USD", "LINK-USD", "MATIC-USD", "LTC-USD"];
const TOP10_FX     = ["EURUSD=X", "USDJPY=X", "GBPUSD=X", "AUDUSD=X", "USDCAD=X", "USDCHF=X", "EURJPY=X", "EURGBP=X", "EURCHF=X", "GBPJPY=X"];

// Stato globale
let currentTicker = null;
let currentTickerName = null;
let currentNewsCache = [];

// URL base Yahoo Finance (non ufficiale, può cambiare)
const YF_QUOTE_URL   = "https://query1.finance.yahoo.com/v7/finance/quote?symbols=";
const YF_CHART_URL   = "https://query1.finance.yahoo.com/v8/finance/chart/";
const YF_SEARCH_URL  = "https://query1.finance.yahoo.com/v1/finance/search?q=";
const YF_NEWS_URL    = "https://query1.finance.yahoo.com/v1/finance/search?q="; // useremo i risultati con news
const YF_OPTIONS_URL = "https://query1.finance.yahoo.com/v7/finance/options/";

/* ------------------------------------------------------------
   2. UTILITY
   ------------------------------------------------------------ */

// Formatta numeri con separatore
function formatNumber(n) {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return n.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

// Formatta percentuali
function formatPercent(n) {
    if (n === null || n === undefined || isNaN(n)) return "-";
    return n.toFixed(2) + "%";
}

// Media mobile semplice
function simpleMovingAverage(data, period) {
    if (!data || data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
            sum += data[j];
        }
        result.push(sum / period);
    }
    return result;
}

// Sentiment molto semplice basato su parole chiave
function computeSentimentFromNews(newsArray) {
    if (!newsArray || newsArray.length === 0) return 0;

    const positiveWords = ["buy", "upgrade", "beat", "rally", "bull", "strong", "outperform", "positive"];
    const negativeWords = ["sell", "downgrade", "miss", "slump", "bear", "weak", "underperform", "negative"];

    let score = 0;

    newsArray.forEach(n => {
        const text = (n.title || "").toLowerCase();
        positiveWords.forEach(w => { if (text.includes(w)) score += 1; });
        negativeWords.forEach(w => { if (text.includes(w)) score -= 1; });
    });

    // Normalizziamo in un range -100 / +100
    const maxAbs = 20;
    if (score > maxAbs) score = maxAbs;
    if (score < -maxAbs) score = -maxAbs;
    return (score / maxAbs) * 100;
}

/* ------------------------------------------------------------
   3. FETCH DATI REALI DA YAHOO FINANCE
   (Nota: soggetto a CORS / cambi API)
   ------------------------------------------------------------ */

// Fetch quote per una lista di simboli
async function fetchQuotes(symbols) {
    const url = YF_QUOTE_URL + encodeURIComponent(symbols.join(","));
    const res = await fetch(url);
    const data = await res.json();
    return data.quoteResponse?.result || [];
}

// Fetch storico prezzi (es. 6 mesi giornaliero)
async function fetchHistory(ticker) {
    const url = `${YF_CHART_URL}${encodeURIComponent(ticker)}?range=6mo&interval=1d`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return null;
    return {
        timestamps: result.timestamp || [],
        closes: result.indicators?.quote?.[0]?.close || [],
        volumes: result.indicators?.quote?.[0]?.volume || []
    };
}

// Fetch opzioni
async function fetchOptions(ticker) {
    const url = `${YF_OPTIONS_URL}${encodeURIComponent(ticker)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.optionChain?.result?.[0] || null;
}

// Fetch ricerca (per barra di ricerca)
async function fetchSearch(query) {
    const url = `${YF_SEARCH_URL}${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const res = await fetch(url);
    const data = await res.json();
    return data.quotes || [];
}

// Fetch news (usiamo la search con newsCount)
async function fetchNews(query) {
    const url = `${YF_NEWS_URL}${encodeURIComponent(query)}&quotesCount=0&newsCount=10`;
    const res = await fetch(url);
    const data = await res.json();
    // Alcune versioni di questa API includono "news" nell'oggetto
    return data.news || [];
}

/* ------------------------------------------------------------
   4. CALCOLI DERIVATI PER IL TITOLO
   ------------------------------------------------------------ */

// Domanda/offerta (proxy) basata su volume, range e direzione
function computeDemandOfferScore(history) {
    if (!history || history.closes.length < 2) return 0;
    const closes = history.closes;
    const volumes = history.volumes;

    const lastClose = closes[closes.length - 1];
    const prevClose = closes[closes.length - 2];
    const lastVol = volumes[volumes.length - 1] || 0;

    const priceChange = (lastClose - prevClose) / prevClose;
    const avgVol = volumes.reduce((a, b) => a + (b || 0), 0) / volumes.length;

    let score = 0;
    if (priceChange > 0) score += 30;
    if (priceChange < 0) score -= 30;
    if (lastVol > avgVol) score += 20;
    if (lastVol < avgVol) score -= 20;

    // Normalizziamo -100 / +100
    if (score > 100) score = 100;
    if (score < -100) score = -100;
    return score;
}

// Liquidità = ultimo prezzo * volume medio
function computeLiquidity(history) {
    if (!history || history.closes.length === 0) return 0;
    const closes = history.closes;
    const volumes = history.volumes;
    const lastClose = closes[closes.length - 1];
    const avgVol = volumes.reduce((a, b) => a + (b || 0), 0) / volumes.length;
    return lastClose * avgVol;
}

// Swap (proxy) = differenza tra prezzo attuale e media mobile 20
function computeSwapProxy(history) {
    if (!history || history.closes.length < 20) return 0;
    const closes = history.closes;
    const ma20 = simpleMovingAverage(closes, 20);
    const lastClose = closes[closes.length - 1];
    const lastMA = ma20[ma20.length - 1];
    return ((lastClose - lastMA) / lastMA) * 100; // in %
}

// Previsione 1 mese (molto semplice: estensione trend + volatilità)
function computeFutureProjection(history) {
    if (!history || history.closes.length < 10) return [];
    const closes = history.closes;
    const n = closes.length;
    const lastClose = closes[n - 1];
    const prevClose = closes[n - 2];
    const dailyChange = (lastClose - prevClose) / prevClose;

    // volatilità approssimata
    let volSum = 0;
    for (let i = 1; i < n; i++) {
        const r = (closes[i] - closes[i - 1]) / closes[i - 1];
        volSum += Math.abs(r);
    }
    const avgVol = volSum / (n - 1);

    const future = [];
    let price = lastClose;
    const days = 22; // ~1 mese di trading
    for (let i = 0; i < days; i++) {
        // trend + un po' di volatilità
        price = price * (1 + dailyChange * 0.5 + (Math.random() - 0.5) * avgVol * 0.5);
        future.push(price);
    }
    return future;
}

// 5 livelli di acquisto (es. -3%, -5%, -8%, -10%, -15%)
function computeBuyLevels(lastPrice) {
    const levels = [3, 5, 8, 10, 15];
    return levels.map(p => ({
        dropPercent: p,
        price: lastPrice * (1 - p / 100)
    }));
}

/* ------------------------------------------------------------
   5. RENDERING UI – HOME PAGE
   ------------------------------------------------------------ */

async function renderHome() {
    const home = document.getElementById("home-view");
    home.innerHTML = `
        <h1>FINANCIAL DASHBOARD</h1>
        <div class="box">
            <h2>Mercati globali</h2>
            <div id="global-markets"></div>
        </div>

        <div class="box">
            <h2>Notizie di mercato</h2>
            <div id="global-news">Caricamento notizie...</div>
        </div>

        <div class="box">
            <h2>Top 10 strumenti</h2>
            <div id="top10-equity"></div>
            <div id="top10-etf"></div>
            <div id="top10-crypto"></div>
            <div id="top10-fx"></div>
        </div>

        <div class="box">
            <h2>Ricerca titoli</h2>
            <input type="text" id="search-input" placeholder="Cerca per nome o ticker...">
            <div id="search-results"></div>
        </div>
    `;

    // Carica mercati globali
    loadGlobalMarkets();

    // Carica notizie globali
    loadGlobalNews();

    // Carica top10
    loadTop10Lists();

    // Attiva ricerca
    const searchInput = document.getElementById("search-input");
    searchInput.addEventListener("keyup", async (e) => {
        const q = e.target.value.trim();
        if (q.length < 2) {
            document.getElementById("search-results").innerHTML = "";
            return;
        }
        const results = await fetchSearch(q);
        renderSearchResults(results);
    });
}

// Carica e mostra mercati globali
async function loadGlobalMarkets() {
    const container = document.getElementById("global-markets");
    container.innerHTML = "Caricamento...";

    try {
        const symbols = GLOBAL_MARKETS.map(m => m.symbol);
        const quotes = await fetchQuotes(symbols);

        let html = `<table><tr><th>Mercato</th><th>Prezzo</th><th>Var%</th></tr>`;
        GLOBAL_MARKETS.forEach(m => {
            const q = quotes.find(x => x.symbol === m.symbol);
            if (!q) return;
            const price = q.regularMarketPrice;
            const change = q.regularMarketChangePercent;
            const color = change >= 0 ? "green" : "red";
            html += `
                <tr>
                    <td>${m.name}</td>
                    <td>${formatNumber(price)}</td>
                    <td style="color:${color}">${formatPercent(change)}</td>
                </tr>
            `;
        });
        html += `</table>`;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = "Errore nel caricamento dei mercati globali.";
    }
}

// Carica notizie globali
async function loadGlobalNews() {
    const container = document.getElementById("global-news");
    try {
        const news = await fetchNews("global markets");
        currentNewsCache = news;
        if (!news || news.length === 0) {
            container.innerHTML = "Nessuna notizia trovata.";
            return;
        }
        let html = "<ul>";
        news.slice(0, 10).forEach(n => {
            html += `<li><a href="${n.link}" target="_blank">${n.title}</a></li>`;
        });
        html += "</ul>";
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = "Errore nel caricamento delle notizie.";
    }
}

// Carica top10 per categoria (usando quote reali e ordinando per volume)
async function loadTop10Lists() {
    await renderTop10Category("top10-equity", "Azioni", TOP10_EQUITY);
    await renderTop10Category("top10-etf", "ETF", TOP10_ETF);
    await renderTop10Category("top10-crypto", "Crypto", TOP10_CRYPTO);
    await renderTop10Category("top10-fx", "Forex", TOP10_FX);
}

async function renderTop10Category(containerId, label, symbols) {
    const container = document.getElementById(containerId);
    container.innerHTML = `Caricamento ${label}...`;
    try {
        const quotes = await fetchQuotes(symbols);
        // Ordiniamo per volume decrescente
        quotes.sort((a, b) => (b.regularMarketVolume || 0) - (a.regularMarketVolume || 0));
        let html = `<h3>${label}</h3><table><tr><th>Ticker</th><th>Prezzo</th><th>Var%</th><th>Volume</th></tr>`;
        quotes.slice(0, 10).forEach(q => {
            const change = q.regularMarketChangePercent;
            const color = change >= 0 ? "green" : "red";
            html += `
                <tr style="cursor:pointer" onclick="selectTicker('${q.symbol}', '${q.shortName || q.symbol}')">
                    <td>${q.symbol}</td>
                    <td>${formatNumber(q.regularMarketPrice)}</td>
                    <td style="color:${color}">${formatPercent(change)}</td>
                    <td>${formatNumber(q.regularMarketVolume)}</td>
                </tr>
            `;
        });
        html += `</table>`;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `Errore nel caricamento ${label}.`;
    }
}

// Risultati ricerca
function renderSearchResults(results) {
    const container = document.getElementById("search-results");
    if (!results || results.length === 0) {
        container.innerHTML = "Nessun risultato.";
        return;
    }
    let html = "<ul>";
    results.forEach(r => {
        html += `
            <li style="cursor:pointer" onclick="selectTicker('${r.symbol}', '${r.shortname || r.symbol}')">
                ${r.symbol} – ${r.shortname || ""}
            </li>
        `;
    });
    html += "</ul>";
    container.innerHTML = html;
}

/* ------------------------------------------------------------
   6. SELEZIONE TITOLO → PAGINA DETTAGLIO
   ------------------------------------------------------------ */

async function selectTicker(symbol, name) {
    currentTicker = symbol;
    currentTickerName = name || symbol;
    await renderDetailPage();
    showDetail();
}

let mainChart = null;
let optionsChart = null;

// Render pagina dettaglio
async function renderDetailPage() {
    const detail = document.getElementById("detail-view");
    detail.innerHTML = `
        <button onclick="showHome()">← Torna alla Home</button>
        <h2>${currentTickerName} (${currentTicker})</h2>
        <div class="box" id="summary-box">Caricamento dati...</div>
        <div class="box">
            <h3>Grafico storico e previsione 1 mese</h3>
            <canvas id="price-chart"></canvas>
        </div>
        <div class="box">
            <h3>Livelli di acquisto suggeriti</h3>
            <div id="buy-levels"></div>
        </div>
        <div class="box">
            <h3>Opzioni (se disponibili)</h3>
            <canvas id="options-chart"></canvas>
            <div id="options-note"></div>
        </div>
        <div class="box">
            <h3>Notizie sul titolo</h3>
            <div id="ticker-news">Caricamento notizie...</div>
        </div>
        <div class="box">
            <button onclick="renderInvestorsPage()">Vedi investitori e sentimento</button>
        </div>
    `;

    try {
        // Fetch storico
        const history = await fetchHistory(currentTicker);
        if (!history) {
            document.getElementById("summary-box").innerHTML = "Impossibile caricare lo storico del titolo.";
            return;
        }

        // Fetch quote singolo
        const quotes = await fetchQuotes([currentTicker]);
        const q = quotes[0];

        // Fetch news titolo
        const news = await fetchNews(currentTicker);
        currentNewsCache = news;

        // Calcoli derivati
        const demandOffer = computeDemandOfferScore(history);
        const liquidity = computeLiquidity(history);
        const swapProxy = computeSwapProxy(history);
        const sentiment = computeSentimentFromNews(news);
        const future = computeFutureProjection(history);
        const lastClose = history.closes[history.closes.length - 1];
        const buyLevels = computeBuyLevels(lastClose);

        // Riepilogo
        document.getElementById("summary-box").innerHTML = `
            <p><strong>Prezzo attuale:</strong> ${formatNumber(q.regularMarketPrice)}</p>
            <p><strong>Variazione giornaliera:</strong> ${formatPercent(q.regularMarketChangePercent)}</p>
            <p><strong>Domanda/Offerta (proxy):</strong> ${demandOffer.toFixed(1)} / 100</p>
            <p><strong>Liquidità stimata:</strong> ${formatNumber(liquidity)}</p>
            <p><strong>Swap (proxy, vs MA20):</strong> ${swapProxy.toFixed(2)}%</p>
            <p><strong>Sentiment dalle notizie:</strong> ${sentiment.toFixed(1)} / 100</p>
        `;

        // Grafico storico + futuro
        renderPriceChart(history, future);

        // Livelli di acquisto
        let blHtml = "<ul>";
        buyLevels.forEach(l => {
            blHtml += `<li>-${l.dropPercent}% → ${formatNumber(l.price)}</li>`;
        });
        blHtml += "</ul>";
        document.getElementById("buy-levels").innerHTML = blHtml;

        // Opzioni
        await renderOptionsChart(currentTicker);

        // Notizie
        renderTickerNews(news);

    } catch (e) {
        document.getElementById("summary-box").innerHTML = "Errore nel caricamento dei dati del titolo.";
    }
}

// Grafico storico + futuro
function renderPriceChart(history, future) {
    const ctx = document.getElementById("price-chart").getContext("2d");
    if (mainChart) mainChart.destroy();

    const labels = history.timestamps.map(ts => {
        const d = new Date(ts * 1000);
        return d.toLocaleDateString("it-IT");
    });

    const dataActual = history.closes;
    const lastDate = history.timestamps[history.timestamps.length - 1] * 1000;
    const futureLabels = [];
    for (let i = 1; i <= future.length; i++) {
        const d = new Date(lastDate + i * 24 * 60 * 60 * 1000);
        futureLabels.push(d.toLocaleDateString("it-IT"));
    }

    mainChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels.concat(futureLabels),
            datasets: [
                {
                    label: "Prezzo storico",
                    data: dataActual.concat(new Array(future.length).fill(null)),
                    borderColor: "rgba(0, 200, 255, 1)",
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: "Proiezione 1 mese",
                    data: new Array(dataActual.length).fill(null).concat(future),
                    borderColor: "rgba(0, 255, 100, 1)",
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "#fff" } }
            },
            scales: {
                x: { ticks: { color: "#fff" } },
                y: { ticks: { color: "#fff" } }
            }
        }
    });
}

// Grafico opzioni (open interest per strike, se disponibile)
async function renderOptionsChart(ticker) {
    const ctx = document.getElementById("options-chart").getContext("2d");
    const note = document.getElementById("options-note");
    if (optionsChart) optionsChart.destroy();

    try {
        const opt = await fetchOptions(ticker);
        if (!opt || !opt.options || opt.options.length === 0) {
            note.innerHTML = "Nessun dato opzioni disponibile per questo titolo.";
            return;
        }
        const calls = opt.options[0].calls || [];
        if (calls.length === 0) {
            note.innerHTML = "Nessun dato opzioni disponibile per questo titolo.";
            return;
        }

        const strikes = calls.map(c => c.strike);
        const openInterest = calls.map(c => c.openInterest || 0);

        optionsChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: strikes.map(s => s.toFixed(0)),
                datasets: [{
                    label: "Open Interest (Call)",
                    data: openInterest,
                    backgroundColor: "rgba(255, 200, 0, 0.7)"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: "#fff" } }
                },
                scales: {
                    x: { ticks: { color: "#fff" } },
                    y: { ticks: { color: "#fff" } }
                }
            }
        });

        note.innerHTML = "Distribuzione dell'open interest sulle call: indica dove il mercato si concentra.";
    } catch (e) {
        note.innerHTML = "Errore nel caricamento delle opzioni.";
    }
}

// Notizie sul titolo
function renderTickerNews(news) {
    const container = document.getElementById("ticker-news");
    if (!news || news.length === 0) {
        container.innerHTML = "Nessuna notizia trovata.";
        return;
    }
    let html = "<ul>";
    news.forEach(n => {
        html += `<li><a href="${n.link}" target="_blank">${n.title}</a></li>`;
    });
    html += "</ul>";
    container.innerHTML = html;
}

/* ------------------------------------------------------------
   7. PAGINA INVESTITORI
   ------------------------------------------------------------ */

async function renderInvestorsPage() {
    const inv = document.getElementById("investors-view");
    inv.innerHTML = `
        <button onclick="showDetail()">← Torna al titolo</button>
        <h2>Investitori e Sentimento – ${currentTickerName} (${currentTicker})</h2>
        <div class="box" id="investor-summary">Analisi in corso...</div>
        <div class="box">
            <h3>Notizie rilevanti</h3>
            <div id="investor-news"></div>
        </div>
    `;

    showInvestors();

    // Usiamo le news già caricate + altre news mirate
    try {
        const extraNews = await fetchNews(currentTicker + " institutional investor");
        const allNews = (currentNewsCache || []).concat(extraNews || []);

        // Cerchiamo nomi di grandi investitori noti
        const bigNames = ["blackrock", "vanguard", "berkshire", "goldman", "jpmorgan", "fidelity", "pimco", "bridgewater"];
        const found = {};

        allNews.forEach(n => {
            const text = (n.title || "").toLowerCase();
            bigNames.forEach(name => {
                if (text.includes(name)) {
                    if (!found[name]) found[name] = [];
                    found[name].push(n.title);
                }
            });
        });

        let sentiment = computeSentimentFromNews(allNews);

        let summaryHtml = `
            <p><strong>Sentiment complessivo investitori (da news):</strong> ${sentiment.toFixed(1)} / 100</p>
        `;

        if (Object.keys(found).length === 0) {
            summaryHtml += `<p>Nessuna menzione chiara di grandi investitori istituzionali trovata nelle ultime notizie.</p>`;
        } else {
            summaryHtml += `<p><strong>Investitori istituzionali citati nelle notizie:</strong></p><ul>`;
            Object.keys(found).forEach(name => {
                summaryHtml += `<li>${name.toUpperCase()} – ${found[name].length} citazioni</li>`;
            });
            summaryHtml += `</ul>`;
        }

        document.getElementById("investor-summary").innerHTML = summaryHtml;

        // Lista news
        let newsHtml = "<ul>";
        allNews.slice(0, 15).forEach(n => {
            newsHtml += `<li><a href="${n.link}" target="_blank">${n.title}</a></li>`;
        });
        newsHtml += "</ul>";
        document.getElementById("investor-news").innerHTML = newsHtml;

    } catch (e) {
        document.getElementById("investor-summary").innerHTML = "Errore nell'analisi degli investitori.";
        document.getElementById("investor-news").innerHTML = "";
    }
}

/* ------------------------------------------------------------
   8. NAVIGAZIONE DI BASE
   ------------------------------------------------------------ */

function showHome() {
    document.getElementById("home-view").style.display = "block";
    document.getElementById("detail-view").style.display = "none";
    document.getElementById("investors-view").style.display = "none";
}

function showDetail() {
    document.getElementById("home-view").style.display = "none";
    document.getElementById("detail-view").style.display = "block";
    document.getElementById("investors-view").style.display = "none";
}

function showInvestors() {
    document.getElementById("home-view").style.display = "none";
    document.getElementById("detail-view").style.display = "none";
    document.getElementById("investors-view").style.display = "block";
}

/* ------------------------------------------------------------
   9. AVVIO
   ------------------------------------------------------------ */

renderHome();
showHome();
