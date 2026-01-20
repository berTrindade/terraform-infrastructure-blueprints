# modules/tagging/outputs.tf

output "tags" {
  description = "Map of tags to apply to all resources"
  value       = local.tags
}
