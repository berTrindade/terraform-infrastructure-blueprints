# environments/dev/main.tf
# ECS Fargate API using official terraform-aws-modules
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

  azs             = local.azs
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + var.az_count)]
  public_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i)]

  enable_nat_gateway = true
  single_nat_gateway = var.single_nat_gateway

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = module.tagging.tags
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

  # Security group rules
  security_group_ingress_rules = {
    http = {
      from_port   = 80
      to_port     = 80
      ip_protocol = "tcp"
      cidr_ipv4   = "0.0.0.0/0"
      description = "HTTP"
    }
    https = {
      from_port   = 443
      to_port     = 443
      ip_protocol = "tcp"
      cidr_ipv4   = "0.0.0.0/0"
      description = "HTTPS"
    }
  }

  security_group_egress_rules = {
    all = {
      from_port   = var.container_port
      to_port     = var.container_port
      ip_protocol = "tcp"
      cidr_ipv4   = module.vpc.vpc_cidr_block
      description = "To ECS tasks"
    }
  }

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

          environment = var.environment_variables

          log_configuration = {
            logDriver = "awslogs"
            options = {
              awslogs-group         = "/ecs/${var.project}-${var.environment}"
              awslogs-region        = data.aws_region.current.name
              awslogs-stream-prefix = "api"
            }
          }

          enable_cloudwatch_logging   = true
          create_cloudwatch_log_group = true
          cloudwatch_log_group_retention_in_days = var.log_retention_days
        }
      }

      desired_count = var.desired_count
      launch_type   = "FARGATE"

      subnet_ids         = module.vpc.private_subnets
      assign_public_ip   = false

      security_group_rules = {
        ingress_alb = {
          type                     = "ingress"
          from_port                = var.container_port
          to_port                  = var.container_port
          protocol                 = "tcp"
          source_security_group_id = module.alb.security_group_id
          description              = "From ALB"
        }
        egress_all = {
          type        = "egress"
          from_port   = 0
          to_port     = 0
          protocol    = "-1"
          cidr_blocks = ["0.0.0.0/0"]
        }
      }

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
