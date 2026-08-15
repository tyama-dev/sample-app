variable "name" {
  description = "ロググループ名(例: /ecs/sample-app-web)"
  type        = string
}

variable "retention_in_days" {
  description = "ログの保持期間(日数)"
  type        = number
}
