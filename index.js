const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
}

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/v1/credits', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id query param is required' });
  }
  if (!pool) {
    return res.status(500).json({ error: 'Database connection is not configured' });
  }
  try {
    const result = await pool.query('SELECT COALESCE(SUM(delta),0) AS balance FROM credits_ledger WHERE user_id = $1', [userId]);
    const balance = parseInt(result.rows[0].balance, 10);
    return res.json({ balance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
