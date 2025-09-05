const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
}

export default async function handler(req, res) {
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
    return res.status(200).json({ balance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch balance' });
  }
}
