variable "name" {
  type = string
}
variable "cluster_id" {
  type = string
}
variable "image" {
  type = string
}
variable "cpu" {
  type = number
}
variable "memory" {
  type = number
}
variable "container_port" {
  type = number
}
variable "execution_role_arn" {
  type = string
}
variable "task_role_arn" {
  type = string
}
variable "log_group_name" {
  type = string
}
variable "region" {
  type = string
}
variable "subnet_ids" {
  type = list(string)
}
variable "security_group_ids" {
  type = list(string)
}
variable "environment" {
  type    = list(object({ name = string, value = string }))
  default = []
}
variable "secrets" {
  type    = list(object({ name = string, valueFrom = string }))
  default = []
}
variable "desired_count" {
  type    = number
  default = 1
}
variable "target_group_arn" {
  type    = string
  default = null
}
variable "service_registry_arn" {
  type    = string
  default = null
}
