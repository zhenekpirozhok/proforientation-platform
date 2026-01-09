resource "aws_ecs_task_definition" "flyway" {
  family                   = "flyway-migrate"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = aws_iam_role.task_execution.arn
  task_role_arn      = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name      = "flyway"
      image     = var.flyway_image
      essential = true

      environment = [
        { name = "FLYWAY_BASELINE_ON_MIGRATE", value = "true" },
        { name = "FLYWAY_CLEAN_DISABLED", value = "true" },
        { name = "FLYWAY_GROUP", value = "true" }
      ]

      secrets = [
        { name = "POSTGRES_HOST", valueFrom = "${local.db_secret_arn}:POSTGRES_HOST::" },
        { name = "POSTGRES_PORT", valueFrom = "${local.db_secret_arn}:POSTGRES_PORT::" },
        { name = "POSTGRES_DB", valueFrom = "${local.db_secret_arn}:POSTGRES_DB::" },

        { name = "DB_ADMIN_USER", valueFrom = "${local.db_secret_arn}:DB_ADMIN_USER::" },
        { name = "DB_ADMIN_PASSWORD", valueFrom = "${local.db_secret_arn}:DB_ADMIN_PASSWORD::" },

        { name = "APP_DB_USER", valueFrom = "${local.db_secret_arn}:APP_DB_USER::" },
        { name = "APP_DB_PASSWORD", valueFrom = "${local.db_secret_arn}:APP_DB_PASSWORD::" }
      ]

      entryPoint = ["sh", "-lc"]
      command = [<<-EOF
        set -eux

        echo "POSTGRES_HOST=$POSTGRES_HOST"
        echo "POSTGRES_PORT=$POSTGRES_PORT"
        echo "POSTGRES_DB=$POSTGRES_DB"
        echo "DB_ADMIN_USER=$DB_ADMIN_USER"
        echo "APP_DB_USER=$APP_DB_USER"

        flyway -v migrate \
          -url="jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}" \
          -user="${DB_ADMIN_USER}" \
          -password="${DB_ADMIN_PASSWORD}" \
          -placeholders.app_user_name="${APP_DB_USER}" \
          -placeholders.app_user_password="${APP_DB_PASSWORD}" \
          -placeholders.db_admin_name="${DB_ADMIN_USER}" \
          -placeholders.db_admin_password="${DB_ADMIN_PASSWORD}"
      EOF
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.flyway.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "flyway"
        }
      }
    }
  ])
}