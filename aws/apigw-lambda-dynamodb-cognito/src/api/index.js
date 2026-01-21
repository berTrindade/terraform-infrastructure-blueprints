/**
 * REST API CRUD Handler with Cognito Authentication
 * User ID extracted from JWT claims for per-user data isolation
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE;

// Extract user ID from JWT claims
function getUserId(event) {
  return event.requestContext?.authorizer?.jwt?.claims?.sub;
}

async function createItem(userId, body) {
  const { name, description, data } = body;
  
  if (!name) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name is required' }) };
  }

  const item = {
    id: randomUUID(),
    userId,
    name,
    description: description || null,
    data: data || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  return { statusCode: 201, body: JSON.stringify(item) };
}

async function listItems(userId) {
  // Query items for this user only
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'userId-index',
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ items: result.Items || [], count: result.Count }),
  };
}

async function getItem(userId, id) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  if (!result.Item || result.Item.userId !== userId) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Item not found' }) };
  }

  return { statusCode: 200, body: JSON.stringify(result.Item) };
}

async function updateItem(userId, id, body) {
  // Verify ownership
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  if (!existing.Item || existing.Item.userId !== userId) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Item not found' }) };
  }

  const { name, description, data } = body;
  const updateExpressions = ['updatedAt = :updatedAt'];
  const expressionAttributeNames = {};
  const expressionAttributeValues = { ':updatedAt': new Date().toISOString() };

  if (name !== undefined) {
    updateExpressions.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = name;
  }
  if (description !== undefined) {
    updateExpressions.push('description = :description');
    expressionAttributeValues[':description'] = description;
  }
  if (data !== undefined) {
    updateExpressions.push('#data = :data');
    expressionAttributeNames['#data'] = 'data';
    expressionAttributeValues[':data'] = data;
  }

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));

  return { statusCode: 200, body: JSON.stringify(result.Attributes) };
}

async function deleteItem(userId, id) {
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  if (!existing.Item || existing.Item.userId !== userId) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Item not found' }) };
  }

  await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));

  return { statusCode: 204, body: '' };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const userId = getUserId(event);
  if (!userId) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const { routeKey } = event.requestContext || {};
  const method = routeKey?.split(' ')[0];
  const path = event.rawPath;
  const pathParameters = event.pathParameters || {};

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

  try {
    let response;

    if (method === 'POST' && path === '/items') {
      response = await createItem(userId, body);
    } else if (method === 'GET' && path === '/items') {
      response = await listItems(userId);
    } else if (method === 'GET' && pathParameters.id) {
      response = await getItem(userId, pathParameters.id);
    } else if (method === 'PUT' && pathParameters.id) {
      response = await updateItem(userId, pathParameters.id, body);
    } else if (method === 'DELETE' && pathParameters.id) {
      response = await deleteItem(userId, pathParameters.id);
    } else {
      response = { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) };
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
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
