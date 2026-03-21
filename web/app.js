/* ============================================================
   FINANCIAL DASHBOARD – APP.JS
   Tema scuro – Pagina iniziale professionale stile Bloomberg
   Tutto generato via JS – Nessuna modifica a index.html
   ============================================================ */

/* ============================================================
   1. CONFIGURAZIONE
   ============================================================ */

const TICKERS = [
  "AAPL", "MSFT", "AMZN", "GOOG", "META", "TSLA", "NVDA", "INTC",
  "XOM", "CVX", "GLD", "TLT", "HYG", "SPY", "QQQ", "LQD",
  "USO", "SLV", "BND", "EEM"
];

const GLOBAL_MARKETS = [
  { name: "S&P 500", ticker: "^GSPC" },
  { name: "Nasdaq", ticker: "^IXIC" },
  { name: "Dow Jones", ticker: "^DJI" },
  { name: "FTSE MIB", ticker: "FTSEMIB.MI" },
  { name: "DAX", ticker: "^GDAXI" },
  { name: "Nikkei", ticker: "^N225" },
  { name: "EUR/USD", ticker: "EURUSD=X" },
  { name: "BTC/USD", ticker: "BTC-USD" },
  { name: "Oro", ticker: "GC=F" },
  { name: "Petrolio", ticker: "CL=F" }
];

const YF_CHART = t =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=3y&interval=1d`;

const YF_MFI = t =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=1mo&interval=1d`;

const YF_SEARCH = q =>
  `https://query1.finance.yahoo.com/v1/finance/search?q=${q}`;


/* ============================================================
   2. CREAZIONE DELLE PAGINE
   ============================================================ */

document.body.style.background = "#000";
document.body.style.color = "#fff";
document.body.style.fontFamily = "Arial, sans-serif";
document.body.style.margin = "0";
document.body.style.padding = "0";

const homeView = document.createElement("div");
const heatmapView = document.createElement("div");
const detailView = document.createElement("div");

homeView.id = "home-view";
heatmapView.id = "heatmap-view";
detailView.id = "detail-view";

heatmapView.style.display = "none";
detailView.style.display = "none";

document.body.appendChild(homeView);
document.body.appendChild(heatmapView);
document.body.appendChild(detailView);


/* ============================================================
   3. FUNZIONI DI FETCH
   ============================================================ */

async function fetchJSON(url) {
  try {
    const r = await fetch(url);
    return await r.json();
  } catch (e) {
    console.error("Errore fetch:", url, e);
    return null;
  }
}

async function fetchDaily(ticker) {
  const json = await fetchJSON(YF_CHART(ticker));
  if (!json || !json.chart || !json.chart.result) return null;

  const r = json.chart.result[0];
  const t = r.timestamp;
  const q = r.indicators.quote[0];

  return t.map((ts, i) => ({
    time: ts * 1000,
    open: q.open[i],
    high: q.high[i],
    low: q.low[i],
    close: q.close[i],
    volume: q.volume[i]
  }));
}

async function fetchMFIData(ticker) {
  const json = await fetchJSON(YF_MFI(ticker));
  if (!json || !json.chart || !json.chart.result) return null;

  const r = json.chart.result[0];
  const t = r.timestamp;
  const q = r.indicators.quote[0];

  return t.map((ts, i) => ({
    time: ts * 1000,
    high: q.high[i],
    low: q.low[i],
    close: q.close[i],
    volume: q.volume[i]
  }));
}

async function fetchNews(query) {
  const json = await fetchJSON(YF_SEARCH(query));
  if (!json || !json.news) return [];
  return json.news.slice(0, 10);
}


/* ============================================================
   4. CALCOLO MFI
   ============================================================ */

function calcMFI(data) {
  if (!data || data.length < 15) return 50;

  const tp = data.map(d => (d.high + d.low + d.close) / 3);
  const rmf = data.map((d, i) => tp[i] * d.volume);

  let pos = 0, neg = 0;

  for (let i = 1; i < 15; i++) {
    if (tp[i] > tp[i - 1]) pos += rmf[i];
    else neg += rmf[i];
  }

  if (neg === 0) return 100;

  const ratio = pos / neg;
  return Math.max(0, Math.min(100, 100 - 100 / (1 + ratio)));
}


