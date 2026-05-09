const cron = require('node-cron');
const { getDb } = require('./db');
const { searchTweets } = require('./twitter');
const { generateHistoricalTweets, generateRecentTweets } = require('./mockData');

const isDemo = () =>
  process.env.DEMO_MODE === 'true' || !process.env.TWITTER_BEARER_TOKEN;

function insertTweets(tweets) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO tweets
      (id, keyword, text, author_id, author_name, created_at, like_count, retweet_count, reply_count)
    VALUES
      (@id, @keyword, @text, @author_id, @author_name, @created_at, @like_count, @retweet_count, @reply_count)
  `);
  const insertMany = db.transaction(rows => rows.forEach(r => stmt.run(r)));
  insertMany(tweets);
  return tweets.length;
}

async function seedKeyword(keyword) {
  const tweets = isDemo()
    ? generateHistoricalTweets(keyword, 60)
    : await searchTweets(keyword);
  const n = insertTweets(tweets);
  console.log(`Seeded ${n} tweets for "${keyword}"`);
}

async function pollAll() {
  const db = getDb();
  const keywords = db.prepare('SELECT keyword FROM keywords WHERE active = 1').all();
  if (keywords.length === 0) return;

  for (const { keyword } of keywords) {
    try {
      const tweets = isDemo()
        ? generateRecentTweets(keyword, Math.floor(Math.random() * 5) + 2)
        : await searchTweets(keyword);
      const n = insertTweets(tweets);
      console.log(`Polled ${n} tweets for "${keyword}"`);
    } catch (err) {
      console.error(`Poll error for "${keyword}":`, err.message);
    }
  }
}

function startScheduler() {
  const interval = Math.max(1, parseInt(process.env.POLL_INTERVAL_MINUTES ?? '15', 10));
  const mode = isDemo() ? 'DEMO' : 'Twitter';
  cron.schedule(`*/${interval} * * * *`, pollAll);
  console.log(`Scheduler started (${mode} mode, every ${interval} min)`);
}

module.exports = { startScheduler, seedKeyword, pollAll };
