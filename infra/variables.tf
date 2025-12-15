variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "vpc_id" {
  description = "VPC where EC2 and RDS live"
  type        = string
}

variable "subnet_id" {
  description = "PUBLIC subnet for EC2"
  type        = string
}

variable "key_name" {
  description = "Existing EC2 key pair name"
  type        = string
}

variable "my_ip" {
  description = "Your IP for SSH access (x.x.x.x/32)"
  type        = string
}

variable "backend_port" {
  type    = number
  default = 8082
}