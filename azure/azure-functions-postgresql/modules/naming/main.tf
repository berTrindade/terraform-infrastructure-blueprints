# modules/naming/main.tf
# Naming convention module for Azure Functions + PostgreSQL

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # Compute resources
    function_app     = "${local.prefix}-function-app"
    app_service_plan = "${local.prefix}-app-plan"

    # Data resources
    postgresql_server = "${local.prefix}-postgresql"
    postgresql_db     = "${local.prefix}-db"

    # Storage resources
    storage_account = "${replace(local.prefix, "-", "")}storage"

    # Monitoring resources
    log_analytics_workspace = "${local.prefix}-workspace"
    application_insights    = "${local.prefix}-insights"

    # Networking resources
    resource_group = "${local.prefix}-rg"
  }
}
