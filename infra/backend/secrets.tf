resource "aws_secretsmanager_secret" "backend" {
  name        = "prod/backend"
  description = "Backend application secrets (JWT, OAuth, OpenAI)"
}

resource "aws_secretsmanager_secret_version" "backend" {
  secret_id = aws_secretsmanager_secret.backend.id

  secret_string = jsonencode({
    JWT_SECRET_KEY       = var.jwt_secret_key
    GOOGLE_CLIENT_ID     = var.google_client_id
    GOOGLE_CLIENT_SECRET = var.google_client_secret
    OPENAI_API_KEY       = var.openai_api_key
    FRONTEND_BASE_URL    = var.frontend_base_url
  })
}
