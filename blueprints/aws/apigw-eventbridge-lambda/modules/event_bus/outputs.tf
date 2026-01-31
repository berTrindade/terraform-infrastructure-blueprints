# modules/event_bus/outputs.tf
# Output values for EventBridge event bus module

output "bus_arn" {
  description = "ARN of the EventBridge event bus"
  value       = aws_cloudwatch_event_bus.this.arn
}

output "bus_name" {
  description = "Name of the EventBridge event bus"
  value       = aws_cloudwatch_event_bus.this.name
}

output "archive_arn" {
  description = "ARN of the event archive"
  value       = var.enable_archive ? aws_cloudwatch_event_archive.this[0].arn : null
}

output "archive_name" {
  description = "Name of the event archive"
  value       = var.enable_archive ? aws_cloudwatch_event_archive.this[0].name : null
}
