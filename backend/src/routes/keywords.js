const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { seedKeyword } = require('../scheduler');

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT keyword, created_at FROM keywords WHERE active = 1 ORDER BY created_at DESC'
  ).all();
  res.json(rows);
});

router.post('/', async (req, res) => {
  const keyword = req.body.keyword?.trim();
  if (!keyword) return res.status(400).json({ error: 'keyword required' });

  const db = getDb();
  try {
    db.prepare('INSERT OR REPLACE INTO keywords (keyword, active) VALUES (?, 1)').run(keyword);
    seedKeyword(keyword).catch(err => console.error('Seed error:', err.message));
    res.json({ keyword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:keyword', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE keywords SET active = 0 WHERE keyword = ?').run(req.params.keyword);
  res.json({ ok: true });
});

module.exports = router;
