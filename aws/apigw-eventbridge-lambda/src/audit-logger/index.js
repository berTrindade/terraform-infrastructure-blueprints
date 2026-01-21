/**
 * Audit Logger Lambda (EventBridge version)
 *
 * Consumer that logs ALL events for audit/compliance purposes.
 * Demonstrates independent consumer receiving all event types.
 *
 * Event flow:
 * 1. API Gateway puts event to EventBridge bus
 * 2. EventBridge rule (catch-all pattern) routes to this queue
 * 3. This Lambda writes immutable audit record
 *
 * Key EDA principles demonstrated:
 * - Receives ALL events (catch-all rule pattern)
 * - Append-only audit log (immutable)
 * - Independent failure domain
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const AUDIT_TABLE = process.env.AUDIT_TABLE;

/**
 * Parse EventBridge event from SQS message
 */
function parseEvent(record) {
  try {
    const body = JSON.parse(record.body);

    if (body.detail) {
      return {
        valid: true,
        event: {
          source: body.source,
          detailType: body['detail-type'],
          eventId: body.id,
          timestamp: body.time,
          region: body.region,
          account: body.account,
          detail: body.detail,
        },
        rawEvent: body,
      };
    }

    return { valid: true, event: body, rawEvent: body };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Write audit record
 */
async function writeAuditRecord(event, rawEvent, sqsMessageId) {
  const auditRecord = {
    id: `audit-${event.eventId || sqsMessageId}`,
    eventId: event.eventId,
    source: event.source,
    detailType: event.detailType,
    timestamp: event.timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    sqsMessageId,
    detail: event.detail,
    // Store full EventBridge envelope for forensics
    rawEvent,
    // Audit metadata
    auditSource: 'eventbridge-fanout-api',
    version: '1.0',
  };

  if (AUDIT_TABLE) {
    await docClient.send(
      new PutCommand({
        TableName: AUDIT_TABLE,
        Item: auditRecord,
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );
    console.log(`Audit record written to DynamoDB: ${auditRecord.id}`);
  } else {
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

  const { event, rawEvent } = parseResult;

  // Audit logger receives ALL events
  console.log(`Auditing event: ${event.eventId}, type: ${event.detailType}, source: ${event.source}`);

  try {
    await writeAuditRecord(event, rawEvent, messageId);
    console.log(`Successfully audited event: ${event.eventId}`);
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
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
  console.log(`Audit Logger (EventBridge): Processing ${event.Records.length} messages`);

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
