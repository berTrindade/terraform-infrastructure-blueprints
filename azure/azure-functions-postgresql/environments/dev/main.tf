# environments/dev/main.tf
# Azure Functions + PostgreSQL

# Generate random password if not provided
resource "random_password" "postgresql_password" {
  count   = var.postgresql_password == "" ? 1 : 0
  length  = 32
  special = true
}

locals {
  postgresql_password = var.postgresql_password != "" ? var.postgresql_password : random_password.postgresql_password[0].result
}

# ============================================
# Naming and Tagging
# ============================================

module "naming" {
  source = "../../modules/naming"

  project     = var.project
  environment = var.environment
}

module "tagging" {
  source = "../../modules/tagging"

  project          = var.project
  environment      = var.environment
  repository       = var.repository
  additional_tags  = var.additional_tags
}

# ============================================
# Networking
# ============================================

module "networking" {
  source = "../../modules/networking"

  resource_group_name = module.naming.resource_group
  location            = var.location
  tags                = module.tagging.tags
}

# ============================================
# Storage
# ============================================

module "storage" {
  source = "../../modules/storage"

  storage_account_name = module.naming.storage_account
  resource_group_name  = module.networking.resource_group_name
  location             = module.networking.location
  tags                 = module.tagging.tags
}

# ============================================
# Monitoring
# ============================================

module "monitoring" {
  source = "../../modules/monitoring"

  log_analytics_workspace_name = module.naming.log_analytics_workspace
  application_insights_name    = module.naming.application_insights
  resource_group_name          = module.networking.resource_group_name
  location                     = module.networking.location
  tags                         = module.tagging.tags
}

# ============================================
# Database
# ============================================

module "data" {
  source = "../../modules/data"

  server_name          = module.naming.postgresql_server
  resource_group_name  = module.networking.resource_group_name
  location             = module.networking.location
  postgresql_version   = var.postgresql_version
  sku_name             = var.postgresql_sku
  storage_mb           = var.postgresql_storage_mb
  administrator_login  = "${var.project}admin"
  administrator_password = local.postgresql_password
  database_name        = module.naming.postgresql_db
  tags                 = module.tagging.tags
}

# ============================================
# Compute
# ============================================

module "compute" {
  source = "../../modules/compute"

  function_app_name          = module.naming.function_app
  app_service_plan_name     = module.naming.app_service_plan
  resource_group_name       = module.networking.resource_group_name
  location                  = module.networking.location
  storage_account_name      = module.storage.storage_account_name
  storage_account_access_key = module.storage.primary_access_key
  app_service_plan_tier     = var.app_service_plan_tier
  app_service_plan_size     = var.app_service_plan_size
  node_version              = var.node_version
  db_host                   = module.data.server_fqdn
  db_database               = module.data.database_name
  db_username               = module.data.administrator_login
  db_password               = local.postgresql_password
  additional_app_settings   = var.additional_app_settings
  tags                      = module.tagging.tags
}
