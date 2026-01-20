# environments/dev/main.tf

module "naming" {
  source      = "../../modules/naming"
  project     = var.project
  environment = var.environment
}

module "tagging" {
  source          = "../../modules/tagging"
  project         = var.project
  environment     = var.environment
  repository      = var.repository
  additional_tags = var.additional_tags
}

module "auth" {
  source                   = "../../modules/auth"
  user_pool_name           = module.naming.user_pool
  user_pool_client_name    = module.naming.user_pool_client
  password_minimum_length  = var.password_minimum_length
  password_require_symbols = var.password_require_symbols
  mfa_configuration        = var.mfa_configuration
  access_token_validity    = var.access_token_validity
  id_token_validity        = var.id_token_validity
  refresh_token_validity   = var.refresh_token_validity
  callback_urls            = var.callback_urls
  logout_urls              = var.logout_urls
  tags                     = module.tagging.tags
}

module "data" {
  source                        = "../../modules/data"
  table_name                    = module.naming.dynamodb_table
  billing_mode                  = var.dynamodb_billing_mode
  enable_point_in_time_recovery = var.enable_dynamodb_pitr
  tags                          = module.tagging.tags
}

module "api" {
  source              = "../../modules/api"
  api_name            = module.naming.api_gateway
  cors_allow_origins  = var.cors_allow_origins
  cognito_client_id   = module.auth.user_pool_client_id
  cognito_issuer_url  = module.auth.issuer_url
  function_name       = module.naming.api_lambda
  role_name           = module.naming.lambda_role
  log_group_name      = module.naming.log_group_api
  source_dir          = "${path.module}/../../src/api"
  memory_size         = var.lambda_memory_size
  timeout             = var.lambda_timeout
  dynamodb_table_name = module.data.table_name
  dynamodb_table_arn  = module.data.table_arn
  log_retention_days  = var.log_retention_days
  tags                = module.tagging.tags
}
