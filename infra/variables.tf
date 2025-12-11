variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "backend_service_name" {
  type    = string
  default = "backend-service"
}

variable "backend_task_family" {
  type    = string
  default = "backend"
}

variable "container_port" {
  type    = number
  default = 8082
}

variable "vpc_id" {
  description = "VPC where ECS will run"
  type        = string
}

variable "subnets" {
  description = "Subnets for ECS tasks"
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "Security group of the RDS instance"
  type        = string
}
