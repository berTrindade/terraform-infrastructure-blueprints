# modules/tagging/outputs.tf
# Output values for tagging module

output "tags" {
  description = "Map of tags to apply to all resources"
  value       = local.tags
}

output "standard_tags" {
  description = "Map of standard tags only (without additional tags)"
  value       = local.standard_tags
}
