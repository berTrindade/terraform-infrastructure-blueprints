// Lambda handler for Invoice API
// Currently uses mock/in-memory data storage
// TODO: Replace with actual database connection (RDS PostgreSQL)

// Mock data storage (in-memory)
let invoices = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    customerName: 'Acme Corp',
    amount: 1500.00,
    status: 'pending',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    customerName: 'Tech Solutions Inc',
    amount: 2500.00,
    status: 'paid',
    createdAt: '2024-01-16T14:30:00Z',
  },
];

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { routeKey, pathParameters, body } = event;
  const method = routeKey.split(' ')[0];
  const path = routeKey.split(' ')[1];

  try {
    // GET /invoices - List all invoices
    if (method === 'GET' && path === '/invoices') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoices,
          count: invoices.length,
        }),
      };
    }

    // POST /invoices - Create a new invoice
    if (method === 'POST' && path === '/invoices') {
      const invoiceData = JSON.parse(body || '{}');
      
      if (!invoiceData.invoiceNumber || !invoiceData.customerName || !invoiceData.amount) {
        return {
          statusCode: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Missing required fields: invoiceNumber, customerName, amount',
          }),
        };
      }

      const newInvoice = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customerName,
        amount: parseFloat(invoiceData.amount),
        status: invoiceData.status || 'pending',
        createdAt: new Date().toISOString(),
      };

      invoices.push(newInvoice);

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvoice),
      };
    }

    // GET /invoices/{id} - Get a specific invoice
    if (method === 'GET' && path.startsWith('/invoices/')) {
      const invoiceId = pathParameters?.id;
      const invoice = invoices.find((inv) => inv.id === invoiceId);

      if (!invoice) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Invoice not found',
          }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      };
    }

    // DELETE /invoices/{id} - Delete an invoice
    if (method === 'DELETE' && path.startsWith('/invoices/')) {
      const invoiceId = pathParameters?.id;
      const invoiceIndex = invoices.findIndex((inv) => inv.id === invoiceId);

      if (invoiceIndex === -1) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: 'Invoice not found',
          }),
        };
      }

      invoices.splice(invoiceIndex, 1);

      return {
        statusCode: 204,
        body: '',
      };
    }

    // 404 for unknown routes
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Route not found',
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};

// TODO: Replace mock data with actual database queries
// TODO: Add database connection using AWS RDS Data API or pg library
// TODO: Add Secrets Manager integration for database credentials
// Example:
// const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
// const { Client } = require('pg');
//
// async function getDbConnection() {
//   const secretsClient = new SecretsManagerClient({});
//   const secret = await secretsClient.send(
//     new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN })
//   );
//   const credentials = JSON.parse(secret.SecretString);
//
//   const client = new Client({
//     host: process.env.DB_ENDPOINT,
//     port: 5432,
//     database: process.env.DB_NAME,
//     user: credentials.username,
//     password: credentials.password,
//   });
//
//   await client.connect();
//   return client;
// }
