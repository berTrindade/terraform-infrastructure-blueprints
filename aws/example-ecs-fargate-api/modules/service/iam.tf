# modules/service/iam.tf
# IAM roles for ECS

# Task Execution Role (used by ECS to pull images, write logs)
resource "aws_iam_role" "execution" {
  name = var.execution_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Task Role (used by the container application)
resource "aws_iam_role" "task" {
  name = var.task_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = var.tags
}

# CloudWatch Logs policy for task role
resource "aws_iam_policy" "task_logs" {
  name = "${var.task_role_name}-logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.this.arn}:*"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "task_logs" {
  role       = aws_iam_role.task.name
  policy_arn = aws_iam_policy.task_logs.arn
}
