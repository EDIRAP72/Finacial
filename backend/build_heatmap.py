import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
from pathlib import Path

# Percorsi cartelle
BASE_DIR = Path(__file__).resolve().parent.parent
UNIVERSE_FILE = BASE_DIR / "data" / "universe.csv"
OUTPUT_FILE = BASE_DIR / "data" / "heatmap_data.json"

# Carica lista ticker
def load_universe():
    df = pd.read_csv(UNIVERSE_FILE)
    return df["ticker"].dropna().unique().tolist()

# Scarica dati reali gratuiti
def fetch_data(tickers):
    end = datetime.utcnow()
    start = end - timedelta(days=30)  # finestra più ampia per logica complessa
    data = yf.download(
        tickers,
        start=start,
        end=end,
        group_by="ticker",
        auto_adjust=True,
        progress=False,
        threads=True
    )
    return data

# Calcolo logica complessa flusso soldi / domanda-offerta
def compute_metrics(data):
    records = []

    # Gestione multi-ticker
    if isinstance(data.columns, pd.MultiIndex):
        tickers = data.columns.levels[0]
    else:
        tickers = [None]

    for ticker in tickers:
        try:
            df = data[ticker].dropna()
            if len(df) < 5:
                continue

            # Ritorni e flusso di soldi
            df["return"] = df["Close"].pct_change()
            df["money_flow"] = df["return"] * df["Volume"]

            last = df.iloc[-1]

            # METRICHE COMPLESSE
            avg_flow = df["money_flow"].mean()
            last_flow = last["money_flow"]
            vol_rel = last["Volume"] / df["Volume"].mean()
            vol_spike = df["Volume"].iloc[-1] / df["Volume"].rolling(10).mean().iloc[-1]
            momentum = df["Close"].iloc[-1] / df["Close"].rolling(20).mean().iloc[-1]

            # SCORE COMPLESSO (puoi complicarlo quanto vuoi)
            score = (
                0.35 * last_flow +
                0.25 * avg_flow +
                0.15 * vol_rel +
                0.15 * vol_spike +
                0.10 * momentum
            )

            records.append({
                "ticker": ticker,
                "last_price": float(last["Close"]),
                "last_volume": int(last["Volume"]),
                "avg_money_flow": float(avg_flow),
                "last_money_flow": float(last_flow),
                "volume_relative": float(vol_rel),
                "volume_spike": float(vol_spike),
                "momentum": float(momentum),
                "score": float(score)
            })

        except Exception:
            continue

    return records

# Costruisce la heatmap (solo top 20)
def build_heatmap():
    tickers = load_universe()
    data = fetch_data(tickers)
    records = compute_metrics(data)

    # Ordina per score e prendi solo i primi 20
    top20 = sorted(records, key=lambda x: x["score"], reverse=True)[:20]

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "items": top20
        }, f, indent=2)

if __name__ == "__main__":
    build_heatmap()
