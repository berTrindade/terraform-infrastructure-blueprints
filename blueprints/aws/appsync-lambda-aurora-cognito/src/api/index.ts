/**
 * AppSync GraphQL Resolver Handler for Aurora Serverless v2
 * 
 * This handler processes AppSync resolver events and connects to Aurora Serverless v2 PostgreSQL.
 * Uses IAM Database Authentication for secure, passwordless database access.
 * 
 * GraphQL Operations:
 *   Query.getUser(id: ID!) - Get user by ID
 *   Query.listUsers(limit, nextToken) - List users with pagination
 *   Mutation.createUser(input: UserInput!) - Create new user
 *   Mutation.updateUser(id, input) - Update user
 *   Mutation.deleteUser(id) - Delete user
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { Signer } from '@aws-sdk/rds-signer';
import { Client } from 'pg';

// Environment variables
const DB_SECRET_ARN = process.env.DB_SECRET_ARN!;
const DB_HOST = process.env.DB_HOST!;
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_NAME = process.env.DB_NAME || 'app';
const CLUSTER_RESOURCE_ID = process.env.CLUSTER_RESOURCE_ID!;

// AWS clients
const secretsClient = new SecretsManagerClient({});
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Cache for database connection metadata
let cachedDbMetadata: any = null;

/**
 * AppSync resolver event structure
 */
interface AppSyncEvent {
  info: {
    fieldName: string;
    parentTypeName: string;
  };
  arguments: {
    id?: string;
    input?: {
      email: string;
      name?: string;
    };
    limit?: number;
    nextToken?: string;
  };
  identity?: {
    sub: string;
    username: string;
    claims: Record<string, any>;
  };
  request: {
    headers: Record<string, string>;
  };
  stash: Record<string, any>;
}

/**
 * Get database connection metadata from Secrets Manager
 */
async function getDbMetadata() {
  if (cachedDbMetadata) {
    return cachedDbMetadata;
  }

  const command = new GetSecretValueCommand({ SecretId: DB_SECRET_ARN });
  const response = await secretsClient.send(command);
  cachedDbMetadata = JSON.parse(response.SecretString!);
  return cachedDbMetadata;
}

/**
 * Create a database connection using IAM Database Authentication
 */
async function getDbClient() {
  const metadata = await getDbMetadata();
  const username = metadata.username || 'postgres';
  const hostname = DB_HOST || metadata.host;
  const port = DB_PORT || metadata.port;
  
  // Generate IAM auth token using RDS Signer
  const signer = new Signer({
    hostname,
    port,
    username,
    region: awsRegion,
  });
  
  const token = await signer.getAuthToken();
  
  const client = new Client({
    host: hostname,
    port: port,
    database: DB_NAME || metadata.dbname,
    user: username,
    password: token, // IAM auth token instead of password
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000, // Aurora may need time to scale up
  });

  await client.connect();
  return client;
}

/**
 * Initialize database schema
 */
async function initializeSchema(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);
}

/**
 * Get user by ID
 */
async function getUser(client: Client, id: string) {
  const result = await client.query(
    'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error(`User with id ${id} not found`);
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}

/**
 * List users with pagination
 */
async function listUsers(client: Client, limit: number = 20, nextToken?: string) {
  const limitValue = Math.min(limit || 20, 100);
  const offset = nextToken ? parseInt(Buffer.from(nextToken, 'base64').toString()) : 0;

  const result = await client.query(
    `SELECT id, email, name, created_at, updated_at 
     FROM users 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limitValue, offset]
  );

  const items = result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }));

  const nextOffset = offset + limitValue;
  const countResult = await client.query('SELECT COUNT(*) FROM users');
  const total = parseInt(countResult.rows[0].count);
  const hasMore = nextOffset < total;

  return {
    items,
    nextToken: hasMore ? Buffer.from(nextOffset.toString()).toString('base64') : null,
  };
}

/**
 * Create a new user
 */
async function createUser(client: Client, input: { email: string; name?: string }) {
  const { email, name } = input;

  if (!email) {
    throw new Error('Email is required');
  }

  const result = await client.query(
    `INSERT INTO users (email, name) 
     VALUES ($1, $2) 
     RETURNING id, email, name, created_at, updated_at`,
    [email, name || null]
  );

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}

/**
 * Update user
 */
async function updateUser(
  client: Client,
  id: string,
  input: { email?: string; name?: string }
) {
  // Check if user exists
  const existsResult = await client.query(
    'SELECT id FROM users WHERE id = $1',
    [id]
  );

  if (existsResult.rows.length === 0) {
    throw new Error(`User with id ${id} not found`);
  }

  const result = await client.query(
    `UPDATE users 
     SET email = COALESCE($1, email),
         name = COALESCE($2, name),
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, email, name, created_at, updated_at`,
    [input.email, input.name, id]
  );

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}

/**
 * Delete user
 */
async function deleteUser(client: Client, id: string) {
  const result = await client.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new Error(`User with id ${id} not found`);
  }

  return true;
}

/**
 * Main AppSync Lambda resolver handler
 */
export const handler = async (event: AppSyncEvent) => {
  console.log('AppSync Event:', JSON.stringify(event, null, 2));

  const { info, arguments: args } = event;
  const { fieldName, parentTypeName } = info;

  let client: Client | null = null;

  try {
    client = await getDbClient();
    
    // Initialize schema on first call
    await initializeSchema(client);

    let result: any;

    // Route based on GraphQL operation
    if (parentTypeName === 'Query') {
      if (fieldName === 'getUser') {
        if (!args.id) {
          throw new Error('ID is required');
        }
        result = await getUser(client, args.id);
      } else if (fieldName === 'listUsers') {
        result = await listUsers(client, args.limit, args.nextToken);
      } else {
        throw new Error(`Unknown query field: ${fieldName}`);
      }
    } else if (parentTypeName === 'Mutation') {
      if (fieldName === 'createUser') {
        if (!args.input) {
          throw new Error('Input is required');
        }
        result = await createUser(client, args.input);
      } else if (fieldName === 'updateUser') {
        if (!args.id || !args.input) {
          throw new Error('ID and input are required');
        }
        result = await updateUser(client, args.id, args.input);
      } else if (fieldName === 'deleteUser') {
        if (!args.id) {
          throw new Error('ID is required');
        }
        result = await deleteUser(client, args.id);
      } else {
        throw new Error(`Unknown mutation field: ${fieldName}`);
      }
    } else {
      throw new Error(`Unknown parent type: ${parentTypeName}`);
    }

    return result;
  } catch (error: any) {
    console.error('Error:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
};
