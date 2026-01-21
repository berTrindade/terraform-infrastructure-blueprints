/**
 * Audit Logger Lambda
 *
 * Subscriber that logs all events for audit/compliance purposes.
 * Demonstrates independent consumer in EDA fan-out pattern.
 *
 * Event flow:
 * 1. API Gateway publishes event to SNS topic
 * 2. SNS fans out to this consumer's SQS queue
 * 3. This Lambda writes immutable audit record
 *
 * Key EDA principles demonstrated:
 * - Receives ALL events (no filter policy)
 * - Append-only audit log (immutable)
 * - Independent failure domain
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client (if AUDIT_TABLE is configured)
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const AUDIT_TABLE = process.env.AUDIT_TABLE;

/**
 * Parse SNS/SQS message to extract event
 */
function parseEvent(record) {
  try {
    const body = JSON.parse(record.body);
    return { valid: true, event: body };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Write audit record
 * In production, this writes to DynamoDB, S3, or audit service
 */
async function writeAuditRecord(event, sqsMessageId) {
  const auditRecord = {
    id: `audit-${event.eventId || sqsMessageId}`,
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: event.timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    sqsMessageId,
    data: event.data,
    // Audit metadata
    source: 'sns-fanout-api',
    version: '1.0',
  };

  if (AUDIT_TABLE) {
    // Write to DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: AUDIT_TABLE,
        Item: auditRecord,
        // Idempotent: won't overwrite if exists
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );
    console.log(`Audit record written to DynamoDB: ${auditRecord.id}`);
  } else {
    // Log to CloudWatch (structured logging)
    console.log(`AUDIT_RECORD: ${JSON.stringify(auditRecord)}`);
  }

  return auditRecord;
}

/**
 * Process a single SQS record
 */
async function processRecord(record) {
  const messageId = record.messageId;
  console.log(`Processing message: ${messageId}`);

  const parseResult = parseEvent(record);
  if (!parseResult.valid) {
    console.error(`Invalid message: ${parseResult.error}`);
    return;
  }

  const event = parseResult.event;

  // Audit logger receives ALL events (no filtering)
  console.log(`Auditing event: ${event.eventId}, type: ${event.eventType}`);

  try {
    await writeAuditRecord(event, messageId);
    console.log(`Successfully audited event: ${event.eventId}`);
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      // Already audited (idempotent)
      console.log(`Event already audited: ${event.eventId}`);
    } else {
      throw error;
    }
  }
}

/**
 * Main handler
 */
export async function handler(event) {
  console.log(`Audit Logger: Processing ${event.Records.length} messages`);

  const results = await Promise.allSettled(
    event.Records.map((record) => processRecord(record))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`Batch complete: ${succeeded} succeeded, ${failed} failed`);

  const batchItemFailures = event.Records.filter(
    (_, index) => results[index].status === 'rejected'
  ).map((record) => ({
    itemIdentifier: record.messageId,
  }));

  return { batchItemFailures };
}
