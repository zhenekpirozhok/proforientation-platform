variable "name" {
  description = "Project/name prefix for resources"
  type        = string
  default     = "core"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

# Subnet CIDRs (2 AZs)
variable "public_subnet_cidrs" {
  description = "Two public subnet CIDRs"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Two private subnet CIDRs"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "backend_port" {
  description = "Backend container port"
  type        = number
  default     = 8082
}

variable "ml_port" {
  description = "ML container port"
  type        = number
  default     = 8000
}

# variable "acm_certificate_arn" {
#   description = "ACM certificate ARN for the public ALB HTTPS listener (must be in eu-north-1)"
#   type        = string
# }

variable "tags" {
  description = "Extra tags"
  type        = map(string)
  default     = {}
}

variable "postgres_db" {
  type        = string
  description = "Database name"
  default     = "appdb"
}

variable "postgres_port" {
  type        = number
  description = "Postgres port"
  default     = 5432
}

variable "db_admin_user" {
  type        = string
  description = "RDS master/admin username"
  default     = "db_admin"
}

variable "db_admin_password" {
  type        = string
  description = "RDS master/admin password"
  sensitive   = true
}

variable "app_db_user" {
  type        = string
  description = "Application DB username (created by migrations)"
  default     = "app_user"
}

variable "app_db_password" {
  type        = string
  description = "Application DB password"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage (GB)"
  type        = number
  default     = 20
}
