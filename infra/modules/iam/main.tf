data "aws_iam_policy_document" "ecs_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# タスク実行ロール: ECSが「イメージ取得・シークレット読み取り・ログ出力」に使う
resource "aws_iam_role" "execution" {
  name               = "sample-app-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}

resource "aws_iam_role_policy_attachment" "execution_base" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  name = "read-secrets"
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = "*"
    }]
  })
}

# タスクロール: コンテナ(アプリ)が実行時にAWSサービスへアクセスする際に使う(今回は最小限)
resource "aws_iam_role" "task" {
  name               = "sample-app-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume.json
}
