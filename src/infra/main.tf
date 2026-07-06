terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "europe-west2"
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "main" {
  name             = "takaful-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro" # Use appropriate tier for prod
  }
  deletion_protection = false # Set to true for prod
}

# Cloud SQL Database
resource "google_sql_database" "takaful_db" {
  name     = "takaful_db"
  instance = google_sql_database_instance.main.name
}

# Cloud KMS KeyRing and CryptoKey for Encrypting PII
resource "google_kms_key_ring" "takaful_keyring" {
  name     = "takaful-keyring"
  location = var.region
}

resource "google_kms_crypto_key" "takaful_key" {
  name            = "takaful-pii-key"
  key_ring        = google_kms_key_ring.takaful_keyring.id
  rotation_period = "7776000s" # 90 days
}