/* ============================================================
   5. PAGINA INIZIALE
   ============================================================ */

async function buildHome() {
  homeView.innerHTML = `
    <div style="padding:20px; text-align:center;">
      <h1 style="font-size:32px; margin-bottom:10px;">FINANCIAL DASHBOARD</h1>
    </div>

    <div id="global-markets" style="padding:20px;"></div>

    <div style="padding:20px;">
      <input id="search-box" placeholder="Cerca uno strumento (AAPL, BTC-USD, EURUSD=X...)"
        style="width:100%; padding:12px; border-radius:6px; border:none; background:#111; color:#fff;">
      <div id="search-results" style="margin-top:10px;"></div>
    </div>

    <div id="news-section" style="padding:20px;"></div>

    <div id="liquidity-section" style="padding:20px;"></div>

    <div id="strength-section" style="padding:20px;"></div>

    <div id="weakness-section" style="padding:20px;"></div>

    <div style="padding:20px; text-align:center;">
      <button id="go-heatmap" style="padding:12px 20px; background:#333; color:#fff; border:none; border-radius:6px;">
        Vai alla Heatmap
      </button>
    </div>
  `;

  document.getElementById("go-heatmap").onclick = showHeatmap;

  buildGlobalMarkets();
  buildNews();
  buildLiquidity();
  buildStrengthWeakness();

  document.getElementById("search-box").oninput = searchInstrument;
}


/* ============================================================
   6. MERCATI GLOBALI
   ============================================================ */

async function buildGlobalMarkets() {
  const container = document.getElementById("global-markets");
  container.innerHTML = "<h2>Mercati Globali</h2>";

  for (const m of GLOBAL_MARKETS) {
    const json = await fetchJSON(YF_CHART(m.ticker));
    if (!json || !json.chart || !json.chart.result) continue;

    const r = json.chart.result[0];
    const close = r.indicators.quote[0].close;
    const last = close[close.length - 1];
    const prev = close[close.length - 2];
    const diff = ((last - prev) / prev) * 100;

    const color = diff >= 0 ? "#0f0" : "#f00";

    container.innerHTML += `
      <div style="margin:6px 0;">
        <strong>${m.name}</strong> – ${last.toFixed(2)}
        <span style="color:${color};">(${diff.toFixed(2)}%)</span>
      </div>
    `;
  }
}


/* ============================================================
   7. NEWS GLOBALI
   ============================================================ */

async function buildNews() {
  const container = document.getElementById("news-section");
  container.innerHTML = "<h2>Ultime Notizie</h2>";

  const news = await fetchNews("markets");

  news.forEach(n => {
    container.innerHTML += `
      <div style="margin-bottom:12px;">
        <a href="${n.link}" target="_blank" style="color:#4da3ff; text-decoration:none;">
          ${n.title}
        </a>
        <div style="font-size:12px; color:#aaa;">${n.publisher}</div>
      </div>
    `;
  });
}


/* ============================================================
   8. STRUMENTI PIÙ LIQUIDI
   ============================================================ */

async function buildLiquidity() {
  const container = document.getElementById("liquidity-section");
  container.innerHTML = "<h2>Strumenti più liquidi</h2>";

  const results = [];

  for (const t of TICKERS) {
    const data = await fetchDaily(t);
    if (!data) continue;

    const last = data[data.length - 1];
    const liquidity = last.close * last.volume;

    results.push({ ticker: t, liquidity });
  }

  results.sort((a, b) => b.liquidity - a.liquidity);

  results.slice(0, 5).forEach(r => {
    container.innerHTML += `
      <div>${r.ticker} – ${r.liquidity.toLocaleString()}</div>
    `;
  });
}


/* ============================================================
   9. STRUMENTI PIÙ FORTI / DEBOLI (MFI)
   ============================================================ */

