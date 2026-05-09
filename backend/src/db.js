const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/buzzreader.db');

let db;

function getDb() {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  initSchema();
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS tweets (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      text TEXT NOT NULL,
      author_id TEXT,
      author_name TEXT,
      created_at TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      retweet_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      fetched_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tweets_keyword ON tweets(keyword);
    CREATE INDEX IF NOT EXISTS idx_tweets_created ON tweets(created_at);
  `);
}

module.exports = { getDb };
