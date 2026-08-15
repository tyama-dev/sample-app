output "alb_sg_id" {
  value = aws_security_group.alb.id
}

output "web_sg_id" {
  value = aws_security_group.web.id
}

output "api_sg_id" {
  value = aws_security_group.api.id
}

output "keycloak_sg_id" {
  value = aws_security_group.keycloak.id
}
