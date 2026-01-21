# environments/dev/main.tf
# Uses official terraform-aws-modules for battle-tested infrastructure

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

data "aws_availability_zones" "available" {
  state = "available"
}

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

# Official VPC Module - https://registry.terraform.io/modules/terraform-aws-modules/vpc/aws
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = module.naming.vpc
  cidr = var.vpc_cidr

  azs              = local.azs
  private_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + var.az_count)]
  public_subnets   = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]
  database_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + var.az_count * 2)]

  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  create_database_subnet_group = true

  tags = module.tagging.tags
}

# Security Groups (separate from VPC module)
resource "aws_security_group" "alb" {
  name        = "${module.naming.security_group}-alb"
  description = "ALB security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-alb" })
}

resource "aws_security_group" "ecs" {
  name        = "${module.naming.security_group}-ecs"
  description = "ECS tasks security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-ecs" })
}

resource "aws_security_group" "database" {
  name        = "${module.naming.security_group}-db"
  description = "Database security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-db" })
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
  db_security_group_id        = aws_security_group.database.id
  db_subnet_group_name        = module.vpc.database_subnet_group_name
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
  public_subnet_ids     = module.vpc.public_subnets
  private_subnet_ids    = module.vpc.private_subnets
  alb_security_group_id = aws_security_group.alb.id
  ecs_security_group_id = aws_security_group.ecs.id
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
