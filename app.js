/* =========================
   NAVIGAZIONE PAGINE
========================= */

function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const page = document.getElementById(id);
    if (page) page.classList.add("active");
}

/* =========================
   UTILITÀ MATEMATICHE
========================= */

// Hash deterministico del simbolo per avere numeri "stabili"
function hashSymbol(symbol) {
    let h = 0;
    for (let i = 0; i < symbol.length; i++) {
        h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
    }
    return h || 1;
}

// Generatore pseudo-random deterministico basato sull'hash
function makeRng(seed) {
    let s = seed >>> 0;
    return function () {
        // LCG semplice
        s = (1664525 * s + 1013904223) >>> 0;
        return s / 0xffffffff;
    };
}

// Arrotondamento
function roundTo(value, decimals) {
    const f = Math.pow(10, decimals);
    return Math.round(value * f) / f;
}

/* =========================
   MODELLO "QUANTISTICO" SEMPLIFICATO
   (drift + volatilità + percorso simulato)
========================= */

function generateMarketSnapshot(symbol) {
    const baseHash = hashSymbol(symbol);
    const rng = makeRng(baseHash);

    // Prezzo base in funzione del simbolo (stabile)
    const basePrice = 20 + (baseHash % 300); // tra 20 e 320
    const noise = (rng() - 0.5) * 10;        // ±5
    const price = roundTo(basePrice + noise, 2);

    // Spread proporzionale alla "qualità" del simbolo
    const spread = roundTo(price * (0.0005 + rng() * 0.003), 2);
    const bid = roundTo(price - spread / 2, 2);
    const ask = roundTo(price + spread / 2, 2);

    // Volume simulato ma coerente
    const volumeBase = 100000 + (baseHash % 3000000);
    const volumeNoise = Math.floor(rng() * 200000);
    const volume = volumeBase + volumeNoise;

    return { price, bid, ask, volume, rng };
}

// Simulazione percorso a 30 giorni (tipo moto browniano geometrico semplificato)
function generateProjectionPath(priceNow, rng, days = 30) {
    const path = [];
    const annualVol = 0.25 + rng() * 0.35;   // volatilità annua 25–60%
    const annualDrift = -0.05 + rng() * 0.15; // drift -5% / +10%

    const dailyVol = annualVol / Math.sqrt(252);
    const dailyDrift = annualDrift / 252;

    let price = priceNow;

    for (let d = 0; d <= days; d++) {
        if (d > 0) {
            // "fisica quantistica" semplificata: drift + shock casuale
            const shock = dailyVol * (rng() * 2 - 1); // tra -vol e +vol
            const ret = dailyDrift + shock;
            price = price * (1 + ret);
        }
        path.push({
            day: d,
            price: roundTo(price, 2)
        });
    }

    return path;
}

// 5 livelli di ingresso basati sulla distribuzione del percorso
function generateEntryLevels(path) {
    const prices = path.map(p => p.price);
    const current = prices[prices.length - 1];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const mid = (min + max) / 2;

    // 5 livelli: due difensivi, uno centrale, due aggressivi
    const levels = [
        { label: "Ingresso 1 (difensivo)", price: roundTo(min * 1.01, 2), note: "vicino al minimo simulato" },
        { label: "Ingresso 2 (difensivo)", price: roundTo(mid * 0.97, 2), note: "area di ritracciamento" },
        { label: "Ingresso 3 (neutro)",    price: roundTo(current, 2),     note: "prezzo attuale simulato" },
        { label: "Ingresso 4 (aggressivo)",price: roundTo(mid * 1.03, 2),  note: "scenario moderatamente rialzista" },
        { label: "Ingresso 5 (aggressivo)",price: roundTo(max * 0.99, 2),  note: "vicino al massimo simulato" }
    ];

    return levels;
}

/* =========================
   GRAFICO DELLA PROIEZIONE
========================= */

function drawProjectionChart(path) {
    const container = document.getElementById("chart-container");
    if (!container) return;

    container.innerHTML = ""; // pulisci

    const canvas = document.createElement("canvas");
    canvas.width = container.clientWidth || 320;
    canvas.height = 260;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prices = path.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    const padding = 30;
    const w = canvas.width - padding * 2;
    const h = canvas.height - padding * 2;

    function xForDay(day) {
        const maxDay = path[path.length - 1].day || 1;
        return padding + (day / maxDay) * w;
    }

    function yForPrice(price) {
        if (max === min) return padding + h / 2;
        const norm = (price - min) / (max - min);
        return padding + h - norm * h;
    }

    // Sfondo
    ctx.fillStyle = "#010409";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Assi
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + h);
    ctx.lineTo(padding + w, padding + h);
    ctx.stroke();

    // Linea del prezzo
    ctx.strokeStyle = "#2ea043";
    ctx.lineWidth = 2;
    ctx.beginPath();
    path.forEach((p, i) => {
        const x = xForDay(p.day);
        const y = yForPrice(p.price);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Punto finale
    const last = path[path.length - 1];
    const xLast = xForDay(last.day);
    const yLast = yForPrice(last.price);
    ctx.fillStyle = "#f78166";
    ctx.beginPath();
    ctx.arc(xLast, yLast, 4, 0, Math.PI * 2);
    ctx.fill();
}

/* =========================
   NOTIZIE PLACEHOLDER
========================= */

function loadFakeNews() {
    const news = [
        {
            title: "I mercati attendono i prossimi dati macro",
            source: "Quantum Desk"
        },
        {
            title: "Aumenta la volatilità implicita sugli indici globali",
            source: "Volatility Lab"
        },
        {
            title: "Flussi in ingresso su strumenti obbligazionari",
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

    // Aggiorna intestazione
    const assetName = document.getElementById("asset-name");
    if (assetName) assetName.textContent = symbol;

    // Snapshot di mercato (prezzo, bid, ask, volume)
    const snapshot = generateMarketSnapshot(symbol);
    document.getElementById("price-now").textContent = snapshot.price;
    document.getElementById("bid-price").textContent = snapshot.bid;
    document.getElementById("ask-price").textContent = snapshot.ask;
    document.getElementById("volume").textContent = snapshot.volume.toLocaleString("it-IT");

    // Proiezione a 1 mese
    const path = generateProjectionPath(snapshot.price, snapshot.rng, 30);

    // 5 livelli di ingresso
    const levels = generateEntryLevels(path);
    const list = document.getElementById("entry-levels");
    list.innerHTML = "";
    levels.forEach(l => {
        const li = document.createElement("li");
        li.textContent = `${l.label}: ${l.price} (${l.note})`;
        list.appendChild(li);
    });

    // Grafico della proiezione
    drawProjectionChart(path);

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
