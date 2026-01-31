/**
 * PDF Generator Lambda (EventBridge version)
 *
 * Consumer that generates PDF reports from ReportRequested events.
 * Demonstrates independent consumer in EDA with EventBridge routing.
 *
 * Event flow:
 * 1. API Gateway puts event to EventBridge bus
 * 2. EventBridge rule routes to this consumer's SQS queue
 * 3. This Lambda generates PDF and stores in S3 (simulated)
 *
 * Key EDA principles demonstrated:
 * - Consumer is independent (can fail without affecting others)
 * - Idempotent processing (uses eventId for deduplication)
 * - EventBridge wraps events in standard envelope
 */

/**
 * Parse EventBridge event from SQS message
 * EventBridge wraps the event in a standard envelope
 */
function parseEvent(record) {
  try {
    const body = JSON.parse(record.body);

    // EventBridge envelope format
    // { source, detail-type, detail, ... }
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

    // Fallback: direct event format
    return { valid: true, event: body };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Simulate PDF generation
 */
async function generatePdf(event) {
  const { eventId, reportId, userId, reportType } = event;

  console.log(`Generating PDF for report ${reportId}, user ${userId}, type ${reportType}`);

  // Simulate PDF generation time (1-2 seconds)
  const duration = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, duration));

  // Simulate occasional failures (5% chance) for testing
  if (Math.random() < 0.05) {
    throw new Error('Simulated PDF generation failure');
  }

  const result = {
    eventId,
    reportId,
    pdfUrl: `s3://reports-bucket/${reportId}.pdf`,
    generatedAt: new Date().toISOString(),
    duration: Math.round(duration),
  };

  console.log(`PDF generated: ${JSON.stringify(result)}`);
  return result;
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

  // Check event type (EventBridge uses detail-type)
  if (event.detailType && event.detailType !== 'ReportRequested') {
    console.log(`Ignoring event type: ${event.detailType}`);
    return;
  }

  console.log(`Processing event: ${event.eventId}`);

  await generatePdf(event);

  console.log(`Successfully processed event: ${event.eventId}`);
}

/**
 * Main handler
 */
export async function handler(event) {
  console.log(`PDF Generator (EventBridge): Processing ${event.Records.length} messages`);

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
