output "backend_ecr_repo_url" {
  value = aws_ecr_repository.backend.repository_url
}

output "flyway_ecr_repo_url" {
  value = aws_ecr_repository.flyway.repository_url
}

output "backend_service_name" {
  value = aws_ecs_service.backend.name
}

output "backend_target_group_arn" {
  value = aws_lb_target_group.backend.arn
}

output "backend_secret_arn" {
  value = aws_secretsmanager_secret.backend.arn
}

output "flyway_task_definition_arn" {
  value = aws_ecs_task_definition.flyway.arn
}

output "ecs_cluster_name" { value = local.cluster_name }
output "private_subnet_ids" { value = local.private_subnet_ids }
output "backend_sg_id" { value = local.backend_sg_id }
