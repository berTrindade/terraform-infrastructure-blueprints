# modules/compute/main.tf
# Azure Functions and App Service Plan

resource "azurerm_app_service_plan" "this" {
  name                = var.app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  kind                = "Linux"
  reserved            = true

  sku {
    tier = var.app_service_plan_tier
    size = var.app_service_plan_size
  }

  tags = var.tags
}

resource "azurerm_linux_function_app" "this" {
  name                       = var.function_app_name
  resource_group_name        = var.resource_group_name
  location                   = var.location
  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key
  service_plan_id            = azurerm_app_service_plan.this.id

  https_only                  = true
  functions_extension_version = "~4"

  app_settings = merge(
    {
      NODE_ENV                     = var.node_env
      DB_HOST                      = var.db_host
      DB_PORT                      = var.db_port
      DB_DATABASE                  = var.db_database
      DB_USERNAME                  = var.db_username
      DB_PASSWORD                  = var.db_password
      WEBSITE_MOUNT_ENABLED        = "1"
      SCM_DO_BUILD_DURING_DEPLOYMENT = "true"
    },
    var.additional_app_settings
  )

  site_config {
    always_on = var.always_on

    application_stack {
      node_version = var.node_version
    }

    app_service_logs {
      retention_period_days = var.log_retention_days
      disk_quota_mb         = var.log_disk_quota_mb
    }
  }

  lifecycle {
    ignore_changes = [
      app_settings["WEBSITE_RUN_FROM_PACKAGE"],
    ]
  }

  tags = var.tags
}
