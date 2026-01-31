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
  cognito_domain           = var.cognito_domain
  password_minimum_length  = var.password_minimum_length
  password_require_symbols = var.password_require_symbols
  mfa_configuration        = var.mfa_configuration
  access_token_validity    = var.access_token_validity
  id_token_validity        = var.id_token_validity
  refresh_token_validity   = var.refresh_token_validity
  callback_urls            = var.callback_urls
  logout_urls              = var.logout_urls
  create_identity_pool     = var.create_identity_pool
  identity_pool_name       = module.naming.identity_pool
  tags                     = module.tagging.tags
}

module "api" {
  source               = "../../modules/api"
  api_name             = module.naming.api
  api_routes           = var.api_routes
  cognito_client_id    = module.auth.user_pool_client_id
  cognito_issuer_url   = "https://${module.auth.user_pool_endpoint}"
  cognito_region       = var.aws_region
  cognito_user_pool_id = module.auth.user_pool_id
  cors_allow_origins   = var.cors_allow_origins
  function_name        = module.naming.lambda_function
  role_name            = module.naming.lambda_role
  log_group_name       = module.naming.lambda_log_group
  source_dir           = "${path.module}/../../src/api"
  memory_size          = var.lambda_memory_size
  timeout              = var.lambda_timeout
  log_retention_days   = var.log_retention_days
  tags                 = module.tagging.tags
}

module "hosting" {
  source                       = "../../modules/hosting"
  app_name                     = module.naming.amplify_app
  repository_url               = var.repository_url
  aws_region                   = var.aws_region
  cognito_user_pool_id         = module.auth.user_pool_id
  cognito_client_id            = module.auth.user_pool_client_id
  api_url                      = module.api.api_endpoint
  build_spec                   = var.build_spec
  build_output_directory       = var.build_output_directory
  framework                    = var.framework
  main_branch_name             = var.main_branch_name
  environment_variables        = var.environment_variables
  branch_environment_variables = var.branch_environment_variables
  enable_auto_branch_creation  = var.enable_auto_branch_creation
  enable_branch_auto_build     = var.enable_branch_auto_build
  enable_branch_auto_deletion  = var.enable_branch_auto_deletion
  enable_pull_request_preview  = var.enable_pull_request_preview
  create_webhook               = var.create_webhook
  tags                         = module.tagging.tags
}
