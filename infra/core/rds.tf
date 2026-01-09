resource "aws_db_subnet_group" "postgres" {
  name       = "${var.name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${var.name}-db-subnet-group"
  })
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.name}-postgres"

  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage

  db_name  = var.postgres_db
  username = var.db_admin_user
  password = var.db_admin_password
  port     = var.postgres_port

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false
  publicly_accessible = false
  skip_final_snapshot = true

  deletion_protection = false

  tags = merge(local.common_tags, {
    Name = "${var.name}-postgres"
  })
}
