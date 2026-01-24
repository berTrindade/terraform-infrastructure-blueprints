# modules/auth/main.tf
# Cognito User Pool for AppSync GraphQL API authentication
# Supports passwordless email authentication (magic links)

resource "aws_cognito_user_pool" "this" {
  name = var.user_pool_name

  # Username configuration - email-based
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy (for passwordless, this is less critical but still configured)
  password_policy {
    minimum_length    = var.password_minimum_length
    require_lowercase = false
    require_uppercase = false
    require_numbers   = false
    require_symbols   = false
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = var.email_sending_account
    from_email_address    = var.from_email_address
    reply_to_email_address = var.reply_to_email_address
  }

  # User attributes
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # MFA configuration
  mfa_configuration = var.mfa_configuration

  # Lambda triggers for passwordless authentication
  # Note: For full passwordless implementation, you would configure
  # DefineAuthChallenge, CreateAuthChallenge, and VerifyAuthChallenge Lambda triggers
  # This is a simplified version - see AWS docs for full passwordless setup

  tags = var.tags
}

resource "aws_cognito_user_pool_client" "this" {
  name         = var.user_pool_client_name
  user_pool_id = aws_cognito_user_pool.this.id

  # Token configuration
  access_token_validity  = var.access_token_validity
  id_token_validity      = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Auth flows - supports passwordless and standard flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_CUSTOM_AUTH", # Required for passwordless
  ]

  # Security
  prevent_user_existence_errors = "ENABLED"
  generate_secret               = false

  # Callback URLs (for hosted UI if used)
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  supported_identity_providers = ["COGNITO"]
}

# Optional: Cognito Domain for hosted UI
resource "aws_cognito_user_pool_domain" "this" {
  count = var.create_domain ? 1 : 0

  domain       = var.domain_prefix != null ? var.domain_prefix : "${var.user_pool_name}-${random_id.domain_suffix[0].hex}"
  user_pool_id = aws_cognito_user_pool.this.id
}

resource "random_id" "domain_suffix" {
  count = var.create_domain && var.domain_prefix == null ? 1 : 0

  byte_length = 4
}
