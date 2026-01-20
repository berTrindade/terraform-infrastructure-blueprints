/**
 * REST API CRUD Handler for DynamoDB
 * Simplest serverless pattern - no VPC required
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE;

async function createItem(body) {
  const { name, description, data } = body;
  
  if (!name) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name is required' }) };
  }

  const item = {
    id: randomUUID(),
    name,
    description: description || null,
    data: data || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  return { statusCode: 201, body: JSON.stringify(item) };
}

async function listItems(queryParams) {
  const limit = Math.min(parseInt(queryParams?.limit) || 100, 1000);
  
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE_NAME,
    Limit: limit,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: result.Items || [],
      count: result.Count,
      scannedCount: result.ScannedCount,
    }),
  };
}

async function getItem(id) {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  if (!result.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Item not found' }) };
  }

  return { statusCode: 200, body: JSON.stringify(result.Item) };
}

async function updateItem(id, body) {
  const { name, description, data } = body;

  // Check if item exists
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  if (!existing.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Item not found' }) };
  }

  const updateExpressions = [];
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
  updateExpressions.push('updatedAt = :updatedAt');

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

async function deleteItem(id) {
  const existing = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  if (!existing.Item) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Item not found' }) };
  }

  await docClient.send(new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  }));

  return { statusCode: 204, body: '' };
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { routeKey } = event.requestContext || {};
  const method = routeKey?.split(' ')[0];
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

  try {
    let response;

    if (method === 'POST' && path === '/items') {
      response = await createItem(body);
    } else if (method === 'GET' && path === '/items') {
      response = await listItems(queryStringParameters);
    } else if (method === 'GET' && pathParameters.id) {
      response = await getItem(pathParameters.id);
    } else if (method === 'PUT' && pathParameters.id) {
      response = await updateItem(pathParameters.id, body);
    } else if (method === 'DELETE' && pathParameters.id) {
      response = await deleteItem(pathParameters.id);
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
