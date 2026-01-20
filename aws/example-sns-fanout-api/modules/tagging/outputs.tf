# modules/tagging/outputs.tf
# Output values for tagging module

output "tags" {
  description = "Standard tags for all resources"
  value       = local.tags
}

output "test_tags" {
  description = "Tags including TTL for test resources"
  value       = local.test_tags
}
