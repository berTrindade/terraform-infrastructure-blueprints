# modules/naming/main.tf
# Naming convention module for GCP App Engine + Cloud SQL

locals {
  # Base prefix for all resources
  prefix = "${var.project}-${var.environment}"

  # Component-specific names
  names = {
    # Compute resources
    app_engine_app = var.project

    # Data resources
    cloud_sql_instance = "${local.prefix}-postgresql"
    database           = "${var.project}-db"

    # Storage resources
    storage_bucket = "${var.project}-${var.environment}-storage"

    # Networking resources
    vpc_network     = "vpc-${local.prefix}"
    subnet           = "subnet-${var.environment}"
    vpc_connector    = "vpcconn-${var.environment}"
    private_ip_alloc = "google-managed-services-${var.environment}"

    # Secrets
    secret_prefix = "${var.environment}/${var.project}"
    db_secret     = "${var.environment}/${var.project}/db-credentials"

    # Service accounts
    app_service_account     = "${var.project}-app@${var.project_id}.iam.gserviceaccount.com"
    storage_service_account = "${var.project}-storage-${var.environment}"
  }
}
