resource "aws_secretsmanager_secret" "prod_db" {
  name        = "prod/db"
  description = "Prod Postgres connection + credentials"
}

resource "aws_secretsmanager_secret_version" "prod_db" {
  secret_id = aws_secretsmanager_secret.prod_db.id

  secret_string = jsonencode({
    POSTGRES_USER     = var.app_db_user
    POSTGRES_PASSWORD = var.app_db_password
    POSTGRES_DB       = var.postgres_db
    POSTGRES_PORT     = tostring(var.postgres_port)

    POSTGRES_HOST     = aws_db_instance.postgres.address

    APP_DB_USER     = var.app_db_user
    APP_DB_PASSWORD = var.app_db_password

    DB_ADMIN_USER     = var.db_admin_user
    DB_ADMIN_PASSWORD = var.db_admin_password

    ML_API_URL         = "http://ml.ml.local:8000"
  })
}