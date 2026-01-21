# modules/naming/main.tf
# Resource naming following terraform-secrets-poc standard
# Secret naming: /{env}/{app}/{purpose}

locals {
  prefix = "${var.project}-${var.environment}"

  # Short environment name for secrets path
  env_short = {
    development = "dev"
    staging     = "staging"
    production  = "prod"
    dev         = "dev"
    stg         = "staging"
    prod        = "prod"
  }

  env = lookup(local.env_short, var.environment, var.environment)

  names = {
    vpc             = "${local.prefix}-vpc"
    public_subnet   = "${local.prefix}-public"
    private_subnet  = "${local.prefix}-private"
    security_group  = "${local.prefix}-sg"
    ecs_cluster     = "${local.prefix}-cluster"
    ecs_service     = "${local.prefix}-service"
    task_definition = "${local.prefix}-task"
    alb             = "${local.prefix}-alb"
    target_group    = "${local.prefix}-tg"
    ecr_repository  = "${local.prefix}-api"
    task_role       = "${local.prefix}-task-role"
    execution_role  = "${local.prefix}-exec-role"
    log_group       = "/ecs/${local.prefix}"
    db_instance     = "${local.prefix}-db"
    # Secret naming: /{env}/{app}/{purpose}
    db_secret       = "/${local.env}/${var.project}/db-credentials"
    secret_prefix   = "/${local.env}/${var.project}"
  }
}
