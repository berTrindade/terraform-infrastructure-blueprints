/**
 * PDF Generator Lambda
 *
 * Subscriber that generates PDF reports from ReportRequested events.
 * Demonstrates independent consumer in EDA fan-out pattern.
 *
 * Event flow:
 * 1. API Gateway publishes ReportRequested to SNS topic
 * 2. SNS fans out to this consumer's SQS queue
 * 3. This Lambda generates PDF and stores in S3 (simulated)
 *
 * Key EDA principles demonstrated:
 * - Consumer is independent (can fail without affecting others)
 * - Idempotent processing (uses eventId for deduplication)
 * - Own retry policy and DLQ
 */

/**
 * Parse SNS/SQS message to extract event
 */
function parseEvent(record) {
  try {
    // With raw_message_delivery=true, body is the original message
    const body = JSON.parse(record.body);
    return { valid: true, event: body };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Simulate PDF generation
 * In production, this would:
 * - Fetch report data from database
 * - Generate PDF using a library (e.g., PDFKit, Puppeteer)
 * - Upload to S3
 * - Optionally emit ReportGenerated event
 */
async function generatePdf(event) {
  const { eventId, data } = event;
  const { reportId, userId, reportType } = data;

  console.log(`Generating PDF for report ${reportId}, user ${userId}, type ${reportType}`);

  // Simulate PDF generation time (1-2 seconds)
  const duration = 1000 + Math.random() * 1000;
  await new Promise((resolve) => setTimeout(resolve, duration));

  // Simulate occasional failures (5% chance) for testing
  if (Math.random() < 0.05) {
    throw new Error('Simulated PDF generation failure');
  }

  // In production: upload to S3 and return URL
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
    // Don't retry invalid messages
    return;
  }

  const event = parseResult.event;

  // Validate event structure
  if (event.eventType !== 'ReportRequested') {
    console.log(`Ignoring event type: ${event.eventType}`);
    return;
  }

  // Idempotency check (in production, check DynamoDB/Redis)
  const eventId = event.eventId;
  console.log(`Processing event: ${eventId}`);

  // Generate PDF
  await generatePdf(event);

  console.log(`Successfully processed event: ${eventId}`);
}

/**
 * Main handler
 * Processes batch of SQS messages with partial batch failure support
 */
export async function handler(event) {
  console.log(`PDF Generator: Processing ${event.Records.length} messages`);

  const results = await Promise.allSettled(
    event.Records.map((record) => processRecord(record))
  );

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
