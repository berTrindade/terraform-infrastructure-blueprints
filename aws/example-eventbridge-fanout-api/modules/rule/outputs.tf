# modules/rule/outputs.tf
# Output values for EventBridge rule module

output "rule_arn" {
  description = "ARN of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.this.arn
}

output "rule_name" {
  description = "Name of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.this.name
}

output "rule_id" {
  description = "ID of the EventBridge rule"
  value       = aws_cloudwatch_event_rule.this.id
}
