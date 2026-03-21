/* ============================================================
   DASHBOARD FINANZIARIA — APP.JS DEFINITIVO
   TradingView + Backend Interno + Grafici Blu Professionali
   ============================================================ */

/* ------------------------------------------------------------
   1. NAVIGAZIONE TRA LE PAGINE
------------------------------------------------------------ */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.style.display = "none");
  document.getElementById(pageId).style.display = "block";
}

/* Avvio sulla home */
showPage("home-page");


/* ------------------------------------------------------------
   2. CARICAMENTO PAGINA DEL TITOLO
------------------------------------------------------------ */

let currentTicker = "AAPL";

function loadTitlePage(ticker) {
  currentTicker = ticker;
  showPage("title-page");
  loadTradingViewChart(ticker);
}


/* ------------------------------------------------------------
   3. TRADINGVIEW ADVANCED CHART (BACKEND INTERNO)
------------------------------------------------------------ */

function loadTradingViewChart(ticker) {
  document.getElementById("tv_chart").innerHTML = "";

  const widget = new TradingView.widget({
    container_id: "tv_chart",
    symbol: ticker,
    interval: "D",
    theme: "dark",
    style: "1",
    locale: "it",
    autosize: true,
    hide_side_toolbar: false,
    allow_symbol_change: false
  });

  widget.onChartReady(() => {
    widget.chart().dataReady(() => {
      const bars = widget.chart().getBars();
      processTradingViewData(bars);
    });
  });
}


/* ------------------------------------------------------------
   4. BACKEND INTERNO — ESTRAZIONE DATI REALI
------------------------------------------------------------ */

function processTradingViewData(bars) {
  const labels = bars.map(b => new Date(b.time * 1000));
  const prices = bars.map(b => b.close);
  const volumes = bars.map(b => b.volume);

  generateStorico(labels, prices);
  generateFuturo(labels, prices);
  generateLivelli(prices);
  generateVolatilita(prices);
  generateLiquidita(volumes);
  generateSentiment(prices);
  generateOpzioni(); // simulato
}


/* ------------------------------------------------------------
   5. GRAFICI — STILE BLU PROFESSIONALE
------------------------------------------------------------ */

function generateStorico(labels, prices) {
  new Chart(document.getElementById("chartStorico"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Prezzo",
        data: prices,
        borderColor: "#1f78ff",
        backgroundColor: "rgba(31,120,255,0.15)",
        borderWidth: 2,
        tension: 0.2
      }]
    },
    options: { responsive: true }
  });
}

function generateFuturo(labels, prices) {
  const last = prices[prices.length - 1];
  const future = Array.from({ length: 30 }, (_, i) => last * (1 + 0.002 * i));

  new Chart(document.getElementById("chartFuturo"), {
    type: "line",
    data: {
      labels: [...labels, ...Array(30).fill("").map((_, i) => `+${i+1}`)],
      datasets: [{
        label: "Previsione",
        data: [...prices, ...future],
        borderColor: "#1f78ff",
        borderDash: [5, 5],
        borderWidth: 2,
        tension: 0.2
      }]
    },
    options: { responsive: true }
  });
}

function generateLivelli(prices) {
  const max = Math.max(...prices);
  const min = Math.min(...prices);

  new Chart(document.getElementById("chartLivelli"), {
    type: "line",
    data: {
      labels: prices.map((_, i) => i),
      datasets: [
        {
          label: "Prezzo",
          data: prices,
          borderColor: "#1f78ff",
          borderWidth: 2,
          tension: 0.2
        },
        {
          label: "Supporto",
          data: prices.map(() => min),
          borderColor: "#00c853",
          borderWidth: 1,
          borderDash: [5, 5]
        },
        {
          label: "Resistenza",
          data: prices.map(() => max),
          borderColor: "#ff1744",
          borderWidth: 1,
          borderDash: [5, 5]
        }
      ]
    },
    options: { responsive: true }
  });
}

function generateVolatilita(prices) {
  const vol = prices.map((p, i) =>
    i === 0 ? 0 : Math.abs(p - prices[i - 1])
  );

  new Chart(document.getElementById("chartVolatilita"), {
    type: "bar",
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        label: "Volatilità",
        data: vol,
        backgroundColor: "rgba(31,120,255,0.5)"
      }]
    },
    options: { responsive: true }
  });
}

function generateLiquidita(volumes) {
  new Chart(document.getElementById("chartLiquidita"), {
    type: "bar",
    data: {
      labels: volumes.map((_, i) => i),
      datasets: [{
        label: "Volume",
        data: volumes,
        backgroundColor: "rgba(31,120,255,0.5)"
      }]
    },
    options: { responsive: true }
  });
}

function generateSentiment(prices) {
  const sentiment = prices.map((p, i) =>
    i === 0 ? 0 : p > prices[i - 1] ? 1 : -1
  );

  new Chart(document.getElementById("chartSentiment"), {
    type: "line",
    data: {
      labels: prices.map((_, i) => i),
      datasets: [{
        label: "Sentiment",
        data: sentiment,
        borderColor: "#1f78ff",
        borderWidth: 2
      }]
    },
    options: { responsive: true }
  });
}

function generateOpzioni() {
  const strikes = Array.from({ length: 10 }, (_, i) => i * 10 + 100);
  const openInterest = strikes.map(() => Math.floor(Math.random() * 500));

  new Chart(document.getElementById("chartOpzioni"), {
    type: "bar",
    data: {
      labels: strikes,
      datasets: [{
        label: "Open Interest (Simulato)",
        data: openInterest,
        backgroundColor: "rgba(31,120,255,0.5)"
      }]
    },
    options: { responsive: true }
  });
}
