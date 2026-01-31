# modules/hosting/outputs.tf

output "app_id" {
  value = aws_amplify_app.this.id
}

output "app_arn" {
  value = aws_amplify_app.this.arn
}

output "default_domain" {
  value = aws_amplify_app.this.default_domain
}

output "app_url" {
  value = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.this.default_domain}"
}

output "branch_name" {
  value = aws_amplify_branch.main.branch_name
}

output "webhook_url" {
  value     = var.create_webhook ? aws_amplify_webhook.main[0].url : null
  sensitive = true
}
