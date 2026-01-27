/**
 * Sample Azure Function - HTTP Trigger
 * This is a basic example function that connects to PostgreSQL
 */

const { Client } = require('pg');

module.exports = async function (context, req) {
  context.log('HTTP trigger function processed a request.');

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time');
    
    context.res = {
      status: 200,
      body: {
        message: 'Successfully connected to PostgreSQL',
        currentTime: result.rows[0].current_time
      }
    };
  } catch (error) {
    context.log.error('Database connection error:', error);
    context.res = {
      status: 500,
      body: {
        error: 'Database connection failed',
        message: error.message
      }
    };
  } finally {
    await client.end();
  }
};
