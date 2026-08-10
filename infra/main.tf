module "ecr_web" {
  source          = "./modules/ecr"
  repository_name = "sample-app-web"
}

module "ecr_api" {
  source          = "./modules/ecr"
  repository_name = "sample-app-api"
}
