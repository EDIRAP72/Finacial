/* =========================
   NAVIGAZIONE SEMPLICE
========================= */

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) page.classList.add("active");
}

/* =========================
   UTILITÀ RANDOM
========================= */

function randomInRange(min, max) {
    return min + Math.random() * (max - min);
}

function roundTo(value, decimals) {
    const f = Math.pow(10, decimals);
    return Math.round(value * f) / f;
}

/* =========================
   LOGICA "QUANTISTICA" SIMULATA
   (BASE PER MODELLI PIÙ COMPLESSI)
========================= */

function generateMarketSnapshot(symbol) {
    // Prezzo base simulato in funzione del simbolo (per avere coerenza)
    const base = Math.abs(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
    const price = roundTo(base / randomInRange(5, 15), 2);

    const spread = roundTo(price * randomInRange(0.0005, 0.003), 2);
    const bid = roundTo(price - spread / 2, 2);
    const ask = roundTo(price + spread / 2, 2);

    const volume = Math.floor(randomInRange(100000, 5000000));

    return { price, bid, ask, volume };
}

function generateEntryLevels(price) {
    // Logica "quantistica" semplificata:
    // applichiamo 5 scenari di volatilità e drift
    const levels = [];
    const vol = randomInRange(0.02, 0.08); // volatilità mensile simulata
    const drift = randomInRange(-0.01, 0.03); // drift medio

    for (let i = 1; i <= 5; i++) {
        const factor = drift + (vol * (i - 3) / 3); // distribuzione intorno al prezzo
        const levelPrice = roundTo(price * (1 + factor), 2);
        levels.push({
            label: `Ingresso ${i}`,
            price: levelPrice,
            note: factor >= 0 ? "scenario rialzista" : "scenario difensivo"
        });
    }

    return levels;
}

/* =========================
   GRAFICO TRADINGVIEW
========================= */

function loadChart(symbol) {
    const container = document.getElementById("chart-container");
    if (!container) return;

    container.innerHTML = `
        <iframe class="main-chart-iframe"
            src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(symbol)}&interval=60&theme=dark&style=1&hide_top_toolbar=0&hide_legend=1&save_image=0&hide_volume=0&studies=[]"
        ></iframe>
    `;
}

/* =========================
   NOTIZIE PLACEHOLDER
========================= */

function loadFakeNews() {
    const news = [
        {
            title: "Mercati in attesa dei dati macro",
            source: "Quantum Wire"
        },
        {
            title: "Volatilità implicita in aumento sui principali indici",
            source: "VolSurface Lab"
        },
        {
            title: "Flussi in ingresso su ETF obbligazionari",
            source: "Flow Monitor"
        }
    ];

    const container = document.getElementById("news-container");
    if (!container) return;

    container.innerHTML = "";
    news.forEach(n => {
        const div = document.createElement("div");
        div.className = "news-item";
        div.innerHTML = `
            <div class="news-item-title">${n.title}</div>
            <div class="news-item-source">${n.source}</div>
        `;
        container.appendChild(div);
    });
}

/* =========================
   GESTIONE RICERCA
========================= */

function handleSearch(symbolRaw) {
    const symbol = symbolRaw.trim().toUpperCase();
    if (!symbol) return;

    // Aggiorna titolo pagina
    const assetName = document.getElementById("asset-name");
    if (assetName) assetName.textContent = symbol;

    // Genera dati simulati
    const snapshot = generateMarketSnapshot(symbol);
    document.getElementById("price-now").textContent = snapshot.price;
    document.getElementById("bid-price").textContent = snapshot.bid;
    document.getElementById("ask-price").textContent = snapshot.ask;
    document.getElementById("volume").textContent = snapshot.volume.toLocaleString("it-IT");

    // Genera livelli di ingresso
    const levels = generateEntryLevels(snapshot.price);
    const list = document.getElementById("entry-levels");
    list.innerHTML = "";
    levels.forEach(l => {
        const li = document.createElement("li");
        li.textContent = `${l.label}: ${l.price} (${l.note})`;
        list.appendChild(li);
    });

    // Carica grafico
    loadChart(symbol);

    // Vai alla pagina di analisi
    showPage("analysis-page");
}

/* =========================
   INIT
========================= */

document.addEventListener("DOMContentLoaded", () => {
    showPage("home-page");
    loadFakeNews();

    const form = document.getElementById("search-form");
    const input = document.getElementById("search-input");

    if (form && input) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            handleSearch(input.value);
        });
    }
});
