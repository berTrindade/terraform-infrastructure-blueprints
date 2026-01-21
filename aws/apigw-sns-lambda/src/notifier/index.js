/**
 * Notifier Lambda
 *
 * Subscriber that sends notifications for events.
 * Demonstrates independent consumer in EDA fan-out pattern.
 *
 * Event flow:
 * 1. API Gateway publishes event to SNS topic
 * 2. SNS fans out to this consumer's SQS queue
 * 3. This Lambda sends notifications (email, Slack, webhook)
 *
 * Key EDA principles demonstrated:
 * - Can have filter policy (only certain event types)
 * - Side effect (notification) is independent
 * - Failure doesn't block other consumers
 */

const NOTIFICATION_WEBHOOK = process.env.NOTIFICATION_WEBHOOK;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

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
 * Send notification
 * In production, this would:
 * - Send email via SES
 * - Post to Slack
 * - Call webhook
 * - Push mobile notification
 */
async function sendNotification(event) {
  const { eventId, eventType, data } = event;

  const notification = {
    eventId,
    eventType,
    message: buildMessage(eventType, data),
    timestamp: new Date().toISOString(),
  };

  // Simulate notification delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Log notification (in production, send to actual service)
  console.log(`NOTIFICATION: ${JSON.stringify(notification)}`);

  // If webhook is configured, send HTTP request
  if (NOTIFICATION_WEBHOOK) {
    // In production: use fetch to POST to webhook
    console.log(`Would POST to webhook: ${NOTIFICATION_WEBHOOK}`);
  }

  if (SLACK_WEBHOOK) {
    // In production: post Slack message
    console.log(`Would POST to Slack: ${SLACK_WEBHOOK}`);
  }

  return notification;
}

/**
 * Build human-readable message
 */
function buildMessage(eventType, data) {
  switch (eventType) {
    case 'ReportRequested':
      return `Report requested: ${data.reportType} for user ${data.userId}`;
    case 'ReportGenerated':
      return `Report ready: ${data.reportId} is available for download`;
    default:
      return `Event received: ${eventType}`;
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

  // Could filter here, but better to use SNS filter policy
  console.log(`Sending notification for event: ${event.eventId}`);

  await sendNotification(event);

  console.log(`Successfully notified for event: ${event.eventId}`);
}

/**
 * Main handler
 */
export async function handler(event) {
  console.log(`Notifier: Processing ${event.Records.length} messages`);

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
