const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, initDB } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'investflow_secret_key_2026';

// ─── Registration ───────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, initialCash } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name, liquid_cash) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name || email.split('@')[0], initialCash || 0]
    );

    const userId = result.insertId;
    const [users] = await pool.query('SELECT id, email, name, liquid_cash FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, user, token });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists. Please sign in.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ─── Login ──────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name, liquid_cash: user.liquid_cash },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Survey Analysis (Gemini AI) ────────────────────────────────
const { analyzeInvestorProfile } = require('./services/llmService');

app.post('/api/survey/analyze', async (req, res) => {
  const { userId, answers } = req.body;

  try {
    const analysis = await analyzeInvestorProfile(answers);

    // SQLite upsert
    await pool.query(
      `INSERT INTO user_profiles (user_id, survey_results, investment_plan) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET survey_results = excluded.survey_results, investment_plan = excluded.investment_plan`,
      [userId, JSON.stringify(answers), JSON.stringify(analysis)]
    );

    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Portfolio Details ──────────────────────────────────────────
app.get('/api/portfolio/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [users] = await pool.query('SELECT liquid_cash FROM users WHERE id = ?', [userId]);
    const [holdings] = await pool.query('SELECT symbol, shares, average_price, category FROM holdings WHERE user_id = ?', [userId]);
    const [watchlist] = await pool.query('SELECT symbol FROM watchlists WHERE user_id = ?', [userId]);
    const [profile] = await pool.query('SELECT investment_plan, survey_results FROM user_profiles WHERE user_id = ?', [userId]);

    if (!users.length) return res.status(404).json({ error: 'User not found' });

    let investmentPlan = null;
    if (profile.length > 0 && profile[0].investment_plan) {
      try { investmentPlan = JSON.parse(profile[0].investment_plan); } catch (e) { investmentPlan = null; }
    }

    res.json({
      liquid_cash: users[0].liquid_cash,
      holdings,
      watchlist: watchlist.map(w => w.symbol),
      investment_plan: investmentPlan
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Watchlist ──────────────────────────────────────────────────
app.post('/api/watchlist', async (req, res) => {
  const { userId, symbol, action } = req.body;
  try {
    if (action === 'add') {
      await pool.query('INSERT OR IGNORE INTO watchlists (user_id, symbol) VALUES (?, ?)', [userId, symbol]);
    } else {
      await pool.query('DELETE FROM watchlists WHERE user_id = ? AND symbol = ?', [userId, symbol]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Invest / Trade ─────────────────────────────────────────────
app.post('/api/invest', async (req, res) => {
  const { userId, symbol, type, shares, price, category } = req.body;
  const totalCost = shares * price;

  try {
    const [userRows] = await pool.query('SELECT liquid_cash FROM users WHERE id = ?', [userId]);
    if (!userRows.length) throw new Error('User not found');
    let currentCash = parseFloat(userRows[0].liquid_cash);

    if (type === 'BUY') {
      if (currentCash < totalCost) throw new Error('Insufficient funds');
      await pool.query('UPDATE users SET liquid_cash = liquid_cash - ? WHERE id = ?', [totalCost, userId]);

      const [existing] = await pool.query('SELECT shares, average_price FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
      if (existing.length > 0) {
        let oldShares = parseFloat(existing[0].shares);
        let oldPrice = parseFloat(existing[0].average_price);
        let newShares = oldShares + shares;
        let newAvgPrice = ((oldShares * oldPrice) + (shares * price)) / newShares;
        await pool.query('UPDATE holdings SET shares = ?, average_price = ? WHERE user_id = ? AND symbol = ?', [newShares, newAvgPrice, userId, symbol]);
      } else {
        await pool.query('INSERT INTO holdings (user_id, symbol, shares, average_price, category) VALUES (?, ?, ?, ?, ?)', [userId, symbol, shares, price, category || 'STOCK']);
      }
    } else if (type === 'SELL') {
      const [existing] = await pool.query('SELECT shares FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
      if (!existing.length || parseFloat(existing[0].shares) < shares) throw new Error('Insufficient shares');
      let remaining = parseFloat(existing[0].shares) - shares;
      if (remaining <= 0) {
        await pool.query('DELETE FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
      } else {
        await pool.query('UPDATE holdings SET shares = ? WHERE user_id = ? AND symbol = ?', [remaining, userId, symbol]);
      }
      await pool.query('UPDATE users SET liquid_cash = liquid_cash + ? WHERE id = ?', [totalCost, userId]);
    }

    await pool.query('INSERT INTO transactions (user_id, symbol, type, shares, price) VALUES (?, ?, ?, ?, ?)', [userId, symbol, type, shares, price]);
    res.json({ success: true, message: 'Trade successful' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Market Data (from Python service cache) ────────────────────
app.get('/api/market-overview', async (req, res) => {
  try {
    const [data] = await pool.query('SELECT * FROM market_data ORDER BY last_updated DESC');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
initDB().then(() => {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
});
