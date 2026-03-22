/* ============================================================
   CHART MODULE — REAL DATA + FORECAST PROJECTION
   ============================================================ */

import { addDays } from "./core.js";

/* ===============================
   PREPARA I DATI DI PROIEZIONE
   =============================== */
export function prepareProjectedData(realData, projection) {
    if (!realData || !realData.length) return [];

    const lastDate = realData[realData.length - 1].time;

    return projection.map(p => ({
        time: addDays(lastDate, p.day),
        value: p.value
    }));
}

/* ===============================
   CREA IL GRAFICO
   =============================== */
export function createChart(containerId, realData, projectedData) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error("Chart container non trovato:", containerId);
        return null;
    }

    // Pulizia contenitore
    container.innerHTML = "";

    // Fix: se il container non ha dimensioni, aspetta
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const chart = LightweightCharts.createChart(container, {
        width,
        height,
        layout: {
            background: { color: "#ffffff" },
            textColor: "#000"
        },
        grid: {
            vertLines: { color: "#eee" },
            horzLines: { color: "#eee" }
        },
        timeScale: {
            borderColor: "#ccc"
        }
    });

    /* -------------------------------
       SERIE REALE
       ------------------------------- */
    const realSeries = chart.addLineSeries({
        color: "#2962FF",
        lineWidth: 2
    });

    realSeries.setData(realData);

    /* -------------------------------
       SERIE PROIETTATA
       ------------------------------- */
    if (projectedData && projectedData.length) {
        const projSeries = chart.addLineSeries({
            color: "red",
            lineWidth: 2,
            lineStyle: 2 // tratteggiato
        });

        projSeries.setData(projectedData);
    }

    return chart;
}

/* ===============================
   RIDISEGNA IL GRAFICO SU RESIZE
   =============================== */
export function enableChartResize(chart, containerId) {
    const container = document.getElementById(containerId);

    if (!container || !chart) return;

    const resizeObserver = new ResizeObserver(() => {
        chart.applyOptions({
            width: container.clientWidth,
            height: container.clientHeight
        });
    });

    resizeObserver.observe(container);
}
