/* ============================================================
   APP MODULE — ORCHESTRAZIONE FINALE
   ============================================================ */

import {
    renderTicker,
    renderNews,
    renderHeatmap,
    renderWatchlist,
    renderDetailPage
} from "./ui.js";

/* ============================================================
   INIT HOMEPAGE
   ============================================================ */
async function initHome() {
    renderTicker();
    renderNews();
    await renderHeatmap();
    await renderWatchlist(onSelectSymbol);

    // Aggiorna la watchlist ogni 15 secondi
    setInterval(() => renderWatchlist(onSelectSymbol), 15000);
}

/* ============================================================
   SEARCH HANDLER
   ============================================================ */
function setupSearch() {
    const btn = document.getElementById("search-btn");
    const input = document.getElementById("search-input");

    btn.addEventListener("click", () => {
        const q = input.value.trim();
        if (q) onSelectSymbol(q.toUpperCase());
    });

    input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            const q = input.value.trim();
            if (q) onSelectSymbol(q.toUpperCase());
        }
    });
}

/* ============================================================
   DARK MODE
   ============================================================ */
function setupDarkMode() {
    const toggle = document.getElementById("toggle-dark");
    toggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
    });
}

/* ============================================================
   NAVIGAZIONE
   ============================================================ */
function onSelectSymbol(symbol) {
    renderDetailPage(symbol);
}

/* ============================================================
   APP START
   ============================================================ */
function startApp() {
    setupSearch();
    setupDarkMode();
    initHome();
}

startApp();
