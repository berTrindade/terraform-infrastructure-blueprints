# environments/dev/terraform.tfvars

project     = "myapp"
environment = "dev"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.0.0.0/16"
az_count           = 2
single_nat_gateway = true

# EKS Cluster
cluster_version         = "1.29"
endpoint_private_access = true
endpoint_public_access  = true
enabled_log_types       = ["api", "audit", "authenticator"]

# Node Group
node_instance_types = ["t3.medium"]
node_capacity_type  = "ON_DEMAND"
node_disk_size      = 50
node_desired_size   = 2
node_min_size       = 1
node_max_size       = 5

# Addons
enable_lb_controller        = true
lb_controller_chart_version = "1.7.1"
