# environments/dev/main.tf
# Development environment - Serverless API with DynamoDB

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

module "data" {
  source                        = "../../modules/data"
  table_name                    = module.naming.dynamodb_table
  billing_mode                  = var.dynamodb_billing_mode
  enable_point_in_time_recovery = var.enable_dynamodb_pitr
  ttl_attribute_name            = var.dynamodb_ttl_attribute
  tags                          = module.tagging.tags
}

module "api" {
  source              = "../../modules/api"
  api_name            = module.naming.api_gateway
  cors_allow_origins  = var.cors_allow_origins
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
