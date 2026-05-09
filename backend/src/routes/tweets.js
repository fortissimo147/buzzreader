const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const { keyword, limit = '50', offset = '0' } = req.query;
  const db = getDb();

  const whereClause = keyword ? 'WHERE keyword = ?' : '';
  const params = keyword
    ? [keyword, parseInt(limit), parseInt(offset)]
    : [parseInt(limit), parseInt(offset)];

  const rows = db.prepare(
    `SELECT * FROM tweets ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params);

  res.json(rows);
});

module.exports = router;
