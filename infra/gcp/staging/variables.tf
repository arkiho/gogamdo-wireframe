variable "project_id" {
  description = "Dedicated GCP staging project ID."
  type        = string
  default     = "gogamdo-staging"

  validation {
    condition     = var.project_id == "gogamdo-staging"
    error_message = "This staging module is intentionally pinned to gogamdo-staging."
  }
}

variable "region" {
  description = "Seoul region for the Gogamdo staging database."
  type        = string
  default     = "asia-northeast3"

  validation {
    condition     = var.region == "asia-northeast3"
    error_message = "Gogamdo staging must remain in the Seoul region."
  }
}

variable "instance_name" {
  description = "Cloud SQL staging instance name."
  type        = string
  default     = "gogamdo-mysql-staging"
}

variable "database_name" {
  description = "Application database created on the staging instance."
  type        = string
  default     = "gogamdo"
}
