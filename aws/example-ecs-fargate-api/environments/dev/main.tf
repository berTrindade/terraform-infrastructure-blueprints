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

  azs             = local.azs
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + var.az_count)]
  public_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]

  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = module.tagging.tags
}

# Security Groups (separate from VPC module)
resource "aws_security_group" "alb" {
  name        = "${module.naming.security_group}-alb"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
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
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "From ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(module.tagging.tags, { Name = "${module.naming.security_group}-ecs" })
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
  alb_name              = module.naming.alb
  target_group_name     = module.naming.target_group
  ecr_repository_name   = module.naming.ecr_repository
  execution_role_name   = module.naming.execution_role
  task_role_name        = module.naming.task_role
  log_group_name        = module.naming.log_group
  log_retention_days    = var.log_retention_days
  tags                  = module.tagging.tags
}
