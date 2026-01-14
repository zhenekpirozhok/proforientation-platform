variable "region" {
  type    = string
  default = "eu-north-1"
}

variable "name" {
  type    = string
  default = "backend"
}

# Backend container image (set from CI)
variable "backend_image" {
  type        = string
  description = "ECR image URI for backend, e.g. <acct>.dkr.ecr.eu-north-1.amazonaws.com/backend:<sha>"
}

# Flyway migrations image (set from CI)
variable "flyway_image" {
  type        = string
  description = "ECR image URI for flyway migrations, e.g. <acct>.dkr.ecr.eu-north-1.amazonaws.com/flyway-migrations:<sha>"
}

variable "container_port" {
  type    = number
  default = 8082
}

variable "cpu" {
  type    = number
  default = 512
}

variable "memory" {
  type    = number
  default = 1024
}

variable "desired_count" {
  type    = number
  default = 1
}

variable "healthcheck_path" {
  type    = string
  default = "/actuator/health/readiness"
}

# App secrets
variable "jwt_secret_key" {
  type      = string
  sensitive = true
}

variable "google_client_id" {
  type      = string
  sensitive = true
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "frontend_base_url" {
  type      = string
  sensitive = true
}