/* ============================================================
   FINANCIAL DASHBOARD – BASE STRUCTURE
   Tutto il resto verrà aggiunto step-by-step
   ============================================================ */

/* ------------------------------------------------------------
   0. SETUP UI
   Creiamo le funzioni per mostrare/nascondere le pagine
   ------------------------------------------------------------ */

function showHome() {
    document.getElementById("home-view").style.display = "block";
    document.getElementById("detail-view").style.display = "none";
    document.getElementById("investors-view").style.display = "none";
}

function showDetail() {
    document.getElementById("home-view").style.display = "none";
    document.getElementById("detail-view").style.display = "block";
    document.getElementById("investors-view").style.display = "none";
}

function showInvestors() {
    document.getElementById("home-view").style.display = "none";
    document.getElementById("detail-view").style.display = "none";
    document.getElementById("investors-view").style.display = "block";
}

/* ------------------------------------------------------------
   1. RENDER HOME PAGE
   Per ora solo un logo e un testo di conferma.
   Poi aggiungeremo mercati, news, top10, ricerca, ecc.
   ------------------------------------------------------------ */

function renderHome() {
    const home = document.getElementById("home-view");

    home.innerHTML = `
        <h1>FINANCIAL DASHBOARD</h1>
        <div class="box">
            <p>La struttura è attiva. Ora posso aggiungere:</p>
            <ul>
                <li>Mercati globali</li>
                <li>Notizie</li>
                <li>Top 10 strumenti</li>
                <li>Barra di ricerca</li>
                <li>Analisi titolo</li>
                <li>Previsioni future</li>
                <li>Sentiment</li>
                <li>Opzioni</li>
                <li>Investitori</li>
            </ul>
        </div>
    `;
}

/* ------------------------------------------------------------
   2. AVVIO
   ------------------------------------------------------------ */

renderHome();
showHome();
