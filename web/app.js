// ==============================
// DATI SINTETICI
// ==============================

const instruments = [
  {
    ticker: "CVX",
    name: "Chevron Corp.",
    type: "Commodity/Oil",
    price: 180.87,
    moneyFlow: 0.57,
    liquidity: 0.84,
    volatility: 2.45,
    history: generaStorico(36)
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    type: "Tech",
    price: 182.12,
    moneyFlow: 0.62,
    liquidity: 0.91,
    volatility: 1.88,
    history: generaStorico(36)
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    type: "Tech",
    price: 415.22,
    moneyFlow: 0.59,
    liquidity: 0.89,
    volatility: 1.75,
    history: generaStorico(36)
  },
  {
    ticker: "GLD",
    name: "Gold Trust",
    type: "Commodity/Gold",
    price: 192.44,
    moneyFlow: 0.54,
    liquidity: 0.78,
    volatility: 1.32,
    history: generaStorico(36)
  },
  {
    ticker: "USO",
    name: "United States Oil Fund",
    type: "ETC/Oil",
    price: 72.11,
    moneyFlow: 0.51,
    liquidity: 0.66,
    volatility: 2.12,
    history: generaStorico(36)
  },
  {
    ticker: "SLV",
    name: "Silver Trust",
    type: "ETC/Silver",
    price: 24.88,
    moneyFlow: 0.48,
    liquidity: 0.71,
    volatility: 1.95,
    history: generaStorico(36)
  }
];

// ==============================
// FUNZIONI DI SUPPORTO
// ==============================

function generaStorico(mesi) {
  let arr = [];
  let prezzo = 100 + Math.random() * 50;

  for (let i = 0; i < mesi; i++) {
    prezzo += (Math.random() - 0.5) * 5;
    arr.push(Number(prezzo.toFixed(2)));
  }
  return arr;
}

function moneyFlowToColor(mf) {
  const r = Math.round(255 * (1 - mf));
  const g = Math.round(255 * mf);
  const b = 60;
  return `rgb(${r},${g},${b})`;
}

// ==============================
// HEATMAP
// ==============================

function renderHeatmap() {
  const grid = document.getElementById("heatmap-grid");
  grid.innerHTML = "";

  instruments.forEach(inst => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.background = `linear-gradient(135deg, ${moneyFlowToColor(inst.moneyFlow)} 0%, #05070a 60%)`;

    tile.innerHTML = `
      <div class="ticker">${inst.ticker}</div>
      <div class="flow">Flow: ${(inst.moneyFlow * 100).toFixed(1)}%</div>
    `;

    tile.onclick = () => mostraDettaglio(inst.ticker);
    grid.appendChild(tile);
  });
}

// ==============================
// RICERCA
// ==============================

function initSearch() {
  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");

  input.addEventListener("input", () => {
    const q = input.value.toUpperCase();
    if (!q) {
      results.innerHTML = "";
      return;
    }

    const filtrati = instruments.filter(i => i.ticker.includes(q));

    results.innerHTML = filtrati
      .map(i => `<div class="result" onclick="mostraDettaglio('${i.ticker}')">${i.ticker}</div>`)
      .join("");
  });
}

// ==============================
// DETTAGLIO TITOLO
// ==============================

function mostraDettaglio(ticker) {
  const inst = instruments.find(i => i.ticker === ticker);
  if (!inst) return;

  document.getElementById("heatmap-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";

  document.getElementById("detail-title").innerText = `${inst.ticker} – ${inst.name}`;

  document.getElementById("detail-stats").innerHTML = `
    <p><b>Tipo strumento:</b> ${inst.type}</p>
    <p><b>Prezzo attuale sintetico:</b> ${inst.price}</p>
    <p><b>Flusso domanda/offerta:</b> ${inst.moneyFlow}</p>
    <p><b>Liquidità:</b> ${inst.liquidity}</p>
    <p><b>Storico utilizzato:</b> 3 anni (36 punti)</p>
    <p><b>Volatilità media sintetica:</b> ${inst.volatility}</p>
  `;

  generaGrafico(inst);
  generaPrezziEntrata(inst);
}

// ==============================
// GRAFICO
// ==============================

let chart;

function generaGrafico(inst) {
  const ctx = document.getElementById("chart-canvas").getContext("2d");

  const storico = inst.history;
  const ultimo = storico[storico.length - 1];
  const proiezione = ultimo * (1 + inst.volatility / 100);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [...Array(storico.length).keys(), "Proiezione"],
      datasets: [
        {
          label: "Storico (3 anni)",
          data: [...storico, null],
          borderColor: "#4caf50",
          tension: 0.3
        },
        {
          label: "Proiezione (1 mese)",
          data: [...Array(storico.length).fill(null), proiezione],
          borderColor: "#ffeb3b",
          borderDash: [5, 5],
          tension: 0.3
        }
      ]
    },
    options: { responsive: true }
  });
}

// ==============================
// PREZZI DI ENTRATA
// ==============================

function generaPrezziEntrata(inst) {
  const base = inst.price;

  const entries = [
    { price: base, prob: 78.5 },
    { price: base * 0.95, prob: 77.7 },
    { price: base * 1.05, prob: 77.7 },
    { price: base * 1.01, prob: 78.0 },
    { price: base * 1.03, prob: 77.6 }
  ];

  const tbody = document.querySelector("#entries-table tbody");
  tbody.innerHTML = "";

  entries.forEach((e, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${e.price.toFixed(2)}</td>
      <td>${e.prob}%</td>
    `;
    tbody.appendChild(tr);
  });
}

// ==============================
// NEWS (HOMEPAGE)
// ==============================

async function caricaNews() {
  const newsDiv = document.getElementById("news-list");
  newsDiv.innerHTML = "<p>Caricamento news...</p>";

  try {
    const res = await fetch("https://api.publicapis.org/entries");
    const data = await res.json();

    const news = data.entries.slice(0, 5);

    newsDiv.innerHTML = news
      .map(n => `<div class="news-item"><b>${n.API}</b>: ${n.Description}</div>`)
      .join("");

  } catch (e) {
    newsDiv.innerHTML = "<p>Impossibile caricare le news.</p>";
  }
}

// ==============================
// INIZIALIZZA
// ==============================

document.getElementById("back-btn").onclick = () => {
  document.getElementById("detail-view").style.display = "none";
  document.getElementById("heatmap-view").style.display = "block";
};

renderHeatmap();
initSearch();
caricaNews();
