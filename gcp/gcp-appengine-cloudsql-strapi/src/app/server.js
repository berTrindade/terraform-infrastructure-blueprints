/**
 * Sample App Engine application with Cloud SQL PostgreSQL
 */

const express = require('express');
const { Client } = require('pg');

const app = express();
app.use(express.json());

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to database
client.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/db', async (req, res) => {
  try {
    const result = await client.query('SELECT NOW() as current_time');
    res.json({
      message: 'Successfully connected to PostgreSQL',
      currentTime: result.rows[0].current_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
