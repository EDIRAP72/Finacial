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
  }
];

// ==============================
// FUNZIONI DI SUPPORTO
// ==============================

// Genera storico sintetico (36 mesi)
function generaStorico(mesi) {
  let arr = [];
  let prezzo = 100 + Math.random() * 50;

  for (let i = 0; i < mesi; i++) {
    prezzo += (Math.random() - 0.5) * 5;
    arr.push(Number(prezzo.toFixed(2)));
  }
  return arr;
}

// Colore heatmap
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
         
