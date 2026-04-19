from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import sqlite3
import os
from datetime import datetime
import asyncio
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite Configuration
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', 'investflow.db')

# ─── Comprehensive Financial Tickers ────────────────────────────
TICKERS = {
    # US Indices & Major Stocks
    "^GSPC":        {"name": "S&P 500",               "category": "INDEX",    "region": "US"},
    "^DJI":         {"name": "Dow Jones",              "category": "INDEX",    "region": "US"},
    "^IXIC":        {"name": "NASDAQ Composite",       "category": "INDEX",    "region": "US"},
    "AAPL":         {"name": "Apple",                  "category": "STOCK",    "region": "US"},
    "MSFT":         {"name": "Microsoft",              "category": "STOCK",    "region": "US"},
    "GOOGL":        {"name": "Alphabet (Google)",      "category": "STOCK",    "region": "US"},
    "AMZN":         {"name": "Amazon",                 "category": "STOCK",    "region": "US"},
    "NVDA":         {"name": "NVIDIA",                 "category": "STOCK",    "region": "US"},
    "TSLA":         {"name": "Tesla",                  "category": "STOCK",    "region": "US"},

    # Indian Indices & Stocks
    "^NSEI":        {"name": "Nifty 50",               "category": "INDEX",    "region": "IN"},
    "^BSESN":       {"name": "BSE Sensex",             "category": "INDEX",    "region": "IN"},
    "RELIANCE.NS":  {"name": "Reliance Industries",    "category": "STOCK",    "region": "IN"},
    "HDFCBANK.NS":  {"name": "HDFC Bank",              "category": "STOCK",    "region": "IN"},
    "TCS.NS":       {"name": "TCS",                    "category": "STOCK",    "region": "IN"},
    "INFY.NS":      {"name": "Infosys",                "category": "STOCK",    "region": "IN"},
    "ICICIBANK.NS": {"name": "ICICI Bank",             "category": "STOCK",    "region": "IN"},
    "SBIN.NS":      {"name": "State Bank of India",    "category": "STOCK",    "region": "IN"},

    # Commodities (Gold, Silver, Copper, Crude)
    "GC=F":         {"name": "Gold Futures",           "category": "GOLD",     "region": "GLOBAL"},
    "SI=F":         {"name": "Silver Futures",         "category": "GOLD",     "region": "GLOBAL"},
    "HG=F":         {"name": "Copper Futures",         "category": "COMMODITY","region": "GLOBAL"},
    "CL=F":         {"name": "Crude Oil (WTI)",        "category": "COMMODITY","region": "GLOBAL"},

    # Bonds & Treasuries
    "^TNX":         {"name": "US 10Y Treasury Yield",  "category": "BOND",     "region": "US"},
    "^TYX":         {"name": "US 30Y Treasury Yield",  "category": "BOND",     "region": "US"},
    "^IRX":         {"name": "US 13W Treasury Bill",   "category": "BOND",     "region": "US"},

    # Indian Mutual Fund / ETF proxies
    "0P0000XVAP.BO":{"name": "SBI Bluechip Fund",     "category": "MUTUAL_FUND","region": "IN"},
    "0P0000XVHJ.BO":{"name": "HDFC Flexi Cap Fund",   "category": "MUTUAL_FUND","region": "IN"},

    # Real Estate proxies (REITs)
    "VNQ":          {"name": "Vanguard Real Estate ETF","category": "REAL_ESTATE","region": "US"},
    "EMBASSY.NS":   {"name": "Embassy REIT India",     "category": "REAL_ESTATE","region": "IN"},

    # Fixed Deposit proxies (short-term bond ETFs)
    "SHV":          {"name": "iShares Short Treasury", "category": "FD",       "region": "US"},
}


