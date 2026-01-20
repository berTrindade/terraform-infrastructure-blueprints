# modules/hosting/main.tf
# AWS Amplify Hosting

resource "aws_amplify_app" "this" {
  name       = var.app_name
  repository = var.repository_url

  # Build settings
  build_spec = var.build_spec != null ? var.build_spec : <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: ${var.build_output_directory}
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # Environment variables
  dynamic "environment_variables" {
    for_each = var.environment_variables
    content {
      # Flattened iteration
    }
  }

  # Cognito integration
  environment_variables = merge(
    {
      REACT_APP_USER_POOL_ID        = var.cognito_user_pool_id
      REACT_APP_USER_POOL_CLIENT_ID = var.cognito_client_id
      REACT_APP_AWS_REGION          = var.aws_region
    },
    var.environment_variables
  )

  # Custom rules (SPA routing)
  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    target = "/index.html"
    status = "200"
  }

  # Platform
  platform = "WEB"

  # Auto branch creation
  enable_auto_branch_creation   = var.enable_auto_branch_creation
  enable_branch_auto_build      = var.enable_branch_auto_build
  enable_branch_auto_deletion   = var.enable_branch_auto_deletion

  dynamic "auto_branch_creation_config" {
    for_each = var.enable_auto_branch_creation ? [1] : []
    content {
      enable_auto_build           = true
      enable_pull_request_preview = var.enable_pull_request_preview
      framework                   = var.framework
    }
  }

  tags = var.tags
}

# Main branch
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.main_branch_name

  framework = var.framework
  stage     = "PRODUCTION"

  environment_variables = var.branch_environment_variables

  tags = var.tags
}

# Webhook for automatic deployments
resource "aws_amplify_webhook" "main" {
  count = var.create_webhook ? 1 : 0

  app_id      = aws_amplify_app.this.id
  branch_name = aws_amplify_branch.main.branch_name
  description = "Trigger deployment on push"
}
