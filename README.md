# 🚀 InvestFlow — AI-Powered Wealth Management Platform

> A full-stack, long-term wealth management platform with AI-driven financial planning, real-time market data, and interactive growth projections.

![Demo Recording](docs/screenshots/demo_recording.webp)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Screenshots & Showcase](#-screenshots--showcase)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Tutorial: Using InvestFlow](#-tutorial-using-investflow)
  - [Step 1: Create Your Account](#step-1-create-your-account)
  - [Step 2: Take the Investor Survey](#step-2-take-the-investor-survey)
  - [Step 3: Explore Your Dashboard](#step-3-explore-your-dashboard)
  - [Step 4: Browse Market Data](#step-4-browse-market-data)
  - [Step 5: Invest in Assets](#step-5-invest-in-assets)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Data Sources](#-data-sources)
- [Configuration](#-configuration)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**InvestFlow** is a comprehensive wealth management web application designed for **long-term investors**. Unlike most stock-focused trading apps, InvestFlow helps users build diversified portfolios across multiple asset classes — including **Gold, Real Estate, Bonds, Mutual Funds, and Fixed Deposits** — with personalized AI-generated investment plans.

The platform uses **Google's Gemini AI** to analyze each user's risk profile and financial goals, then generates a customized 25-year wealth building strategy. Interactive charts visualize projected growth over 1 to 25 years, showing users exactly how their wealth can compound over time.

---

## ✨ Key Features

### 🔐 Secure Authentication
- **bcrypt** password hashing for enterprise-grade security
- **JWT** token-based session management (24h expiry)
- Clean signup/login flow with instant dashboard access

### 🤖 AI-Powered Financial Planning
- 3-question investor survey to assess risk tolerance, goals, and time horizon
- **Google Gemini AI** analyzes responses and generates a personalized investment strategy
- Asset allocation recommendations (Gold, Real Estate, Bonds, Mutual Funds, etc.)
- Period-specific advice (1-5 years, 5-10 years, 10-25 years)

### 📊 Wealth Growth Projections
- Interactive area charts showing projected wealth over **1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, and 25 years**
- Dual-line visualization: **Total Invested** vs **Total Value** (including compound gains)
- Configurable parameters: starting capital, monthly SIP, expected return rate
- Powered by a dedicated Python calculation engine

### 📈 Comprehensive Market Data
- **30+ financial instruments** tracked in real-time via Yahoo Finance:

| Category | Instruments |
|----------|-------------|
| **US Indices** | S&P 500, Dow Jones, NASDAQ |
| **Indian Indices** | Nifty 50, BSE Sensex |
| **US Stocks** | Apple, Microsoft, Google, Amazon, NVIDIA, Tesla |
| **Indian Stocks** | Reliance, HDFC Bank, TCS, Infosys, ICICI Bank, SBI |
| **Precious Metals** | Gold Futures, Silver Futures |
| **Commodities** | Copper Futures, Crude Oil (WTI) |
| **Bonds** | US 10Y Treasury, US 30Y Treasury, 13W T-Bill |
| **Mutual Funds** | SBI Bluechip Fund, HDFC Flexi Cap Fund |
| **Real Estate** | Vanguard REIT ETF, Embassy REIT India |
| **Fixed Deposits** | iShares Short Treasury Bond ETF |

- Automatic background sync every 30 minutes
- Filterable by **category** and **region** (US, India, Global)

### 💼 Portfolio Management
- Buy/sell any tracked asset with real-time pricing
- Multi-asset category tracking (STOCK, GOLD, REAL_ESTATE, BOND, MUTUAL_FUND, FD)
- Watchlist functionality
- Transaction history

### 🏗️ High-Performance Architecture
- **Go calculation engine** for blazing-fast financial projections
- **SQLite** database (zero-configuration, no external DB server needed)
- Polyglot microservice architecture (Node.js + Python + Go)

---

## 📸 Screenshots & Showcase

### Login Page
Clean, minimal authentication with email and password.

![Login Page](docs/screenshots/01_login.png)

### Sign Up
Create an account with your name, email, password, and starting capital.

![Sign Up](docs/screenshots/02_signup.png)

### Dashboard — Survey Prompt
First-time users see a call-to-action to take the AI investor survey.

![Dashboard Survey CTA](docs/screenshots/03_dashboard.png)

### Investor Survey — Risk Assessment
A 3-step survey to determine your risk tolerance, goals, and time horizon.

![Survey - Risk](docs/screenshots/04_survey.png)

### Investor Survey — Goal Selection
Select your primary investment goal (Retirement, Home, Education, or General Wealth).

![Survey - Goal](docs/screenshots/05_survey_goal.png)

### Stocks Page
Browse and search live stock data with real-time prices.

![Stocks](docs/screenshots/06_stocks.png)

### Currencies Page
Track global currency exchange rates.

![Currencies](docs/screenshots/07_currencies.png)

### News Page
Stay up to date with the latest financial news.

![News](docs/screenshots/08_news.png)

---

## 🏛️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Node.js + Express│────▶│   SQLite DB     │
│   Frontend      │     │  Backend (5001)  │     │  investflow.db  │
│   (Port 5173)   │     └────────┬─────────┘     └─────────────────┘
└─────────────────┘              │
                                 │ Gemini AI API
                                 ▼
                        ┌─────────────────┐
                        │  Google Gemini   │
                        │  LLM Service    │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Python FastAPI  │────▶│  Yahoo Finance  │
│  Data Service   │     │  (yfinance)     │
│  (Port 8000)    │     └─────────────────┘
└─────────────────┘

┌─────────────────┐
│  Go Engine      │  (Optional: high-performance projections)
│  (Port 8080)    │
└─────────────────┘
```

### Data Flow
1. **Frontend** (React) makes API calls to the **Backend** (Node.js) and **Data Service** (Python)
2. **Backend** handles auth, portfolio CRUD, and AI survey analysis via Gemini
3. **Data Service** fetches live market data from Yahoo Finance and caches it in SQLite
4. **Go Engine** (optional) provides high-speed financial calculations

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Vite, TailwindCSS | UI, Routing, Styling |
| **Charts** | Recharts | Interactive area/pie/bar charts |
| **Icons** | Lucide React | Modern icon system |
| **Backend** | Node.js, Express 5 | REST API, Authentication |
| **Auth** | bcryptjs, jsonwebtoken | Password hashing, JWT sessions |
| **Database** | SQLite 3 | Zero-config relational storage |
| **AI** | Google Gemini 1.5 Flash | Investment plan generation |
| **Data** | Python, FastAPI, yfinance | Market data ingestion |
| **Performance** | Go (Golang) | High-speed calculations |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | ≥ 18.x | `node --version` |
| **Python** | ≥ 3.10 | `python --version` |
| **npm** | ≥ 9.x | `npm --version` |
| **Go** *(optional)* | ≥ 1.21 | `go version` |

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/investflow.git
cd investflow
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### 4. Install Python Dependencies
```bash
cd ../data-service
python -m pip install fastapi uvicorn yfinance
```

#### 5. Configure Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Database (SQLite - no config needed, auto-created)
# JWT
JWT_SECRET=your_super_secret_key_here

# Google Gemini AI (for investment plan generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Server
PORT=5001
```

> 💡 **Getting a Gemini API Key**: Visit [Google AI Studio](https://aistudio.google.com/apikey) and create a free API key.

### Running the Application

#### Option A: One-Click Start (Windows)
Double-click `run_investflow.bat` in the project root. This starts all 3 services automatically.

#### Option B: Manual Start (3 terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm start
```

**Terminal 2 — Data Service:**
```bash
cd data-service
python main.py
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

#### 🌐 Access the App
Open your browser to: **http://localhost:5173**

---

## 📖 Tutorial: Using InvestFlow

### Step 1: Create Your Account

1. Navigate to `http://localhost:5173`
2. Click **"Create one"** at the bottom of the login form
3. Fill in your details:
   - **Full Name**: Your display name
   - **Email**: Your email address (used for login)
   - **Password**: Choose a secure password
   - **Starting Capital**: Enter your initial investment amount (e.g., ₹10,00,000)
4. Click **"Create Account"**
5. You'll be taken directly to your Dashboard!

### Step 2: Take the Investor Survey

1. On the Dashboard, you'll see a prominent **"Build Your AI Financial Plan"** card
2. Click **"Take the Survey →"**
3. Answer 3 questions:
   - **Risk Tolerance**: Conservative / Moderate / Aggressive
   - **Investment Goal**: Retirement / Home / Education / General Wealth
   - **Time Horizon**: Short (1-3Y) / Medium (5-10Y) / Long (15-25Y)
4. The AI will analyze your responses and generate a personalized plan
5. Your Dashboard will transform to show:
   - Your AI-generated investment strategy
   - Asset allocation pie chart (Gold, Real Estate, Bonds, etc.)
   - Period-specific financial advice

### Step 3: Explore Your Dashboard

Your Dashboard now displays:
- **Net Worth** card — total value of all assets + cash
- **Liquid Cash** — available balance for investing
- **25Y Projected** — estimated wealth after 25 years of investing
- **Wealth Growth Chart** — interactive chart showing compound growth
  - Toggle between **5Y, 10Y, 15Y, 25Y** views
  - Blue area = Total Invested, Green area = Total Value (with gains)
- **Gains Breakdown** — see exact projected values for each year
- **Market Overview** — live prices grouped by category

### Step 4: Browse Market Data

Use the sidebar navigation to explore:
- **Stocks** — Search and browse global stocks (US + India)
- **Currencies** — Track forex rates
- **Fixed Deposits** — Compare FD rates
- **News** — Latest financial headlines

Click on any stock/instrument to see:
- Live price and change percentage
- Interactive price history chart (1W, 1M, 3M, 6M, 1Y)
- Buy/Sell options

### Step 5: Invest in Assets

1. Navigate to any stock detail page (e.g., click on "Reliance Industries")
2. Enter the number of shares you want to buy
3. Click **"Buy"**
4. Your portfolio will update in real-time
5. View your holdings on the Dashboard under **"Your Holdings"**

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Sign in with email/password |

### Portfolio
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/portfolio/:userId` | Get user's full portfolio |
| `POST` | `/api/invest` | Buy or sell an asset |
| `POST` | `/api/watchlist` | Add/remove from watchlist |

### AI Survey
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/survey/analyze` | Submit survey & get AI plan |

### Market Data (Python Service — Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/market-data` | All cached market data |
| `GET` | `/api/market-data?category=GOLD` | Filter by category |
| `GET` | `/api/market-data?region=IN` | Filter by region |
| `GET` | `/api/ticker/{symbol}` | Live ticker info |
| `GET` | `/api/history/{symbol}?range=1Y` | Price history |
| `GET` | `/api/growth-projection` | Wealth growth calculator |

---

## 📁 Project Structure

```
investflow/
├── backend/                    # Node.js API Server
│   ├── index.js               # Main server (auth, portfolio, survey)
│   ├── db.js                  # SQLite database initialization
│   ├── mailer.js              # Email service (unused, kept for reference)
│   ├── services/
│   │   └── llmService.js     # Google Gemini AI integration
│   ├── investflow.db          # SQLite database file (auto-created)
│   ├── .env                   # Environment variables
│   └── package.json
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Authentication page
│   │   │   ├── Dashboard.jsx  # Main wealth dashboard
│   │   │   ├── Survey.jsx     # AI investor survey
│   │   │   ├── Stocks.jsx     # Stock market browser
│   │   │   ├── StockDetail.jsx# Individual stock view
│   │   │   ├── Currencies.jsx # Forex tracker
│   │   │   ├── FixedDeposits.jsx
│   │   │   └── News.jsx       # Financial news
│   │   ├── components/
│   │   │   ├── Sidebar.jsx    # Navigation sidebar
│   │   │   ├── StatCard.jsx   # Dashboard stat cards
│   │   │   └── StockRow.jsx   # Stock list item
│   │   ├── context/
│   │   │   └── AuthContext.jsx# Auth state management
│   │   └── App.jsx            # Routes & layout
│   └── package.json
│
├── data-service/               # Python Market Data Engine
│   └── main.py                # FastAPI server (yfinance + SQLite)
│
├── calc-engine/                # Go High-Performance Engine
│   └── main.go                # Growth projection calculations
│
├── docs/
│   └── screenshots/           # App screenshots for README
│
├── run_investflow.bat          # One-click Windows launcher
├── system_architecture.md      # Detailed architecture docs
└── README.md                   # You are here!
```

---

## 📊 Data Sources

| Source | Data Type | Update Frequency |
|--------|-----------|-----------------|
| [Yahoo Finance](https://finance.yahoo.com) via `yfinance` | Stocks, Indices, Commodities, Bonds, ETFs | Every 30 minutes |
| [Google Gemini](https://ai.google.dev) | AI investment plan generation | On-demand (survey) |

### Tracked Asset Categories

- **INDEX**: S&P 500, Dow Jones, NASDAQ, Nifty 50, Sensex
- **STOCK**: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, RELIANCE, HDFC, TCS, INFY, ICICI, SBI
- **GOLD**: Gold Futures, Silver Futures
- **COMMODITY**: Copper, Crude Oil
- **BOND**: US 10Y/30Y Treasury, 13W T-Bill
- **MUTUAL_FUND**: SBI Bluechip, HDFC Flexi Cap
- **REAL_ESTATE**: Vanguard REIT ETF, Embassy REIT India
- **FD**: iShares Short Treasury Bond ETF

---

## ⚙️ Configuration

### Environment Variables (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret key for signing auth tokens |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key for AI plans |
| `PORT` | No | Backend port (default: 5001) |

> *The app works without a Gemini key, but the AI survey will return a fallback generic plan.

### Port Configuration

| Service | Default Port | Configurable |
|---------|-------------|-------------|
| Frontend (Vite) | 5173 | `npm run dev -- --port XXXX` |
| Backend (Express) | 5001 | `PORT` in `.env` |
| Data Service (FastAPI) | 8000 | Edit `main.py` |
| Go Engine | 8080 | Edit `main.go` |

---

## 🗺️ Future Roadmap

- [ ] **Real-time WebSocket updates** for live price streaming
- [ ] **Portfolio analytics** — sector diversification, risk scoring
- [ ] **Tax calculator** — estimate capital gains tax for India
- [ ] **SIP automation** — scheduled monthly investments
- [ ] **Mobile responsive** — PWA support
- [ ] **Export reports** — PDF portfolio summaries
- [ ] **Multi-currency support** — INR, USD, EUR
- [ ] **Social features** — share portfolios, compare with friends
- [ ] **Advanced charting** — candlestick charts, technical indicators

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for long-term wealth builders**

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
