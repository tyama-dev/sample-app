output "db_address" {
  value = aws_db_instance.this.address
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}

output "db_master_secret_arn" {
  value = aws_secretsmanager_secret.db_master.arn
}

output "db_master_password" {
  value     = random_password.master.result
  sensitive = true
}
