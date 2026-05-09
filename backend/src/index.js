require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startScheduler } = require('./scheduler');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/keywords', require('./routes/keywords'));
app.use('/api/tweets', require('./routes/tweets'));
app.use('/api/metrics', require('./routes/metrics'));

app.get('/api/status', (req, res) => {
  const demo = process.env.DEMO_MODE === 'true' || !process.env.TWITTER_BEARER_TOKEN;
  res.json({ mode: demo ? 'demo' : 'twitter', ok: true });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`buzzreader backend on http://localhost:${PORT}`);
  startScheduler();
});
