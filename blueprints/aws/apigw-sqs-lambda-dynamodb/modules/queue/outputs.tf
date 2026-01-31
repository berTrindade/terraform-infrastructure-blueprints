# modules/queue/outputs.tf
# Queue module outputs
# Based on terraform-skill module-patterns (output best practices)

output "queue_url" {
  description = "URL of the main SQS queue"
  value       = aws_sqs_queue.this.url
}

output "queue_arn" {
  description = "ARN of the main SQS queue"
  value       = aws_sqs_queue.this.arn
}

output "queue_name" {
  description = "Name of the main SQS queue"
  value       = aws_sqs_queue.this.name
}

output "dlq_url" {
  description = "URL of the dead-letter queue"
  value       = aws_sqs_queue.dlq.url
}

output "dlq_arn" {
  description = "ARN of the dead-letter queue"
  value       = aws_sqs_queue.dlq.arn
}

output "dlq_name" {
  description = "Name of the dead-letter queue"
  value       = aws_sqs_queue.dlq.name
}

output "send_message_policy_json" {
  description = "IAM policy document JSON for sending messages (attach to producer role)"
  value       = data.aws_iam_policy_document.send_message.json
}

output "receive_message_policy_json" {
  description = "IAM policy document JSON for receiving messages (attach to consumer role)"
  value       = data.aws_iam_policy_document.receive_message.json
}
