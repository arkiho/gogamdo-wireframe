output "instance_name" {
  description = "Cloud SQL staging instance name."
  value       = google_sql_database_instance.staging.name
}

output "connection_name" {
  description = "Connection name for Cloud SQL Auth Proxy/connectors."
  value       = google_sql_database_instance.staging.connection_name
}

output "database_name" {
  description = "Staging application database."
  value       = google_sql_database.gogamdo.name
}

output "pitr_policy" {
  description = "Configured Cloud SQL backup and PITR policy."
  value = {
    automated_backup_utc           = "18:00"
    automated_backup_kst           = "03:00"
    retained_backups               = 8
    transaction_log_retention_days = 7
    binary_logging_enabled         = true
  }
}
