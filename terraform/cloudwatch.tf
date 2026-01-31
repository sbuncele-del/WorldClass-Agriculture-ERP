resource "aws_cloudwatch_log_group" "backend" {
  name              = "/aws/ecs/worldclass-erp-backend"
  retention_in_days = 30
}

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "worldclass-erp-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ecs cpu utilization"
  alarm_actions       = [] # Add SNS topic ARN
  
  dimensions = {
    ClusterName = "worldclass-erp-cluster"
    ServiceName = "backend"
  }
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "worldclass-erp-memory-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ecs memory utilization"
  alarm_actions       = [] # Add SNS topic ARN
  
  dimensions = {
    ClusterName = "worldclass-erp-cluster"
    ServiceName = "backend"
  }
}
