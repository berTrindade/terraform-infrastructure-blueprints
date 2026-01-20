/**
 * REST API CRUD Handler for Serverless API with Aurora Serverless v2
 * 
 * This handler connects to Aurora Serverless v2 PostgreSQL, which provides:
 * - Auto-scaling capacity (0.5 - 128 ACUs)
 * - Pay-per-use when idle
 * - Built-in connection management
 * 
 * Endpoints:
 *   POST   /items      - Create item
 *   GET    /items      - List all items
 *   GET    /items/{id} - Get item by ID
 *   PUT    /items/{id} - Update item
 *   DELETE /items/{id} - Delete item
 */

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const { Client } = require('pg');

// Environment variables
const DB_SECRET_ARN = process.env.DB_SECRET_ARN;
const DB_HOST = process.env.DB_HOST; // Aurora cluster endpoint
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'app';

// Secrets Manager client
const secretsClient = new SecretsManagerClient({});

// Cache for database credentials
let cachedCredentials = null;

/**
 * Get database credentials from Secrets Manager
 */
async function getDbCredentials() {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const command = new GetSecretValueCommand({ SecretId: DB_SECRET_ARN });
  const response = await secretsClient.send(command);
  cachedCredentials = JSON.parse(response.SecretString);
  return cachedCredentials;
}

/**
 * Create a database connection (to Aurora Serverless v2)
 * Aurora handles scaling automatically based on load
 */
async function getDbClient() {
  const credentials = await getDbCredentials();
  
  const client = new Client({
    host: DB_HOST || credentials.host,
    port: parseInt(DB_PORT) || credentials.port,
    database: DB_NAME || credentials.dbname,
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // Aurora may need time to scale up
  });

  await client.connect();
  return client;
}

/**
 * Initialize database schema
 */
async function initializeSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      data JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

/**
 * Create a new item
 */
async function createItem(client, body) {
  const { name, description, data } = body;
  
  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Name is required' }),
    };
  }

  const result = await client.query(
    `INSERT INTO items (name, description, data) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [name, description || null, JSON.stringify(data || {})]
  );

  return {
    statusCode: 201,
    body: JSON.stringify(result.rows[0]),
  };
}

/**
 * List all items
 */
async function listItems(client, queryParams) {
  const limit = Math.min(parseInt(queryParams?.limit) || 100, 1000);
  const offset = parseInt(queryParams?.offset) || 0;

  const result = await client.query(
    `SELECT * FROM items ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await client.query('SELECT COUNT(*) FROM items');
  const total = parseInt(countResult.rows[0].count);

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: result.rows,
      total,
      limit,
      offset,
    }),
  };
}

/**
 * Get item by ID
 */
async function getItem(client, id) {
  const result = await client.query(
    'SELECT * FROM items WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Item not found' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.rows[0]),
  };
}

/**
 * Update item
 */
async function updateItem(client, id, body) {
  const { name, description, data } = body;

  // Check if item exists
  const existsResult = await client.query(
    'SELECT id FROM items WHERE id = $1',
    [id]
  );

  if (existsResult.rows.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Item not found' }),
    };
  }

  const result = await client.query(
    `UPDATE items 
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         data = COALESCE($3, data),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [name, description, data ? JSON.stringify(data) : null, id]
  );

  return {
    statusCode: 200,
    body: JSON.stringify(result.rows[0]),
  };
}

/**
 * Delete item
 */
async function deleteItem(client, id) {
  const result = await client.query(
    'DELETE FROM items WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Item not found' }),
    };
  }

  return {
    statusCode: 204,
    body: '',
  };
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, routeKey } = event.requestContext || {};
  const method = httpMethod || routeKey?.split(' ')[0];
  const path = event.rawPath || event.path;
  const pathParameters = event.pathParameters || {};
  const queryStringParameters = event.queryStringParameters || {};
  
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.isBase64Encoded 
        ? Buffer.from(event.body, 'base64').toString() 
        : event.body);
    } catch (e) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON body' }),
      };
    }
  }

  let client;
  try {
    client = await getDbClient();
    
    // Initialize schema on first call
    await initializeSchema(client);

    let response;

    // Route handling
    if (method === 'POST' && path === '/items') {
      response = await createItem(client, body);
    } else if (method === 'GET' && path === '/items') {
      response = await listItems(client, queryStringParameters);
    } else if (method === 'GET' && pathParameters.id) {
      response = await getItem(client, pathParameters.id);
    } else if (method === 'PUT' && pathParameters.id) {
      response = await updateItem(client, pathParameters.id, body);
    } else if (method === 'DELETE' && pathParameters.id) {
      response = await deleteItem(client, pathParameters.id);
    } else {
      response = {
        statusCode: 404,
        body: JSON.stringify({ error: 'Route not found' }),
      };
    }

    return {
      ...response,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        ...response.headers,
      },
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
