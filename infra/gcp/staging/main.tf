terraform {
  required_version = ">= 1.8.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  required_apis = toset([
    "iamcredentials.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
  ])
}

resource "google_project_service" "required" {
  for_each = local.required_apis

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_sql_database_instance" "staging" {
  name             = var.instance_name
  project          = var.project_id
  region           = var.region
  database_version = "MYSQL_8_4"

  # Terraform-level guard. This must be changed explicitly before destroy.
  deletion_protection = true

  settings {
    edition           = "ENTERPRISE"
    tier              = "db-f1-micro"
    availability_type = "ZONAL"

    disk_type             = "PD_SSD"
    disk_size             = 10
    disk_autoresize       = true
    disk_autoresize_limit = 100

    # Provider/API-level guard in addition to Terraform deletion protection.
    deletion_protection_enabled = true

    backup_configuration {
      enabled                        = true
      binary_log_enabled             = true
      start_time                     = "18:00" # 03:00 KST
      location                       = var.region
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 8
        retention_unit   = "COUNT"
      }
    }

    # IAM DB authentication avoids committing a database password to IaC.
    database_flags {
      name  = "cloudsql_iam_authentication"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = true
      ssl_mode     = "ENCRYPTED_ONLY"
      # No authorized_networks blocks direct public-IP clients. Use the
      # Cloud SQL Auth Proxy or a Cloud SQL connector instead.
    }

    maintenance_window {
      day          = 7
      hour         = 20 # Monday 05:00 KST when Sunday 20:00 UTC
      update_track = "stable"
    }

    user_labels = {
      application = "gogamdo"
      environment = "staging"
      purpose     = "pitr-drill"
    }
  }

  depends_on = [google_project_service.required]
}

resource "google_sql_database" "gogamdo" {
  name      = var.database_name
  project   = var.project_id
  instance  = google_sql_database_instance.staging.name
  charset   = "utf8mb4"
  collation = "utf8mb4_0900_ai_ci"
}
