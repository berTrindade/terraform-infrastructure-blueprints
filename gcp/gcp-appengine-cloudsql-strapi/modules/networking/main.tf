# modules/networking/main.tf
# VPC, Subnets, VPC Connector, and Private Service Connect

resource "google_compute_network" "main" {
  name                    = var.vpc_network_name
  project                 = var.project_id
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = var.subnet_name
  project       = var.project_id
  region        = var.region
  ip_cidr_range = var.subnet_cidr
  network       = google_compute_network.main.id
}

# Serverless VPC Access connector for App Engine/Cloud Run -> VPC
resource "google_vpc_access_connector" "app" {
  name          = var.vpc_connector_name
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.main.name
  ip_cidr_range = var.connector_cidr

  min_throughput = var.connector_min_throughput
  max_throughput = var.connector_max_throughput
}

# Private Service Connect setup for Cloud SQL private IP
resource "google_compute_global_address" "private_ip_alloc" {
  name          = var.private_ip_alloc_name
  project       = var.project_id
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}
