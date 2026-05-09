const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const { granularity = 'hour', hours = '24' } = req.query;
  const db = getDb();

  const fmt = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m-%d %H:00';
  const since = new Date(Date.now() - parseInt(hours, 10) * 3600000).toISOString();

  const rows = db.prepare(`
    SELECT
      keyword,
      strftime('${fmt}', created_at) AS period,
      COUNT(*) AS count,
      SUM(like_count) AS total_likes,
      SUM(retweet_count) AS total_retweets
    FROM tweets
    WHERE created_at >= ?
    GROUP BY keyword, period
    ORDER BY period ASC
  `).all(since);

  const keywords = [...new Set(rows.map(r => r.keyword))];
  const periods = [...new Set(rows.map(r => r.period))].sort();

  const data = periods.map(period => {
    const entry = { period };
    for (const kw of keywords) {
      const row = rows.find(r => r.period === period && r.keyword === kw);
      entry[kw] = row?.count ?? 0;
    }
    return entry;
  });

  const summary = {};
  for (const kw of keywords) {
    const kwRows = rows.filter(r => r.keyword === kw);
    summary[kw] = {
      total: kwRows.reduce((s, r) => s + r.count, 0),
      totalLikes: kwRows.reduce((s, r) => s + (r.total_likes ?? 0), 0),
      totalRetweets: kwRows.reduce((s, r) => s + (r.total_retweets ?? 0), 0),
    };
  }

  res.json({ keywords, periods, data, summary });
});

module.exports = router;
