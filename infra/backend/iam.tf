data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "task_execution" {
  name               = "backend-task-exec-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
}

resource "aws_iam_role_policy_attachment" "task_exec_managed" {
  role      = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Allow pulling secrets (core db secret + backend secret)
data "aws_iam_policy_document" "exec_secrets" {
  statement {
    effect = "Allow"
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      local.db_secret_arn,
      aws_secretsmanager_secret.backend.arn
    ]
  }
}

resource "aws_iam_policy" "exec_secrets" {
  name   = "backend-exec-secrets-read"
  policy = data.aws_iam_policy_document.exec_secrets.json
}

resource "aws_iam_role_policy_attachment" "task_exec_secrets_attach" {
  role      = aws_iam_role.task_execution.name
  policy_arn = aws_iam_policy.exec_secrets.arn
}

# Task role (app permissions). Keep empty for now; add S3/SQS etc later.
resource "aws_iam_role" "task_role" {
  name               = "backend-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json
}