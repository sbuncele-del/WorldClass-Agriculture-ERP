resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "worldclass-erp-redis-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_security_group" "redis_sg" {
  name        = "worldclass-erp-redis-sg"
  description = "Allow Redis traffic"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Adjust based on your VPC CIDR
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "worldclass-erp-redis"
  description                = "Redis cluster for WorldClass ERP"
  node_type                  = "cache.t3.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  automatic_failover_enabled = true
  num_node_groups            = 1
  replicas_per_node_group    = 1
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids         = [aws_security_group.redis_sg.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "WorldClass-ERP-Redis"
  }
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}
