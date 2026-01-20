/**
 * Notifier Lambda (EventBridge version)
 *
 * Consumer that sends notifications for specific events.
 * Demonstrates content-based routing with EventBridge patterns.
 *
 * Event flow:
 * 1. API Gateway puts event to EventBridge bus
 * 2. EventBridge rule with content filter routes matching events
 * 3. This Lambda sends notifications
 *
 * Key EDA principles demonstrated:
 * - Content-based filtering (EventBridge rule patterns)
 * - Side effect (notification) is independent
 * - Failure doesn't block other consumers
 */

const NOTIFICATION_WEBHOOK = process.env.NOTIFICATION_WEBHOOK;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

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
          ...body.detail,
        },
      };
    }

    return { valid: true, event: body };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Send notification
 */
async function sendNotification(event) {
  const { eventId, source, detailType, reportId, userId, reportType } = event;

  const notification = {
    eventId,
    source,
    detailType,
    message: buildMessage(detailType, event),
    timestamp: new Date().toISOString(),
  };

  // Simulate notification delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`NOTIFICATION: ${JSON.stringify(notification)}`);

  if (NOTIFICATION_WEBHOOK) {
    console.log(`Would POST to webhook: ${NOTIFICATION_WEBHOOK}`);
  }

  if (SLACK_WEBHOOK) {
    console.log(`Would POST to Slack: ${SLACK_WEBHOOK}`);
  }

  return notification;
}

/**
 * Build human-readable message
 */
function buildMessage(detailType, event) {
  switch (detailType) {
    case 'ReportRequested':
      return `Report requested: ${event.reportType} for user ${event.userId}`;
    case 'ReportGenerated':
      return `Report ready: ${event.reportId} is available for download`;
    case 'ReportFailed':
      return `Report failed: ${event.reportId} - ${event.error}`;
    default:
      return `Event received: ${detailType} from ${event.source}`;
  }
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

  // Note: EventBridge rule already filters, but we can add app-level checks
  console.log(`Sending notification for event: ${event.eventId}, type: ${event.detailType}`);

  await sendNotification(event);

  console.log(`Successfully notified for event: ${event.eventId}`);
}

/**
 * Main handler
 */
export async function handler(event) {
  console.log(`Notifier (EventBridge): Processing ${event.Records.length} messages`);

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