def update_market_data():
    """Fetch live prices for all tracked tickers and store in SQLite."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Ensure table exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS market_data (
                symbol TEXT PRIMARY KEY,
                name TEXT,
                price REAL,
                change_percent REAL,
                category TEXT,
                region TEXT,
                extra_info TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        success_count = 0
        for symbol, meta in TICKERS.items():
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('regularMarketPreviousClose') or info.get('previousClose')
                prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
                
                if price:
                    change_pct = round(((price - prev_close) / prev_close * 100), 2) if prev_close else 0
                    extra = json.dumps({
                        "open": info.get('regularMarketOpen'),
                        "high": info.get('dayHigh'),
                        "low": info.get('dayLow'),
                        "volume": info.get('volume'),
                        "marketCap": info.get('marketCap'),
                        "52wHigh": info.get('fiftyTwoWeekHigh'),
                        "52wLow": info.get('fiftyTwoWeekLow'),
                        "sector": info.get('sector'),
                    })
                    cursor.execute("""
                        INSERT INTO market_data (symbol, name, price, change_percent, category, region, extra_info, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                        ON CONFLICT(symbol) DO UPDATE SET
                        name = excluded.name,
                        price = excluded.price,
                        change_percent = excluded.change_percent,
                        category = excluded.category,
                        region = excluded.region,
                        extra_info = excluded.extra_info,
                        last_updated = CURRENT_TIMESTAMP
                    """, (symbol, meta["name"], round(price, 2), change_pct, meta["category"], meta["region"], extra))
                    success_count += 1
            except Exception as e:
                print(f"  [WARN] Skipping {symbol}: {e}")
                continue
        
        conn.commit()
        cursor.close()
        conn.close()
        print(f"[{datetime.now()}] Market data updated: {success_count}/{len(TICKERS)} tickers.")
    except Exception as e:
        print(f"[ERROR] Market data update failed: {e}")


@app.on_event("startup")
async def startup_event():
    print("Starting market data fetch (this may take a minute)...")
    update_market_data()
    async def schedule_updates():
        while True:
            await asyncio.sleep(1800)  # every 30 minutes
            update_market_data()
    asyncio.create_task(schedule_updates())


# ─── API Endpoints ──────────────────────────────────────────────

@app.get("/api/market-data")
def get_all_market_data(category: str = None, region: str = None):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM market_data WHERE 1=1"
        params = []
        if category:
            query += " AND category = ?"
            params.append(category)
        if region:
            query += " AND region = ?"
            params.append(region)
        query += " ORDER BY category, name"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        data = []
        for row in rows:
            d = dict(row)
            if d.get('extra_info'):
                try: d['extra_info'] = json.loads(d['extra_info'])
                except: pass
            data.append(d)
        cursor.close()
        conn.close()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ticker/{symbol}")
def get_ticker_info(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose')
        previous_close = info.get('previousClose')
        if not current_price:
            raise HTTPException(status_code=404, detail="Price data not found")
        change = current_price - previous_close if previous_close else 0
        change_percent = (change / previous_close * 100) if previous_close else 0
        return {
            "symbol": symbol.upper(),
            "name": info.get('shortName', symbol),
            "price": round(current_price, 2),
            "change": round(change, 2),
            "change_percent": round(change_percent, 2),
            "open": info.get('regularMarketOpen'),
            "high": info.get('dayHigh'),
            "low": info.get('dayLow'),
            "volume": info.get('volume'),
            "sector": info.get('sector', 'N/A'),
            "marketCap": info.get('marketCap'),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history/{symbol}")
def get_ticker_history(symbol: str, range: str = "1mo"):
    try:
        period_map = {
            "1W": "5d", "1M": "1mo", "3M": "3mo",
            "6M": "6mo", "1Y": "1y", "5Y": "5y", "10Y": "10y", "MAX": "max"
        }
        yf_period = period_map.get(range, "1mo")
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=yf_period)
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data found")
        data = []
        for index, row in hist.iterrows():
            data.append({"date": index.strftime("%Y-%m-%d"), "price": round(row['Close'], 2)})
        return {"symbol": symbol, "history": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/growth-projection")
def growth_projection(principal: float = 100000, monthly: float = 10000, annual_return: float = 12):
    """Calculate wealth growth projections over multiple timeframes."""
    timeframes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 25]
    r_monthly = (annual_return / 100) / 12
    results = []
    
    for years in timeframes:
        months = years * 12
        value = principal
        for m in range(months):
            value = value * (1 + r_monthly) + monthly
        results.append({
            "year": years,
            "value": round(value, 2),
            "total_invested": round(principal + (monthly * years * 12), 2),
            "gains": round(value - principal - (monthly * years * 12), 2)
        })
    
    return {"projections": results, "params": {"principal": principal, "monthly": monthly, "annual_return": annual_return}}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
