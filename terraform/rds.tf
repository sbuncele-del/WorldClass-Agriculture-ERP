resource "aws_db_instance" "default" {
  identifier        = "worldclass-erp-prod"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.t3.medium"
  allocated_storage = 20
  storage_type      = "gp3"

  db_name  = "worldclass_erp"
  username = var.db_username
  password = var.db_password

  # GAP-012: Database backup automation
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"
  
  # GAP-011: SSL verification
  # Force SSL connection
  parameter_group_name = aws_db_parameter_group.default.name
  
  skip_final_snapshot = false
  final_snapshot_identifier = "worldclass-erp-prod-final"
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
  
  multi_az = true
  storage_encrypted = true
}

resource "aws_db_parameter_group" "default" {
  name   = "worldclass-erp-pg"
  family = "postgres15"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

resource "aws_security_group" "rds" {
  name        = "worldclass-erp-rds-sg"
  description = "Allow inbound traffic from ECS/EC2"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Adjust to VPC CIDR
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "worldclass-erp-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "My DB subnet group"
  }
}
