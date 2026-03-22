// -------------------------------
// STEP 2 — LOGICA HOMEPAGE
// -------------------------------

// ELEMENTI DOM
const newsGrid = document.getElementById("news-grid");
const ticker = document.getElementById("ticker");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const detailPage = document.getElementById("detail-page");
const newsSection = document.getElementById("news-section");
const searchSection = document.getElementById("search-section");

// --------------------------------------
// MOCK DATA (verranno sostituiti con API reali)
// --------------------------------------
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

// --------------------------------------
// POPOLA TICKER SCORREVOLE
// --------------------------------------
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

// --------------------------------------
// POPOLA NOTIZIE
// --------------------------------------
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

// --------------------------------------
// GESTIONE RICERCA
// --------------------------------------
function handleSearch() {
    const query = searchInput.value.trim();

    if (query === "") {
        alert("Inserisci un titolo o ticker");
        return;
    }

    // Passa alla pagina dettaglio
    showDetailPage(query);
}

searchBtn.addEventListener("click", handleSearch);

// --------------------------------------
// MOSTRA PAGINA DETTAGLIO
// --------------------------------------
function showDetailPage(tickerSymbol) {
    // Nasconde homepage
    newsSection.style.display = "none";
    searchSection.style.display = "none";

    // Mostra pagina dettaglio
    detailPage.classList.remove("hidden");

    // Placeholder contenuto
    detailPage.innerHTML = `
        <h2>Dettaglio: ${tickerSymbol.toUpperCase()}</h2>
        <p>Qui costruiremo domanda/offerta, volumi, grafico reale e proiezione futura.</p>
        <button id="back-btn">Torna alla Home</button>
    `;

    // Bottone per tornare indietro
    document.getElementById("back-btn").addEventListener("click", showHomePage);
}

// --------------------------------------
// TORNA ALLA HOMEPAGE
// --------------------------------------
function showHomePage() {
    detailPage.classList.add("hidden");
    newsSection.style.display = "block";
    searchSection.style.display = "block";
}

// --------------------------------------
// INIZIALIZZAZIONE
// --------------------------------------
function init() {
    loadTicker();
    loadNews();
    console.log("Step 2 completato — Homepage dinamica attiva");
}

init();