async function buildStrengthWeakness() {
  const strong = [];
  const weak = [];

  for (const t of TICKERS) {
    const mfiData = await fetchMFIData(t);
    const mfi = calcMFI(mfiData);
    strong.push({ ticker: t, mfi });
    weak.push({ ticker: t, mfi });
  }

  strong.sort((a, b) => b.mfi - a.mfi);
  weak.sort((a, b) => a.mfi - b.mfi);

  const strongDiv = document.getElementById("strength-section");
  const weakDiv = document.getElementById("weakness-section");

  strongDiv.innerHTML = "<h2>Più forti (MFI)</h2>";
  weakDiv.innerHTML = "<h2>Più deboli (MFI)</h2>";

  strong.slice(0, 5).forEach(s => {
    strongDiv.innerHTML += `<div>${s.ticker} – ${s.mfi.toFixed(1)}</div>`;
  });

  weak.slice(0, 5).forEach(s => {
    weakDiv.innerHTML += `<div>${s.ticker} – ${s.mfi.toFixed(1)}</div>`;
  });
}


/* ============================================================
   10. RICERCA STRUMENTI
   ============================================================ */

async function searchInstrument() {
  const q = document.getElementById("search-box").value.trim();
  const container = document.getElementById("search-results");

  if (q.length < 2) {
    container.innerHTML = "";
    return;
  }

  const json = await fetchJSON(YF_SEARCH(q));
  if (!json || !json.quotes) return;

  container.innerHTML = "";

  json.quotes.slice(0, 5).forEach(r => {
    container.innerHTML += `
      <div style="padding:10px; background:#111; margin:6px 0; border-radius:6px;">
        <strong>${r.symbol}</strong> – ${r.shortname || ""}
        <br>
        <button onclick="openDetail('${r.symbol}')" style="margin-top:6px; padding:6px 10px;">Apri</button>
      </div>
    `;
  });
}


/* ============================================================
   11. HEATMAP
   ============================================================ */

async function showHeatmap() {
  homeView.style.display = "none";
  heatmapView.style.display = "block";
  detailView.style.display = "none";

  heatmapView.innerHTML = "<h2 style='padding:20px;'>Heatmap</h2>";

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(4, 1fr)";
  grid.style.gap = "10px";
  grid.style.padding = "20px";

  heatmapView.appendChild(grid);

  const results = [];

  for (const t of TICKERS) {
    const mfiData = await fetchMFIData(t);
    const mfi = calcMFI(mfiData);
    const score = mfi / 100;

    results.push({ ticker: t, mfi, score });
  }

  results.sort((a, b) => b.score - a.score);

  results.forEach(r => {
    const div = document.createElement("div");
    div.style.padding = "20px";
    div.style.borderRadius = "6px";
    div.style.cursor = "pointer";
    div.style.background = `rgba(${255 - r.score * 255}, ${r.score * 255}, 80, 0.8)`;
    div.innerHTML = `<strong>${r.ticker}</strong><br>MFI: ${r.mfi.toFixed(1)}`;
    div.onclick = () => openDetail(r.ticker);
    grid.appendChild(div);
  });
}


/* ============================================================
   12. DETTAGLIO TITOLO
   ============================================================ */

async function openDetail(ticker) {
  homeView.style.display = "none";
  heatmapView.style.display = "none";
  detailView.style.display = "block";

  detailView.innerHTML = `
    <div style="padding:20px;">
      <button onclick="showHeatmap()" style="padding:6px 10px;">Indietro</button>
      <h2>${ticker}</h2>
      <canvas id="chart" height="200"></canvas>
      <div id="detail-news" style="margin-top:20px;"></div>
    </div>
  `;

  const data = await fetchDaily(ticker);
  drawChart(data);

  const news = await fetchNews(ticker);
  const container = document.getElementById("detail-news");
  container.innerHTML = "<h3>Notizie</h3>";

  news.forEach(n => {
    container.innerHTML += `
      <div style="margin-bottom:12px;">
        <a href="${n.link}" target="_blank" style="color:#4da3ff;">${n.title}</a>
        <div style="font-size:12px; color:#aaa;">${n.publisher}</div>
      </div>
    `;
  });
}


/* ============================================================
   13. GRAFICO
   ============================================================ */

function drawChart(data) {
  const ctx = document.getElementById("chart").getContext("2d");

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.time).toLocaleDateString()),
      datasets: [{
        label: "Prezzo",
        data: data.map(d => d.close),
        borderColor: "#4da3ff",
        borderWidth: 2,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: { x: { display: false } }
    }
  });
}


/* ============================================================
   14. AVVIO
   ============================================================ */

buildHome();
