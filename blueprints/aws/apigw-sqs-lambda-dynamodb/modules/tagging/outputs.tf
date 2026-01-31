# modules/tagging/outputs.tf
# Tagging module outputs
# Based on terraform-skill module-patterns (output best practices)

output "tags" {
  description = "Standard tags to apply to all resources"
  value       = local.tags
}

output "test_tags" {
  description = "Tags including TTL for test/dev resources (for auto-cleanup)"
  value       = local.test_tags
}

output "default_tags" {
  description = "Default tags without additional tags merged"
  value       = local.default_tags
}
