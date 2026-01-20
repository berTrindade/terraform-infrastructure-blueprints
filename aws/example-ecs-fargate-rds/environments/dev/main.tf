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

module "vpc" {
  source                = "../../modules/vpc"
  vpc_name              = module.naming.vpc
  vpc_cidr              = var.vpc_cidr
  az_count              = var.az_count
  public_subnet_name    = module.naming.public_subnet
  private_subnet_name   = module.naming.private_subnet
  security_group_prefix = module.naming.security_group
  container_port        = var.container_port
  single_nat_gateway    = var.single_nat_gateway
  tags                  = module.tagging.tags
}

module "secrets" {
  source      = "../../modules/secrets"
  secret_name = module.naming.db_secret
  db_username = var.db_username
  db_name     = var.db_name
  db_host     = module.data.db_instance_address
  db_port     = 5432
  tags        = module.tagging.tags
}

module "data" {
  source                      = "../../modules/data"
  db_instance_identifier      = module.naming.db_instance
  db_engine_version           = var.db_engine_version
  db_instance_class           = var.db_instance_class
  db_allocated_storage        = var.db_allocated_storage
  db_max_allocated_storage    = var.db_max_allocated_storage
  db_name                     = var.db_name
  db_username                 = var.db_username
  db_password                 = module.secrets.db_password
  db_security_group_id        = module.vpc.database_security_group_id
  db_subnet_group_name        = module.vpc.db_subnet_group_name
  multi_az                    = var.db_multi_az
  skip_final_snapshot         = var.db_skip_final_snapshot
  deletion_protection         = var.db_deletion_protection
  backup_retention_period     = var.db_backup_retention_period
  enable_performance_insights = var.db_enable_performance_insights
  tags                        = module.tagging.tags
}

module "cluster" {
  source                    = "../../modules/cluster"
  cluster_name              = module.naming.ecs_cluster
  enable_container_insights = var.enable_container_insights
  use_fargate_spot          = var.use_fargate_spot
  tags                      = module.tagging.tags
}

module "service" {
  source                = "../../modules/service"
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  ecs_security_group_id = module.vpc.ecs_security_group_id
  cluster_arn           = module.cluster.cluster_arn
  service_name          = module.naming.ecs_service
  task_definition_name  = module.naming.task_definition
  container_name        = "api"
  container_image       = var.container_image
  container_port        = var.container_port
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  desired_count         = var.desired_count
  health_check_path     = var.health_check_path
  environment_variables = var.environment_variables
  db_secret_arn         = module.secrets.secret_arn
  alb_name              = module.naming.alb
  target_group_name     = module.naming.target_group
  ecr_repository_name   = module.naming.ecr_repository
  execution_role_name   = module.naming.execution_role
  task_role_name        = module.naming.task_role
  log_group_name        = module.naming.log_group
  log_retention_days    = var.log_retention_days
  tags                  = module.tagging.tags
}
