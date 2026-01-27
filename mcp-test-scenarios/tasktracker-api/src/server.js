require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');

const app = express();
app.use(express.json());

// Configure DynamoDB
// In local development, use DynamoDB Local endpoint
// In production, this will use AWS DynamoDB
const dynamoDb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || undefined, // Set to 'http://localhost:8000' for local
});

const TABLE_NAME = process.env.TABLE_NAME || 'tasks';

// GET /tasks - List all tasks
app.get('/tasks', async (req, res) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const result = await dynamoDb.scan(params).promise();
    res.json({
      tasks: result.Items || [],
      count: result.Count || 0,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks - Create a new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: description || '',
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const params = {
      TableName: TABLE_NAME,
      Item: task,
    };

    await dynamoDb.put(params).promise();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// GET /tasks/:id - Get a specific task
app.get('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    const result = await dynamoDb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.Item);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const params = {
      TableName: TABLE_NAME,
      Key: { id },
    };

    await dynamoDb.delete(params).promise();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tasktracker-api' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TaskTracker API running on port ${PORT}`);
  console.log(`DynamoDB endpoint: ${process.env.DYNAMODB_ENDPOINT || 'AWS (production)'}`);
  console.log(`Table name: ${TABLE_NAME}`);
});
