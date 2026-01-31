# modules/naming/main.tf

locals {
  prefix = "${var.project}-${var.environment}"

  names = {
    amplify_app      = "${local.prefix}-app"
    user_pool        = "${local.prefix}-users"
    user_pool_client = "${local.prefix}-client"
    identity_pool    = "${local.prefix}-identity"
    api              = "${local.prefix}-api"
    lambda_function  = "${local.prefix}-api-handler"
    lambda_role      = "${local.prefix}-api-lambda-role"
    lambda_log_group = "/aws/lambda/${local.prefix}-api-handler"
  }
}
