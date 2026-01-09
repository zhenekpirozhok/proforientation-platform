resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/backend"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "flyway" {
  name              = "/ecs/flyway"
  retention_in_days = 14
}