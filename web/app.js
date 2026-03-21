async function loadHeatmap() {
  try {
    const response = await fetch("../data/heatmap_data.json");
    if (!response.ok) {
      throw new Error("Impossibile caricare heatmap_data.json");
    }
    const data = await response.json();
    const items = data.items || [];

    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "tile";

      const score = item.score;
      const norm = Math.max(0, Math.min(1, (score - 0) / (Math.abs(score) + 1)));
      const red = Math.floor(80 + 175 * norm);
      const green = Math.floor(40 + 40 * (1 - norm));
      const blue = 80;
      div.style.backgroundColor = `rgb(${red}, ${green}, ${blue})`;

      div.innerHTML = `
        <div class="ticker">${item.ticker}</div>
        <div class="price">Prezzo: ${item.last_price.toFixed(2)}</div>
        <div class="price">Score: ${score.toFixed(4)}</div>
        <div class="price">Vol rel: ${item.volume_relative.toFixed(2)}</div>
      `;

      div.onclick = () => {
        alert("Titolo selezionato: " + item.ticker);
      };

      grid.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    const grid = document.getElementById("grid");
    grid.innerHTML = "<div>Errore nel caricamento dei dati.</div>";
  }
}

loadHeatmap();
