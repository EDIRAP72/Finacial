// ===============================
// CONFIGURAZIONE
// ===============================
const API_KEY = "f60cf7a345ee40b9a1bdca5c5eaf932d";

// ===============================
// NAVIGAZIONE PAGINE
// ===============================
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ===============================
// CHIAMATA PREZZO REALE
// ===============================
async function fetchQuote(symbol) {
    const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${API_KEY}`;
    const res = await fetch(url);
    return await res.json();
}

// ===============================
// TIME SERIES PER GRAFICO
// ===============================
async function fetchTimeSeries(symbol) {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${API_KEY}`;
    const res = await fetch(url);
    return await res.json();
}

// ===============================
// PROIEZIONE 1 MESE (LOGICA)
// ===============================
function generateProjection(price) {
    const path = [];
    let p = price;

    for (let i = 0; i < 30; i++) {
        const drift = (Math.random() - 0.5) * 0.02; // ±2%
        p = p * (1 + drift);
        path.push({ day: i, price: Number(p.toFixed(2)) });
    }

    return path;
}

// ===============================
// 5 LIVELLI DI INGRESSO
// ===============================
function generateEntryLevels(price) {
    return [
        { label: "Ingresso 1 (difensivo)", price: Number((price * 0.97).toFixed(2)) },
        { label: "Ingresso 2 (moderato)", price: Number((price * 0.99).toFixed(2)) },
        { label: "Ingresso 3 (neutro)", price: Number(price.toFixed(2)) },
        { label: "Ingresso 4 (aggressivo)", price: Number((price * 1.02).toFixed(2)) },
        { label: "Ingresso 5 (molto aggressivo)", price: Number((price * 1.05).toFixed(2)) }
    ];
}

// ===============================
// GRAFICO REALE + PROIEZIONE
// ===============================
function drawChart(realData, projection) {
    const container = document.getElementById("chart-container");
    container.innerHTML = "";

    const canvas = document.createElement("canvas");
    canvas.width = container.clientWidth;
    canvas.height = 260;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    // Uniamo dati reali + proiezione
    const combined = [
        ...realData.map((d, i) => ({ x: i, price: Number(d.close) })),
        ...projection.map((p, i) => ({ x: realData.length + i, price: p.price }))
    ];

    const prices = combined.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    ctx.strokeStyle = "#2ea043";
    ctx.lineWidth = 2;
    ctx.beginPath();

    combined.forEach((p, i) => {
        const x = (i / (combined.length - 1)) * canvas.width;
        const y = canvas.height - ((p.price - min) / (max - min)) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });

    ctx.stroke();
}

// ===============================
// RICERCA PRINCIPALE
// ===============================
async function handleSearch(symbolRaw) {
    const symbol = symbolRaw.trim().toUpperCase();
    if (!symbol) return;

    // 1) PREZZO REALE
    const quote = await fetchQuote(symbol);

    if (quote.status === "error") {
        alert("Simbolo non valido");
        return;
    }

    document.getElementById("asset-name").textContent = symbol;
    document.getElementById("price-now").textContent = quote.price;
    document.getElementById("bid-price").textContent = quote.bid || "N/D";
    document.getElementById("ask-price").textContent = quote.ask || "N/D";
    document.getElementById("volume").textContent = quote.volume || "N/D";

    // 2) TIME SERIES REALE PER GRAFICO
    const ts = await fetchTimeSeries(symbol);
    const realSeries = ts.values.reverse(); // dal più vecchio al più recente

    // 3) PROIEZIONE 1 MESE
    const projection = generateProjection(Number(quote.price));

    // 4) DISEGNA GRAFICO
    drawChart(realSeries, projection);

    // 5) LIVELLI DI INGRESSO
    const levels = generateEntryLevels(Number(quote.price));
    const list = document.getElementById("entry-levels");
    list.innerHTML = "";
    levels.forEach(l => {
        const li = document.createElement("li");
        li.textContent = `${l.label}: ${l.price}`;
        list.appendChild(li);
    });

    showPage("analysis-page");
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    showPage("home-page");

    const form = document.getElementById("search-form");
    const input = document.getElementById("search-input");

    form.addEventListener("submit", e => {
        e.preventDefault();
        handleSearch(input.value);
    });
});
