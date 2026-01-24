# environments/dev/main.tf
# GCP App Engine + Cloud SQL + Cloud Storage

# Generate random password if not provided
resource "random_password" "database_password" {
  count   = var.database_password == "" ? 1 : 0
  length  = 32
  special = true
}

locals {
  database_password = var.database_password != "" ? var.database_password : random_password.database_password[0].result
}

# ============================================
# Naming and Tagging
# ============================================

module "naming" {
  source = "../../modules/naming"

  project     = var.project
  environment = var.environment
  project_id  = var.project_id
}

module "tagging" {
  source = "../../modules/tagging"

  project          = var.project
  environment      = var.environment
  additional_labels = var.additional_labels
}

# ============================================
# Networking
# ============================================

module "networking" {
  source = "../../modules/networking"

  vpc_network_name      = module.naming.vpc_network
  subnet_name           = module.naming.subnet
  vpc_connector_name    = module.naming.vpc_connector
  private_ip_alloc_name = module.naming.private_ip_alloc
  project_id            = var.project_id
  region                = var.region
  subnet_cidr           = var.subnet_cidr
  connector_cidr        = var.connector_cidr
}

# ============================================
# Compute (App Engine)
# ============================================

module "compute" {
  source = "../../modules/compute"

  project_id  = var.project_id
  location_id = "us-central"
}

# ============================================
# Database
# ============================================

module "data" {
  source = "../../modules/data"

  instance_name         = module.naming.cloud_sql_instance
  database_name         = module.naming.database
  database_user         = "${var.project}_user"
  database_password     = local.database_password
  project_id            = var.project_id
  region                = var.region
  database_tier         = var.database_tier
  disk_size             = var.database_disk_size
  backup_enabled        = var.backup_enabled
  pitr_enabled          = var.pitr_enabled
  enable_public_ip      = false
  vpc_network_id        = module.networking.vpc_network_id
  vpc_peering_connection = module.networking.vpc_peering_connection
}

# ============================================
# Storage
# ============================================

module "storage" {
  source = "../../modules/storage"

  bucket_name                  = module.naming.storage_bucket
  project_id                   = var.project_id
  location                     = var.region
  service_account_id          = module.naming.storage_service_account
  service_account_display_name = "${var.project} Storage Service Account - ${var.environment}"
}

# ============================================
# Secrets
# ============================================

module "secrets" {
  source = "../../modules/secrets"

  secrets = {
    db_password = {
      secret_id   = "${module.naming.secret_prefix}/db-password"
      secret_data = var.create_secrets ? local.database_password : null
    }
    db_connection_name = {
      secret_id   = "${module.naming.secret_prefix}/db-connection-name"
      secret_data = var.create_secrets ? module.data.connection_name : null
    }
  }

  project_id            = var.project_id
  create_secret_versions = var.create_secrets
  labels                = module.tagging.labels
}
