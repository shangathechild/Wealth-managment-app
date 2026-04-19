const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
require('dotenv').config();

let db;

async function initDB() {
  db = await open({
    filename: path.join(__dirname, 'investflow.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT,
      liquid_cash DECIMAL(15, 2) DEFAULT 0.00,
      google_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      otp TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      category TEXT CHECK(category IN ('STOCK', 'GOLD', 'REAL_ESTATE', 'BOND', 'MUTUAL_FUND', 'FD')) DEFAULT 'STOCK',
      shares DECIMAL(15, 4) NOT NULL DEFAULT 0,
      average_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_data (
      symbol TEXT PRIMARY KEY,
      name TEXT,
      price DECIMAL(15, 2),
      change_percent DECIMAL(10, 2),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INTEGER PRIMARY KEY,
      survey_results TEXT,
      investment_plan TEXT,
      risk_score INTEGER,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, symbol)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT CHECK(type IN ('BUY', 'SELL')) NOT NULL,
      shares DECIMAL(15, 4) NOT NULL,
      price DECIMAL(15, 2) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log('SQLite Database initialized successfully.');
}

// Wrapper for common queries to mimic mysql2 pool
const pool = {
  query: async (sql, params) => {
    if (!db) await initDB();
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(sql, params);
      return [rows];
    } else {
      const result = await db.run(sql, params);
      return [{ insertId: result.lastID, affectedRows: result.changes }];
    }
  },
  getConnection: async () => {
    // SQLite handles transactions on a single connection easily
    return {
      beginTransaction: () => db.run('BEGIN TRANSACTION'),
      commit: () => db.run('COMMIT'),
      rollback: () => db.run('ROLLBACK'),
      query: (sql, params) => db.all(sql, params),
      run: (sql, params) => db.run(sql, params),
      release: () => {} 
    };
  }
};

module.exports = { pool, initDB };
