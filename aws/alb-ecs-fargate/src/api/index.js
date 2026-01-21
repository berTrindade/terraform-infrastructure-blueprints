/**
 * Simple Express API for ECS Fargate
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory store (use Redis/DynamoDB for production)
const items = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// List items
app.get('/items', (req, res) => {
  res.json({ items: Array.from(items.values()) });
});

// Create item
app.post('/items', (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  const item = {
    id,
    name,
    description: description || null,
    createdAt: new Date().toISOString(),
  };
  items.set(id, item);

  res.status(201).json(item);
});

// Get item
app.get('/items/:id', (req, res) => {
  const item = items.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

// Update item
app.put('/items/:id', (req, res) => {
  const item = items.get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const { name, description } = req.body;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  item.updatedAt = new Date().toISOString();

  items.set(req.params.id, item);
  res.json(item);
});

// Delete item
app.delete('/items/:id', (req, res) => {
  if (!items.has(req.params.id)) {
    return res.status(404).json({ error: 'Item not found' });
  }
  items.delete(req.params.id);
  res.status(204).send();
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
