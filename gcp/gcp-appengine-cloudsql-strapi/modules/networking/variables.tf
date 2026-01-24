variable "vpc_network_name" {
  description = "Name of the VPC network"
  type        = string
}

variable "subnet_name" {
  description = "Name of the subnet"
  type        = string
}

variable "vpc_connector_name" {
  description = "Name of the VPC connector"
  type        = string
}

variable "private_ip_alloc_name" {
  description = "Name of the private IP allocation"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "subnet_cidr" {
  description = "CIDR range for the subnet"
  type        = string
  default     = "10.8.0.0/20"
}

variable "connector_cidr" {
  description = "CIDR range for the VPC connector (/28)"
  type        = string
  default     = "10.8.32.0/28"
}

variable "connector_min_throughput" {
  description = "Minimum throughput for VPC connector (Mbps)"
  type        = number
  default     = 200
}

variable "connector_max_throughput" {
  description = "Maximum throughput for VPC connector (Mbps)"
  type        = number
  default     = 300
}
