resource "aws_ecs_cluster" "main" {
  name = "backend-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "backend"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  network_mode             = "awsvpc"

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true
      portMappings = [{
        containerPort = 8082
      }]
      environment = [
        { name = "POSTGRES_HOST",      value = var.db_host },
        { name = "POSTGRES_PORT",      value = "5432" },
        { name = "POSTGRES_DB",        value = var.db_name },
        { name = "POSTGRES_USER",      value = var.db_user },
        { name = "POSTGRES_PASSWORD",  value = var.db_password },
        { name = "JWT_SECRET_KEY",     value = var.jwt_secret }
      ]
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1

  launch_type = "FARGATE"

  network_configuration {
    subnets         = var.private_subnets
    security_groups = [aws_security_group.backend_sg.id]
    assign_public_ip = true  # or false if using ALB
  }
}
