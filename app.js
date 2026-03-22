// -------------------------------
// ELEMENTI DOM
// -------------------------------
const newsGrid = document.getElementById("news-grid");
const ticker = document.getElementById("ticker");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const detailPage = document.getElementById("detail-page");
const newsSection = document.getElementById("news-section");
const searchSection = document.getElementById("search-section");

// --------------------------------------
// MOCK DATA (per ticker e news homepage)
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
// MODULO DATI REALI (Alpha Vantage)
// --------------------------------------
// OTTIENI UNA API KEY GRATUITA SU ALPHA VANTAGE
// https://www.alphavantage.co/support/#api-key
const API_KEY = "INSERISCI_LA_TUA_API_KEY";

async function getRealTimePrice(symbol) {
    try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data["Global Quote"]) return null;

        return {
            price: data["Global Quote"]["05. price"],
            volume: data["Global Quote"]["06. volume"],
            change: data["Global Quote"]["10. change percent"]
        };
    } catch (e) {
        console.error("Errore getRealTimePrice:", e);
        return null;
    }
}

async function getNewsForSymbol(symbol) {
    try {
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${symbol}&apikey=${API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.feed) return [];

        return data.feed.slice(0, 5).map(n => ({
            title: n.title,
            source: n.source,
            sentiment: n.overall_sentiment_score
        }));
    } catch (e) {
        console.error("Errore getNewsForSymbol:", e);
        return [];
    }
}

// --------------------------------------
// POPOLA TICKER SCORREVOLE (HOMEPAGE)
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
// POPOLA NOTIZIE HOMEPAGE
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

    showDetailPage(query);
}

searchBtn.addEventListener("click", handleSearch);

// --------------------------------------
// MOSTRA PAGINA DETTAGLIO CON DATI REALI
// --------------------------------------
async function showDetailPage(tickerSymbol) {

    // Nasconde homepage
    newsSection.style.display = "none";
    searchSection.style.display = "none";

    // Mostra pagina dettaglio
    detailPage.classList.remove("hidden");

    // Carica dati reali
    const realData = await getRealTimePrice(tickerSymbol);
    const newsData = await getNewsForSymbol(tickerSymbol);

    detailPage.innerHTML = `
        <h2>${tickerSymbol.toUpperCase()}</h2>

        <!-- DOMANDA / OFFERTA / VOLUMI (per ora solo prezzo/volume) -->
        <div class="order-section">
            <h3>Domanda / Offerta / Volumi</h3>
            <p><strong>Prezzo attuale:</strong> ${realData ? realData.price : "N/D"}</p>
            <p><strong>Volume:</strong> ${realData ? realData.volume : "N/D"}</p>
            <p><strong>Variazione:</strong> ${realData ? realData.change : "N/D"}</p>
        </div>

        <!-- GRAFICO REALE + PROIEZIONE -->
        <div class="chart-section">
            <h3>Grafico Reale + Proiezione 1 Mese</h3>
            <div id="chart-placeholder">[Grafico in arrivo nello Step 4]</div>
        </div>

        <!-- 5 MIGLIORI PUNTI DI INGRESSO -->
        <div class="entry-section">
            <h3>Migliori 5 punti di ingresso</h3>
            <ul id="entry-list">
                <li>[Calcolo in arrivo nello Step 5]</li>
            </ul>
        </div>

        <!-- NEWS E SENTIMENT -->
        <div class="news-detail">
            <h3>Sentiment Notizie</h3>
            ${
                newsData.length === 0
                ? "<p>Nessuna notizia disponibile.</p>"
                : newsData.map(n => `
                    <div class="news-item">
                        <strong>${n.title}</strong><br>
                        <em>${n.source}</em><br>
                        Sentiment: ${n.sentiment}
                    </div>
                `).join("")
            }
        </div>

        <button id="back-btn">Torna alla Home</button>
    `;

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
    console.log("App inizializzata — Step 1-3 completati");
}

init();
