/* ============================================================
   NAVIGAZIONE
============================================================ */

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");
}

/* ============================================================
   LISTE HOME — MINI GRAFICI (LAZY LOADING)
============================================================ */

const listAzioni = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","JPM","XOM","BRK.B"];
const listCFD = ["US500","NAS100","GER40","UK100","JP225","GOLD","SILVER","OIL","NATGAS","VIX"];
const listCommodity = ["GOLD","SILVER","COPPER","PLATINUM","PALLADIUM","OIL","BRENT","NATGAS","CORN","WHEAT"];
const listETC = ["VZLD","VZLE","VZLC","VZLN","VZLO","VZLB","VZLP","VZLM","VZLF","VZLX"];
const listBond = ["IGLA","IEMB","LQDE","IBTM","IBTL","AGGH","BND","BNDX","TIP","SHY"];

function renderList(containerId, list) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    list.forEach(ticker => {
        const div = document.createElement("div");
        div.className = "mini-item";
        div.onclick = () => loadTitlePage(ticker);

        div.innerHTML = `
            <span>${ticker}</span>
            <div class="mini-chart lazy-chart" data-ticker="${ticker}">
                <span style="font-size:12px;opacity:0.6;">Carico…</span>
            </div>
        `;

        container.appendChild(div);
    });

    observeLazyCharts();
}

function observeLazyCharts() {
    const charts = document.querySelectorAll(".lazy-chart");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const box = entry.target;
                const ticker = box.dataset.ticker;

                box.innerHTML = `
                    <iframe class="mini-chart"
                        src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(ticker)}&interval=D&theme=dark&style=1&hide_top_toolbar=1&hide_legend=1&save_image=0&hide_volume=1&studies=[]"
                    ></iframe>
                `;

                observer.unobserve(box);
            }
        });
    }, { threshold: 0.2 });

    charts.forEach(c => observer.observe(c));
}

function loadHomeLists() {
    renderList("list-azioni", listAzioni);
    renderList("list-cfd", listCFD);
    renderList("list-commodity", listCommodity);
    renderList("list-etc", listETC);
    renderList("list-bond", listBond);
}

/* ============================================================
   PAGINA TITOLO
============================================================ */

function loadTitlePage(ticker) {
    document.getElementById("title-name").textContent = ticker;

    document.getElementById("main-chart-container").innerHTML = `
        <iframe class="main-chart-iframe"
            src="https://s.tradingview.com/widgetembed/?symbol=${encodeURIComponent(ticker)}&interval=60&theme=dark&style=1&hide_top_toolbar=0&hide_legend=1&save_image=0&hide_volume=0&studies=[]"
        ></iframe>
    `;

    showPage("title-page");
}

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    showPage("home-page");
    loadHomeLists();
});
