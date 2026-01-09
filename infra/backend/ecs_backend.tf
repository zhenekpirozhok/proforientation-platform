resource "aws_ecs_task_definition" "backend" {
  family                   = "backend-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.cpu)
  memory                   = tostring(var.memory)

  execution_role_arn = aws_iam_role.task_execution.arn
  task_role_arn      = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = var.backend_image
      essential = true

      portMappings = [
        { containerPort = var.container_port, protocol = "tcp" }
      ]

      # Non-secret config if needed:
      environment = [
        { name = "SPRING_PROFILES_ACTIVE", value = "prod" }
      ]

      secrets = [
        { name = "POSTGRES_HOST", valueFrom = "${local.db_secret_arn}:POSTGRES_HOST::" },
        { name = "POSTGRES_PORT", valueFrom = "${local.db_secret_arn}:POSTGRES_PORT::" },
        { name = "POSTGRES_DB",   valueFrom = "${local.db_secret_arn}:POSTGRES_DB::" },
        { name = "POSTGRES_USER", valueFrom = "${local.db_secret_arn}:POSTGRES_USER::" },
        { name = "POSTGRES_PASSWORD", valueFrom = "${local.db_secret_arn}:POSTGRES_PASSWORD::" },
        { name = "ML_API_URL", valueFrom = "${local.db_secret_arn}:ML_API_URL::" },

        { name = "JWT_SECRET_KEY", valueFrom = "${aws_secretsmanager_secret.backend.arn}:JWT_SECRET_KEY::" },
        { name = "GOOGLE_CLIENT_ID", valueFrom = "${aws_secretsmanager_secret.backend.arn}:GOOGLE_CLIENT_ID::" },
        { name = "GOOGLE_CLIENT_SECRET", valueFrom = "${aws_secretsmanager_secret.backend.arn}:GOOGLE_CLIENT_SECRET::" },
        { name = "OPENAI_API_KEY", valueFrom = "${aws_secretsmanager_secret.backend.arn}:OPENAI_API_KEY::" }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "backend" {
  name            = "backend-svc"
  cluster         = local.cluster_name
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = local.private_subnet_ids
    security_groups  = [local.backend_sg_id]
    assign_public_ip = "DISABLED"
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener_rule.api]
}