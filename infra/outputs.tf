output "ecr_web_url" {
  value = module.ecr_web.repository_url
}

output "ecr_api_url" {
  value = module.ecr_api.repository_url
}
