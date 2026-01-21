# environments/dev/main.tf
# ECS Fargate with RDS using official terraform-aws-modules
# Pattern adopted from samsung-maestro

locals {
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}

# ============================================
# Naming and Tagging
# ============================================

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

# ============================================
# VPC (Official Module)
# ============================================

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

# ============================================
# Security Groups (Official Module)
# ============================================

module "alb_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${module.naming.security_group}-alb"
  description = "ALB security group"
  vpc_id      = module.vpc.vpc_id

  ingress_cidr_blocks = ["0.0.0.0/0"]
  ingress_rules       = ["http-80-tcp", "https-443-tcp"]

  egress_cidr_blocks = [module.vpc.vpc_cidr_block]
  egress_with_cidr_blocks = [
    {
      from_port   = var.container_port
      to_port     = var.container_port
      protocol    = "tcp"
      description = "To ECS tasks"
      cidr_blocks = module.vpc.vpc_cidr_block
    }
  ]

  tags = module.tagging.tags
}

module "ecs_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${module.naming.security_group}-ecs"
  description = "ECS tasks security group"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = var.container_port
      to_port                  = var.container_port
      protocol                 = "tcp"
      description              = "From ALB"
      source_security_group_id = module.alb_sg.security_group_id
    }
  ]

  egress_rules = ["all-all"]

  tags = module.tagging.tags
}

module "database_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.0"

  name        = "${module.naming.security_group}-db"
  description = "Database security group"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 5432
      to_port                  = 5432
      protocol                 = "tcp"
      description              = "PostgreSQL from ECS"
      source_security_group_id = module.ecs_sg.security_group_id
    }
  ]

  egress_rules = ["all-all"]

  tags = module.tagging.tags
}

# ============================================
# Secrets and RDS (Keep Custom Modules)
# ============================================

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
  db_security_group_id        = module.database_sg.security_group_id
  db_subnet_group_name        = module.vpc.database_subnet_group_name
  multi_az                    = var.db_multi_az
  skip_final_snapshot         = var.db_skip_final_snapshot
  deletion_protection         = var.db_deletion_protection
  backup_retention_period     = var.db_backup_retention_period
  enable_performance_insights = var.db_enable_performance_insights
  tags                        = module.tagging.tags
}

# ============================================
# ALB (Official Module)
# ============================================

module "alb" {
  source  = "terraform-aws-modules/alb/aws"
  version = "~> 9.0"

  name               = module.naming.alb
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  load_balancer_type = "application"

  enable_deletion_protection = false

  # Use existing security group
  create_security_group = false
  security_groups       = [module.alb_sg.security_group_id]

  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"
      forward = {
        target_group_key = "ecs"
      }
    }
  }

  target_groups = {
    ecs = {
      name_prefix       = "api-"
      protocol          = "HTTP"
      port              = var.container_port
      target_type       = "ip"
      create_attachment = false

      health_check = {
        enabled             = true
        path                = var.health_check_path
        protocol            = "HTTP"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        timeout             = 5
        interval            = 30
        matcher             = "200-299"
      }
    }
  }

  tags = module.tagging.tags
}

# ============================================
# ECR Repository
# ============================================

resource "aws_ecr_repository" "this" {
  name                 = module.naming.ecr_repository
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = module.tagging.tags
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}

# ============================================
# ECS Cluster and Service (Official Module)
# ============================================

module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "~> 5.0"

  cluster_name = module.naming.ecs_cluster

  cluster_settings = {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  # Fargate capacity providers
  fargate_capacity_providers = {
    FARGATE = {
      default_capacity_provider_strategy = {
        weight = var.use_fargate_spot ? 0 : 100
        base   = var.use_fargate_spot ? 0 : 1
      }
    }
    FARGATE_SPOT = {
      default_capacity_provider_strategy = {
        weight = var.use_fargate_spot ? 100 : 0
        base   = var.use_fargate_spot ? 1 : 0
      }
    }
  }

  # Service definition
  services = {
    api = {
      cpu    = var.task_cpu
      memory = var.task_memory

      container_definitions = {
        api = {
          cpu       = var.task_cpu
          memory    = var.task_memory
          essential = true
          image     = var.container_image != null ? var.container_image : "${aws_ecr_repository.this.repository_url}:latest"

          port_mappings = [{
            containerPort = var.container_port
            protocol      = "tcp"
          }]

          environment = concat(var.environment_variables, [
            { name = "DB_HOST", value = module.data.db_instance_address },
            { name = "DB_PORT", value = "5432" },
            { name = "DB_NAME", value = var.db_name },
          ])

          secrets = [
            {
              name      = "DATABASE_URL"
              valueFrom = module.secrets.secret_arn
            }
          ]

          log_configuration = {
            logDriver = "awslogs"
            options = {
              awslogs-group         = "/ecs/${var.project}-${var.environment}"
              awslogs-region        = data.aws_region.current.name
              awslogs-stream-prefix = "api"
            }
          }

          enable_cloudwatch_logging              = true
          create_cloudwatch_log_group            = true
          cloudwatch_log_group_retention_in_days = var.log_retention_days
        }
      }

      desired_count = var.desired_count
      launch_type   = "FARGATE"

      subnet_ids       = module.vpc.private_subnets
      assign_public_ip = false

      # Use existing security group
      create_security_group = false
      security_group_ids    = [module.ecs_sg.security_group_id]

      load_balancer = {
        service = {
          target_group_arn = module.alb.target_groups["ecs"].arn
          container_name   = "api"
          container_port   = var.container_port
        }
      }

      deployment_circuit_breaker = {
        enable   = true
        rollback = true
      }
    }
  }

  tags = module.tagging.tags
}
