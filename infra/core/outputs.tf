output "region" {
  value = var.region
}

output "azs" {
  value = local.azs
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = [for s in aws_subnet.public : s.id]
}

output "private_subnet_ids" {
  value = [for s in aws_subnet.private : s.id]
}

output "alb_arn" {
  value = aws_lb.public.arn
}

output "alb_dns_name" {
  value = aws_lb.public.dns_name
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "alb_listener_http_arn" {
  value = aws_lb_listener.http.arn
}

# output "alb_listener_https_arn" {
#   value = aws_lb_listener.https.arn
# }

output "backend_security_group_id" {
  value = aws_security_group.backend.id
}

output "ml_security_group_id" {
  value = aws_security_group.ml.id
}

output "rds_security_group_id" {
  value = aws_security_group.rds.id
}

output "rds_endpoint" {
  value = aws_db_instance.postgres.address
}

output "rds_port" {
  value = aws_db_instance.postgres.port
}

output "rds_db_name" {
  value = aws_db_instance.postgres.db_name
}

output "db_secret_arn" {
  value = aws_secretsmanager_secret.prod_db.arn
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "service_discovery_namespace_id" {
  value = aws_service_discovery_private_dns_namespace.main.id
}