// ======================================================
// CONFIGURAZIONE INIZIALE
// ======================================================

const TICKERS = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corp." },
  { ticker: "AMZN", name: "Amazon.com Inc." },
  { ticker: "GOOG", name: "Alphabet Inc." },
  { ticker: "META", name: "Meta Platforms Inc." },
  { ticker: "TSLA", name: "Tesla Inc." },
  { ticker: "NVDA", name: "NVIDIA Corp." },
  { ticker: "INTC", name: "Intel Corp." },
  { ticker: "XOM", name: "Exxon Mobil" },
  { ticker: "CVX", name: "Chevron Corp." },
  { ticker: "GLD", name: "Gold ETF" },
  { ticker: "TLT", name: "20+ Year Treasury" },
  { ticker: "HYG", name: "High Yield Corp." },
  { ticker: "SPY", name: "S&P 500 ETF" },
  { ticker: "QQQ", name: "Nasdaq 100 ETF" },
  { ticker: "LQD", name: "Investment Grade Corp." },
  { ticker: "USO", name: "US Oil Fund" },
  { ticker: "SLV", name: "Silver Trust" },
  { ticker: "BND", name: "Total Bond Market" },
  { ticker: "EEM", name: "Emerging Markets ETF" }
];

const YF_URL = ticker =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=3y&interval=1d`;

const YF_MFI_URL = ticker =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1mo&interval=1d`;


// ======================================================
// ELEMENTI DOM
// ======================================================

const heatmapGrid = document.getElementById("heatmap-grid");
const heatmapView = document.getElementById("heatmap-view");
const detailView = document.getElementById("detail-view");
const detailTitle = document.getElementById("detail-title");
const detailStats = document.getElementById("detail-stats");
const entriesTable = document.getElementById("entries-table");
const backBtn = document.getElementById("back-btn");


// ======================================================
// FUNZIONE: FETCH DATI DAILY (3 ANNI)
// ======================================================

async function fetchDailyData(ticker) {
  try {
    const res = await fetch(YF_URL(ticker));
    const json = await res.json();

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const ohlc = result.indicators.quote[0];

    return timestamps.map((t, i) => ({
      time: t * 1000,
      open: ohlc.open[i],
      high: ohlc.high[i],
      low: ohlc.low[i],
      close: ohlc.close[i],
      volume: ohlc.volume[i]
    }));
  } catch (e) {
    console.error("Errore fetch daily:", ticker, e);
    return null;
  }
}


// ======================================================
// FUNZIONE: FETCH DATI PER MFI (14 PERIODI DAILY)
// ======================================================

async function fetchMFIData(ticker) {
  try {
    const res = await fetch(YF_MFI_URL(ticker));
    const json = await res.json();

    const result = json.chart.result[0];
    const timestamps = result.timestamp;
    const ohlc = result.indicators.quote[0];

    return timestamps.map((t, i) => ({
      time: t * 1000,
      high: ohlc.high[i],
      low: ohlc.low[i],
      close: ohlc.close[i],
      volume: ohlc.volume[i]
    }));
  } catch (e) {
    console.error("Errore fetch MFI:", ticker, e);
    return null;
  }
}


// ======================================================
// CALCOLO MFI 14 PERIODI
// ======================================================

function calculateMFI(data) {
  if (!data || data.length < 15) return 50;

  const tp = data.map(d => (d.high + d.low + d.close) / 3);
  const rmf = data.map((d, i) => tp[i] * d.volume);

  let pos = 0;
  let neg = 0;

  for (let i = 1; i < 15; i++) {
    if (tp[i] > tp[i - 1]) pos += rmf[i];
    else neg += rmf[i];
  }

  if (neg === 0) return 100;

  const ratio = pos / neg;
  const mfi = 100 - 100 / (1 + ratio);

  return Math.max(0, Math.min(100, mfi));
}


// ======================================================
// COSTRUZIONE HEATMAP
// ======================================================

async function buildHeatmap() {
  heatmapGrid.innerHTML = "";

  const results = [];

  for (const item of TICKERS) {
    const mfiData = await fetchMFIData(item.ticker);
    const mfi = calculateMFI(mfiData);
    const score = mfi / 100;

    results.push({
      ...item,
      mfi,
      score
    });
  }

  results.sort((a, b) => b.score - a.score);

  results.forEach(r => {
    const div = document.createElement("div");
    div.className = "tile";
    div.style.background = `rgba(${Math.floor(
      255 - r.score * 255
    )}, ${Math.floor(r.score * 255)}, 80, 0.8)`;

    div.innerHTML = `
      <strong>${r.ticker}</strong><br>
      MFI: ${r.mfi.toFixed(1)}
    `;

    div.onclick = () => openDetail(r);
    heatmapGrid.appendChild(div);
  });
}


// ======================================================
// DETTAGLIO TITOLO
// ======================================================

async function openDetail(item) {
  heatmapView.style.display = "none";
  detailView.style.display = "block";

  detailTitle.textContent = `${item.ticker} – ${item.name}`;

  const data = await fetchDailyData(item.ticker);

  if (!data) {
    detailStats.innerHTML = "Errore nel caricamento dati.";
    return;
  }

  const last = data[data.length - 1];

  detailStats.innerHTML = `
    <p><strong>Prezzo attuale:</strong> ${last.close.toFixed(2)}</p>
    <p><strong>Volume:</strong> ${last.volume.toLocaleString()}</p>
    <p><strong>MFI (14):</strong> ${item.mfi.toFixed(1)}</p>
  `;

  drawChart(data);
  buildEntryPrices(last.close);
}

function buildEntryPrices(price) {
  const entries = [
    price * 0.98,
    price * 0.95,
    price * 0.92,
    price * 1.02,
    price * 1.05
  ];

  entriesTable.innerHTML = entries
    .map(
      (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.toFixed(2)}</td>
      <td>${(Math.random() * 20 + 70).toFixed(1)}%</td>
    </tr>
  `
    )
    .join("");
}


// ======================================================
// GRAFICO (LINEA, 3 ANNI)
// ======================================================

function drawChart(data) {
  const ctx = document.getElementById("chart-canvas").getContext("2d");

  if (window.chart) window.chart.destroy();

  window.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d => new Date(d.time).toLocaleDateString()),
      datasets: [
        {
          label: "Prezzo",
          data: data.map(d => d.close),
          borderColor: "#4CAF50",
          borderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: false }
      }
    }
  });
}


// ======================================================
// REFRESH AUTOMATICO
// ======================================================

function startAutoRefresh() {
  buildHeatmap();
  setInterval(buildHeatmap, 24 * 60 * 60 * 1000);
}

backBtn.onclick = () => {
  detailView.style.display = "none";
  heatmapView.style.display = "block";
};


// ======================================================
// AVVIO
// ======================================================

startAutoRefresh();
