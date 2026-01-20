/**
 * Worker Lambda
 *
 * Triggered by SQS messages (API Gateway → SQS → Worker):
 * 1. Receives raw request body from SQS (sent directly by API Gateway)
 * 2. Creates command record in DynamoDB with PENDING status
 * 3. Performs "heavy work" (simulated)
 * 4. Updates DynamoDB with COMPLETED or FAILED status
 *
 * Benefits:
 * - Lower latency (no intermediate Lambda)
 * - Lower cost (one less Lambda invocation)
 * - Client gets SQS message ID as confirmation
 */

import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// Initialize clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

// Environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE;
const EXTERNAL_API_SECRET_ARN = process.env.EXTERNAL_API_SECRET_ARN;

// Cache for secrets
let cachedSecrets = null;

/**
 * Get secret from Secrets Manager (with caching)
 * This is Flow B: secrets seeded externally, read at runtime
 */
async function getSecret(secretArn) {
  if (!secretArn) return null;

  if (cachedSecrets?.[secretArn]) {
    return cachedSecrets[secretArn];
  }

  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );
    const secret = JSON.parse(response.SecretString);

    cachedSecrets = cachedSecrets || {};
    cachedSecrets[secretArn] = secret;

    return secret;
  } catch (error) {
    console.error('Failed to retrieve secret:', error.message);
    return null;
  }
}

/**
 * Parse and validate the incoming message body
 */
function parseMessageBody(messageBody) {
  try {
    const body = JSON.parse(messageBody);

    if (typeof body.input === 'undefined') {
      return { valid: false, error: 'input field is required' };
    }

    return { valid: true, data: body };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON body' };
  }
}

/**
 * Create command record in DynamoDB
 */
async function createCommand(commandId, input, sqsMessageId) {
  const createdAt = new Date().toISOString();

  const command = {
    id: commandId,
    sqsMessageId,
    status: 'PENDING',
    input,
    createdAt,
    updatedAt: createdAt,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: command,
      ConditionExpression: 'attribute_not_exists(id)',
    })
  );

  console.log(`Command created: ${commandId}`);
  return command;
}

/**
 * Simulate heavy work
 * In a real application, this would be:
 * - Processing a file
 * - Calling external APIs
 * - Running complex calculations
 * - Generating reports
 */
async function performWork(commandId, input) {
  console.log(`Starting work for command ${commandId}`);

  // Simulate work duration (1-3 seconds)
  const workDuration = 1000 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, workDuration));

  // Optional: Use external API secret for real work
  if (EXTERNAL_API_SECRET_ARN) {
    const secret = await getSecret(EXTERNAL_API_SECRET_ARN);
    if (secret && !secret._placeholder) {
      console.log('Using external API credentials for processing');
      // Example: Call external API with secret.api_key
    }
  }

  // Simulate occasional failures (10% chance) for testing retry logic
  if (Math.random() < 0.1) {
    throw new Error('Simulated processing failure');
  }

  // Return result
  return {
    processedAt: new Date().toISOString(),
    duration: Math.round(workDuration),
    input,
    result: `Processed: ${JSON.stringify(input)}`,
  };
}

/**
 * Update command status in DynamoDB
 */
async function updateCommandStatus(commandId, status, result = null, error = null) {
  const updateExpression = ['SET #status = :status', '#updatedAt = :updatedAt'];
  const expressionAttributeNames = {
    '#status': 'status',
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues = {
    ':status': status,
    ':updatedAt': new Date().toISOString(),
  };

  if (result) {
    updateExpression.push('#result = :result');
    expressionAttributeNames['#result'] = 'result';
    expressionAttributeValues[':result'] = result;
  }

  if (error) {
    updateExpression.push('#error = :error');
    expressionAttributeNames['#error'] = 'error';
    expressionAttributeValues[':error'] = error;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: commandId },
      UpdateExpression: updateExpression.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  console.log(`Command ${commandId} updated to ${status}`);
}

/**
 * Process a single SQS record
 * Record contains raw request body from API Gateway
 */
async function processRecord(record) {
  const sqsMessageId = record.messageId;

  console.log(`Processing SQS message: ${sqsMessageId}`);

  // Parse the message body (raw request from API Gateway)
  const parseResult = parseMessageBody(record.body);

  if (!parseResult.valid) {
    console.error(`Invalid message body: ${parseResult.error}`);
    // Don't retry invalid messages - they'll never succeed
    return;
  }

  const { input } = parseResult.data;

  // Generate a command ID (since we no longer have the command handler Lambda)
  const commandId = randomUUID();

  try {
    // Create the command record in DynamoDB
    await createCommand(commandId, input, sqsMessageId);

    // Update status to PROCESSING
    await updateCommandStatus(commandId, 'PROCESSING');

    // Perform the actual work
    const result = await performWork(commandId, input);

    // Update status to COMPLETED
    await updateCommandStatus(commandId, 'COMPLETED', result);

    console.log(`Command ${commandId} completed successfully`);
  } catch (error) {
    console.error(`Error processing command ${commandId}:`, error);

    // Update status to FAILED (only if record was created)
    try {
      await updateCommandStatus(commandId, 'FAILED', null, error.message);
    } catch (updateError) {
      console.error(`Failed to update command status: ${updateError.message}`);
    }

    // Re-throw to trigger SQS retry → eventually DLQ
    throw error;
  }
}

/**
 * Main handler
 * Processes batch of SQS messages
 */
export async function handler(event) {
  console.log(`Processing ${event.Records.length} messages`);

  // Process all records
  // Note: For partial batch failure handling, use reportBatchItemFailures
  const results = await Promise.allSettled(
    event.Records.map((record) => processRecord(record))
  );

  // Log results
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Batch complete: ${succeeded} succeeded, ${failed} failed`);

  // Return batch item failures for partial retry
  const batchItemFailures = event.Records.filter(
    (_, index) => results[index].status === 'rejected'
  ).map((record) => ({
    itemIdentifier: record.messageId,
  }));

  return { batchItemFailures };
}
