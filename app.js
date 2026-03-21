/* ============================================================
   NAVIGAZIONE SEMPLICE TRA PAGINE
============================================================ */

let currentSymbol = null;

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    pages.forEach(p => p.classList.remove("active"));

    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");
}

/* ============================================================
   LISTE HOME — MINI GRAFICI TRADINGVIEW
============================================================ */

const listAzioni = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","JPM","XOM","BRK.B"];
const listCFD = ["US500","NAS100","GER40","UK100","JP225","GOLD","SILVER","OIL","NATGAS","VIX"];
const listCommodity = ["GOLD","SILVER","COPPER","PLATINUM","PALLADIUM","OIL","BRENT","NATGAS","CORN","WHEAT"];
const listETC = ["VZLD","VZLE","VZLC","VZLN","VZLO","VZLB","VZLP","VZLM","VZLF","VZLX"];
const listBond = ["IGLA","IEMB","LQDE","IBTM","IBTL","AGGH","BND","BNDX","TIP","SHY"];

function createMiniChart(ticker) {
    return `
        <iframe class="mini-chart"
            src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(ticker)}&interval=D&theme=dark&style=1&hide_top_toolbar=1&hide_legend=1&save_image=0&hide_volume=1&studies=[]"
        ></iframe>
    `;
}

function renderList(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    list.forEach(ticker => {
        const div = document.createElement("div");
        div.className = "mini-item";
        div.onclick = () => loadTitlePage(ticker);

        div.innerHTML = `
            <span>${ticker}</span>
            ${createMiniChart(ticker)}
        `;

        container.appendChild(div);
    });
}

function loadHomeLists() {
    renderList("list-azioni", listAzioni);
    renderList("list-cfd", listCFD);
    renderList("list-commodity", listCommodity);
    renderList("list-etc", listETC);
    renderList("list-bond", listBond);
}

/* ============================================================
   PAGINA TITOLO — GRAFICO PRINCIPALE
============================================================ */

function loadTitlePage(ticker) {
    currentSymbol = ticker;

    const titleEl = document.getElementById("title-name");
    if (titleEl) {
        titleEl.textContent = ticker;
    }

    const chartContainer = document.getElementById("main-chart-container");
    if (chartContainer) {
        chartContainer.innerHTML = `
            <iframe class="main-chart-iframe"
                src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(ticker)}&interval=60&theme=dark&style=1&hide_top_toolbar=0&hide_legend=1&save_image=0&hide_volume=0&studies=[]"
            ></iframe>
        `;
    }

    showPage("title-page");
}

/* ============================================================
   INIZIALIZZAZIONE
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    showPage("home-page");
    loadHomeLists();
});
